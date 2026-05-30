from django.db import models
from apps.financials.models import ReporteFinanciero


class CatalogoIndicador(models.Model):
    id_catalogo_indicador = models.AutoField(primary_key=True)

    nombre = models.CharField(max_length=150)

    codigo = models.CharField(
        max_length=50,
        unique=True
    )

    descripcion = models.TextField(
        blank=True,
        null=True
    )

    formula = models.TextField(
        blank=True,
        null=True
    )

    activo = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "catalogo_indicador"

    def __str__(self):
        return self.nombre


class IndicadorFinanciero(models.Model):
    id_indicador = models.AutoField(primary_key=True)

    reporte = models.ForeignKey(
        ReporteFinanciero,
        on_delete=models.CASCADE,
        related_name="indicadores"
    )

    score_financiero = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        blank=True,
        null=True
    )

    clasificacion_riesgo = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    recomendacion = models.CharField(
        max_length=200,
        blank=True,
        null=True
    )

    resumen_interpretativo = models.TextField(
        blank=True,
        null=True
    )

    fecha_calculo = models.DateTimeField(
        auto_now=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "indicador_financiero"

    def __str__(self):
        return f"Indicadores {self.id_indicador}"


class ValorIndicador(models.Model):
    id_valor = models.AutoField(primary_key=True)

    indicador = models.ForeignKey(
        IndicadorFinanciero,
        on_delete=models.CASCADE,
        related_name="valores"
    )

    catalogo_indicador = models.ForeignKey(
        CatalogoIndicador,
        on_delete=models.PROTECT,
        related_name="valores"
    )

    valor = models.DecimalField(
        max_digits=18,
        decimal_places=6
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "valor_indicador"

    def __str__(self):
        return f"{self.catalogo_indicador.codigo}: {self.valor}"