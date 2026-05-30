from django.db import models

from apps.financials.models import Empresa
from apps.financials.models import ReporteFinanciero


class ProcesoCarga(models.Model):

    ESTADOS = [
        ("pendiente", "Pendiente"),
        ("en_proceso", "En Proceso"),
        ("exitoso", "Exitoso"),
        ("fallido", "Fallido"),
    ]

    TIPOS = [
        ("descarga", "Descarga"),
        ("extraccion", "Extracción"),
        ("limpieza", "Limpieza"),
        ("calculo", "Cálculo"),
        ("carga_completa", "Carga Completa"),
    ]

    id_proceso = models.AutoField(
        primary_key=True
    )

    empresa = models.ForeignKey(
        Empresa,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="procesos"
    )

    reporte = models.ForeignKey(
        ReporteFinanciero,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="procesos"
    )

    tipo_proceso = models.CharField(
        max_length=50,
        choices=TIPOS
    )

    estado = models.CharField(
        max_length=50,
        choices=ESTADOS,
        default="pendiente"
    )

    fecha_inicio = models.DateTimeField(
        auto_now_add=True
    )

    fecha_fin = models.DateTimeField(
        null=True,
        blank=True
    )

    detalle = models.TextField(
        blank=True,
        null=True
    )

    mensaje_error = models.TextField(
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        db_table = "proceso_carga"

    def __str__(self):
        return f"{self.tipo_proceso} - {self.estado}"