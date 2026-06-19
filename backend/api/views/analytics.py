from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.analytics.models import (
    IndicadorFinanciero, 
    CatalogoIndicador,
    SimulacionFinanciera,
    RecomendacionIA
)
from apps.analytics.services import (
    AnalysisEngine,
    SimulationService,
    RecommendationService
)
from api.serializers.analytics import (
    IndicadorFinancieroSerializer, 
    CatalogoIndicadorSerializer,
    SimulacionSerializer,
    RecomendacionSerializer
)
from apps.financials.models import ReporteFinanciero

class IndicadorViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para consultar indicadores financieros calculados.
    """
    queryset = IndicadorFinanciero.objects.all().order_by('-reporte__gestion', '-reporte__trimestre')
    serializer_class = IndicadorFinancieroSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        empresa_id = self.request.query_params.get('empresa')
        if empresa_id:
            queryset = queryset.filter(reporte__empresa_id=empresa_id)
        return queryset

    @action(detail=False, methods=['get'])
    def resumen(self, request):
        """
        Retorna el indicador más reciente de una empresa.
        """
        empresa_id = request.query_params.get('empresa')
        if not empresa_id:
            return Response({"error": "Debe proporcionar el ID de la empresa"}, status=400)
        
        latest = self.get_queryset().filter(reporte__empresa_id=empresa_id).first()
        if not latest:
            return Response({"mensaje": "No hay indicadores para esta empresa"}, status=404)
        
        serializer = self.get_serializer(latest)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def historico(self, request):
        """
        Retorna la serie histórica de indicadores para gráficos.
        """
        empresa_id = request.query_params.get('empresa')
        if not empresa_id:
            return Response({"error": "Debe proporcionar el ID de la empresa"}, status=400)
        
        queryset = self.get_queryset().filter(reporte__empresa_id=empresa_id).order_by('reporte__gestion', 'reporte__trimestre')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def recalcular(self, request):
        """
        Fuerza el recalculo de indicadores para todos los reportes de una empresa.
        """
        empresa_id = request.query_params.get('empresa')
        if not empresa_id:
            return Response({"error": "Debe proporcionar el ID de la empresa"}, status=400)
        
        reportes = ReporteFinanciero.objects.filter(empresa_id=empresa_id, estado_procesamiento='PROCESADO')
        engine = AnalysisEngine()
        
        resultados = []
        for reporte in reportes:
            ind = engine.process_report(reporte.id_reporte)
            if ind:
                resultados.append(ind.id_indicador)
        
        return Response({
            "mensaje": f"Se recalcularon {len(resultados)} reportes para la empresa {empresa_id}",
            "indicadores_ids": resultados
        })


class SimulacionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para ejecutar y consultar simulaciones financieras.
    """
    queryset = SimulacionFinanciera.objects.all()
    serializer_class = SimulacionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(usuario=self.request.user)

    @action(detail=False, methods=['post'])
    def execute(self, request):
        """
        Ejecuta una simulación basada en rendimiento histórico y volatilidad.
        """
        empresa_id = request.data.get('empresa_id')
        monto = request.data.get('monto')
        anios = request.data.get('horizonte', 1)
        modo = request.data.get('modo', 'basico')

        if not empresa_id or not monto:
            return Response({"error": "Debe proporcionar empresa_id y monto"}, status=400)

        service = SimulationService()
        try:
            resultado = service.calculate_simulation(empresa_id, monto, anios, modo)
            
            score_map = {"Alta": 90, "Media": 65, "Baja": 40}
            SimulacionFinanciera.objects.create(
                usuario=request.user,
                nombre_simulacion=f"Simulación {empresa_id} - {anios} años",
                parametros={"monto": monto, "anios": anios, "empresa": empresa_id, "modo": modo},
                resultado=resultado,
                score_confianza=score_map.get(resultado.get("confidence_score"), 50)
            )
            
            return Response(resultado, status=201)
        except ValueError as e:
            return Response({"error": str(e)}, status=400)


class RecomendacionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para obtener recomendaciones de inversión basadas en IA.
    """
    queryset = RecomendacionIA.objects.all()
    serializer_class = RecomendacionSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def top(self, request):
        """
        Retorna el ranking de empresas recomendadas.
        """
        service = RecommendationService()
        data = service.get_top_recommendations()
        return Response(data)
