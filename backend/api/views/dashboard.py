from datetime import timedelta

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, F
from django.utils import timezone
from apps.financials.models import Empresa, SectorEmpresa, ReporteFinanciero
from apps.accounts.models import Usuario

DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, format=None):
        total_empresas = Empresa.objects.count()
        total_sectores = SectorEmpresa.objects.filter(activo=True).count()
        total_reportes = ReporteFinanciero.objects.count()
        total_usuarios = Usuario.objects.count()

        empresas_procesadas = (
            Empresa.objects.filter(reportes__estado_procesamiento="PROCESADO")
            .distinct()
            .count()
        )

        reportes_procesados = ReporteFinanciero.objects.filter(
            estado_procesamiento="PROCESADO"
        ).count()
        reportes_con_error = ReporteFinanciero.objects.filter(
            estado_procesamiento="ERROR"
        ).count()
        reportes_pendientes = ReporteFinanciero.objects.filter(
            estado_procesamiento="PENDIENTE"
        ).count()

        ultimos_reportes_raw = list(
            ReporteFinanciero.objects.filter(estado_procesamiento="PROCESADO")
            .select_related("empresa")
            .order_by("-updated_at")[:10]
            .values("empresa__nombre", "gestion", "trimestre", "estado_procesamiento", "updated_at")
        )
        ultimos_reportes = [
            {
                "empresa_nombre": r["empresa__nombre"],
                "gestion": r["gestion"],
                "trimestre": r["trimestre"],
                "estado_procesamiento": r["estado_procesamiento"],
                "updated_at": r["updated_at"],
            }
            for r in ultimos_reportes_raw
        ]

        empresas_por_sector = [
            {"sector_nombre": r["nombre"], "count": r["count"]}
            for r in SectorEmpresa.objects.filter(activo=True, empresas__isnull=False)
            .annotate(count=Count("empresas"))
            .values("nombre", "count")
        ]

        reportes_por_estado = list(
            ReporteFinanciero.objects.values("estado_procesamiento")
            .annotate(count=Count("id_reporte"))
            .values(estado=F("estado_procesamiento"), count=F("count"))
        )

        ultimos_usuarios_raw = list(
            Usuario.objects.order_by("-created_at")[:5].values(
                "id_usuario", "nombre", "email", "activo", "created_at"
            )
        )
        ultimos_usuarios = []
        for u in ultimos_usuarios_raw:
            try:
                user = Usuario.objects.get(id_usuario=u["id_usuario"])
                group_names = [g.name for g in user.groups.all()]
            except Usuario.DoesNotExist:
                group_names = []
            ultimos_usuarios.append({
                "nombre": u["nombre"],
                "email": u["email"],
                "group_names": group_names,
                "activo": u["activo"],
                "created_at": u["created_at"].isoformat() if u["created_at"] else None,
            })

        hoy = timezone.localdate()
        actividad_7_dias = []
        for i in range(6, -1, -1):
            dia = hoy - timedelta(days=i)
            reportes_del_dia = ReporteFinanciero.objects.filter(updated_at__date=dia)
            actividad_7_dias.append(
                {
                    "fecha": dia.isoformat(),
                    "dia_semana": DIAS_SEMANA[dia.weekday()],
                    "procesados": reportes_del_dia.filter(estado_procesamiento="PROCESADO").count(),
                    "errores": reportes_del_dia.filter(estado_procesamiento="ERROR").count(),
                }
            )

        return Response(
            {
                "total_empresas": total_empresas,
                "total_sectores": total_sectores,
                "total_reportes": total_reportes,
                "total_usuarios": total_usuarios,
                "empresas_procesadas": empresas_procesadas,
                "reportes_procesados": reportes_procesados,
                "reportes_con_error": reportes_con_error,
                "reportes_pendientes": reportes_pendientes,
                "ultimos_reportes": ultimos_reportes,
                "empresas_por_sector": empresas_por_sector,
                "reportes_por_estado": reportes_por_estado,
                "ultimos_usuarios": ultimos_usuarios,
                "actividad_7_dias": actividad_7_dias,
            }
        )
