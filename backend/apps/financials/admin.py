from django.contrib import admin

from .models import (
    Empresa,
    ReporteFinanciero,
)


admin.site.register(Empresa)
admin.site.register(ReporteFinanciero)