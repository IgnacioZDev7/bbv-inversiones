from django.db import models


class ArchivoProcesado(models.Model):
    id_archivo = models.AutoField(primary_key=True)

    reporte = models.ForeignKey(
        "financials.ReporteFinanciero",
        on_delete=models.CASCADE,
        related_name="archivos_procesados"
    )

    nombre_archivo = models.CharField(max_length=255)
    ruta_archivo = models.CharField(max_length=500)
    hash_archivo = models.CharField(max_length=255)
    tipo_archivo = models.CharField(max_length=50)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "archivo_procesado"

    def __str__(self):
        return self.nombre_archivo