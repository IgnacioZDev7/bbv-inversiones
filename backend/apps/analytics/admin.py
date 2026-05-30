from django.contrib import admin

from .models import (
    CatalogoIndicador,
    IndicadorFinanciero,
    ValorIndicador,
    SimulacionFinanciera,
    RecomendacionIA,
)

admin.site.register(CatalogoIndicador)
admin.site.register(IndicadorFinanciero)
admin.site.register(ValorIndicador)
admin.site.register(SimulacionFinanciera)
admin.site.register(RecomendacionIA)