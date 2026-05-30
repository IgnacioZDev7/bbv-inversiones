from django.contrib import admin

from .models import (
    BitacoraSistema,
    ConfiguracionSistema,
    TareaProgramada,
    EjecucionTarea,
)

admin.site.register(BitacoraSistema)
admin.site.register(ConfiguracionSistema)
admin.site.register(TareaProgramada)
admin.site.register(EjecucionTarea)