from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _
from .models import (
    Usuario,
    Genero,
    Direccion,
    PerfilUsuario,
    SesionUsuario,
)

class UsuarioAdmin(UserAdmin):
    """
    Personalización de UsuarioAdmin extendiendo UserAdmin para soportar 
    campos personalizados y mantener funcionalidad de grupos/permisos.
    """
    list_display = ('username', 'email', 'nombre', 'apellido_paterno', 'get_groups', 'activo', 'is_staff')
    list_filter = ('groups', 'activo', 'is_staff', 'is_superuser')
    search_fields = ('username', 'email', 'nombre', 'apellido_paterno', 'ci')
    ordering = ('username',)

    # Definimos fieldsets para organizar los campos en el formulario de edición
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        (_('Información Personal'), {'fields': ('nombre', 'apellido_paterno', 'apellido_materno', 'email', 'ci', 'fecha_nacimiento', 'genero', 'celular', 'foto_perfil')}),
        (_('Permisos'), {
            'fields': ('activo', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        (_('Fechas Importantes'), {'fields': ('last_login', 'date_joined')}),
    )

    # Definimos los campos para el formulario de creación (si es necesario)
    add_fieldsets = UserAdmin.add_fieldsets + (
        (_('Información Adicional'), {
            'fields': ('nombre', 'apellido_paterno', 'ci', 'email'),
        }),
    )

    def get_groups(self, obj):
        return ", ".join(group.name for group in obj.groups.all())
    get_groups.short_description = 'Grupos'

admin.site.register(Usuario, UsuarioAdmin)
admin.site.register(Genero)
admin.site.register(Direccion)
admin.site.register(PerfilUsuario)
admin.site.register(SesionUsuario)
