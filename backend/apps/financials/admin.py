from django.contrib import admin

from .models import (
    SectorEmpresa,
    Empresa,
    ReporteFinanciero,
)

admin.site.register(SectorEmpresa)
admin.site.register(Empresa)
admin.site.register(ReporteFinanciero)