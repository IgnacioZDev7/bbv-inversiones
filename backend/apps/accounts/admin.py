from django.contrib import admin

from .models import (
    Usuario,
    Genero,
    Direccion,
    PerfilUsuario,
    SesionUsuario,
)


admin.site.register(Usuario)
admin.site.register(Genero)
admin.site.register(Direccion)
admin.site.register(PerfilUsuario)
admin.site.register(SesionUsuario)