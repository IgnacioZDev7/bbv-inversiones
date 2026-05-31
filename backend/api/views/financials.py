from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.financials.models import (
    Empresa,
    SectorEmpresa,
    ReporteFinanciero
)

from api.serializers.financials import (
    EmpresaSerializer,
    SectorEmpresaSerializer,
    ReporteFinancieroSerializer
)

from core.permissions import CanManageData
from services.ingestion.pipeline import FinancialPipeline


class SectorEmpresaViewSet(ModelViewSet):
    queryset = SectorEmpresa.objects.all()
    serializer_class = SectorEmpresaSerializer
    permission_classes = [IsAuthenticated]


class EmpresaViewSet(ModelViewSet):
    queryset = Empresa.objects.all()
    serializer_class = EmpresaSerializer

    def get_permissions(self):
        """
        Solo Administrador y Analista pueden:
        - Crear
        - Editar
        - Eliminar
        - Ejecutar actualización manual de reportes
        """

        if self.action in [
            "create",
            "update",
            "partial_update",
            "destroy",
            "actualizar_reportes",
        ]:
            return [IsAuthenticated(), CanManageData()]

        return [IsAuthenticated()]

    @action(
        detail=True,
        methods=["post"],
        url_path="actualizar-reportes"
    )
    def actualizar_reportes(self, request, pk=None):
        empresa = self.get_object()

        gestion = request.data.get("gestion")
        trimestre = request.data.get("trimestre")

        if not gestion or not trimestre:
            return Response(
                {
                    "error": "Debe proporcionar gestion y trimestre"
                },
                status=400
            )

        try:
            pipeline = FinancialPipeline()

            resultado = pipeline.procesar_reporte(
                empresa,
                int(gestion),
                int(trimestre)
            )

            if resultado.get("success"):
                return Response(
                    {
                        "status": "Pipeline ejecutado correctamente",
                        "data": resultado
                    }
                )

            return Response(
                {
                    "status": "Error durante la ejecución",
                    "error": resultado.get("error")
                },
                status=500
            )

        except Exception as e:
            return Response(
                {
                    "status": "Error inesperado",
                    "error": str(e)
                },
                status=500
            )


class ReporteFinancieroViewSet(ModelViewSet):
    queryset = ReporteFinanciero.objects.all()
    serializer_class = ReporteFinancieroSerializer
    permission_classes = [IsAuthenticated]