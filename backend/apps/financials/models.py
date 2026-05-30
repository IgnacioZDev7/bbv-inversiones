from django.db import models


class SectorEmpresa(models.Model):
    id_sector = models.AutoField(primary_key=True)

    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)

    activo = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "sector_empresa"
        verbose_name = "Sector Empresa"
        verbose_name_plural = "Sectores Empresa"

    def __str__(self):
        return self.nombre


class Empresa(models.Model):
    id_empresa = models.AutoField(primary_key=True)

    nombre = models.CharField(max_length=255)

    codigo_bbv = models.CharField(
        max_length=50,
        unique=True
    )

    sigla = models.CharField(
        max_length=20,
        blank=True,
        null=True
    )

    sector = models.ForeignKey(
        SectorEmpresa,
        on_delete=models.PROTECT,
        related_name="empresas"
    )

    descripcion = models.TextField(
        blank=True,
        null=True
    )

    sitio_web = models.URLField(
        blank=True,
        null=True
    )

    activa = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "empresa"
        ordering = ["nombre"]

    def __str__(self):
        return self.nombre


class ReporteFinanciero(models.Model):

    TIPO_PERIODO = (
        ("TRIMESTRAL", "Trimestral"),
        ("ANUAL", "Anual"),
    )

    ESTADO_PROCESAMIENTO = (
        ("PENDIENTE", "Pendiente"),
        ("DESCARGADO", "Descargado"),
        ("PROCESADO", "Procesado"),
        ("ERROR", "Error"),
    )

    id_reporte = models.AutoField(primary_key=True)

    empresa = models.ForeignKey(
        Empresa,
        on_delete=models.CASCADE,
        related_name="reportes"
    )

    gestion = models.IntegerField()

    tipo_periodo = models.CharField(
        max_length=20,
        choices=TIPO_PERIODO
    )

    trimestre = models.IntegerField(
        blank=True,
        null=True
    )

    fecha_publicacion = models.DateField(
        blank=True,
        null=True
    )

    fecha_descarga = models.DateTimeField(
        blank=True,
        null=True
    )

    url_pdf = models.URLField(max_length=500)

    nombre_archivo = models.CharField(
        max_length=255,
        blank=True,
        null=True
    )

    ruta_archivo = models.CharField(
        max_length=500,
        blank=True,
        null=True
    )

    hash_archivo = models.CharField(
        max_length=255,
        blank=True,
        null=True
    )

    tamano_archivo = models.BigIntegerField(
        blank=True,
        null=True
    )

    estado_procesamiento = models.CharField(
        max_length=50,
        choices=ESTADO_PROCESAMIENTO,
        default="PENDIENTE"
    )

    mensaje_error = models.TextField(
        blank=True,
        null=True
    )

    datos_extraidos_json = models.JSONField(
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "reporte_financiero"

    def __str__(self):
        return f"{self.empresa.nombre} - {self.gestion}"


