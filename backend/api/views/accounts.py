from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from rest_framework import status
from apps.accounts.models import Usuario
from django.contrib.auth.models import Group
from api.serializers.accounts import UsuarioSerializer, CompletarPerfilSerializer
from core.permissions import IsAdministrador

class UsuarioViewSet(ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy", "cambiar_grupo"]:
            return [IsAuthenticated(), IsAdministrador()]
        return [IsAuthenticated()]

    def _block_self_deactivation(self, request, instance):
        """Un administrador no puede desactivar su propia cuenta."""
        if instance.pk == request.user.pk:
            activo = request.data.get('activo')
            if activo is not None and not activo:
                raise PermissionDenied("No puedes desactivar tu propia cuenta.")

    def update(self, request, *args, **kwargs):
        self._block_self_deactivation(request, self.get_object())
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        self._block_self_deactivation(request, self.get_object())
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.pk == request.user.pk:
            raise PermissionDenied("No puedes eliminar tu propia cuenta.")
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=['get', 'patch'], url_path='me')
    def me(self, request):
        """
        Retorna o actualiza el perfil del usuario autenticado.
        """
        if request.method == 'PATCH':
            serializer = self.get_serializer(request.user, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['patch'], url_path='me/completar_perfil')
    def completar_perfil(self, request):
        """
        Endpoint dedicado para el onboarding de nuevos usuarios (especialmente OAuth).
        Valida CI, celular y apellido paterno.
        """
        serializer = CompletarPerfilSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        # Devolvemos el usuario completo tras la actualización
        full_serializer = UsuarioSerializer(request.user)
        return Response(full_serializer.data)

    @action(detail=True, methods=['post'], url_path='cambiar-grupo')
    def cambiar_grupo(self, request, pk=None):
        """
        Cambia el grupo principal de un usuario.
        Se espera 'nombre_grupo' en el body.
        """
        usuario = self.get_object()

        if usuario.pk == request.user.pk:
            return Response(
                {"error": "No puedes cambiar tu propio rol."},
                status=status.HTTP_400_BAD_REQUEST
            )

        nombre_grupo = request.data.get('nombre_grupo')

        if not nombre_grupo:
            return Response(
                {"error": "Debe proporcionar 'nombre_grupo'"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            grupo = Group.objects.get(name=nombre_grupo)
            # Reemplazamos todos los grupos por este nuevo "grupo principal"
            usuario.groups.set([grupo])
            return Response({
                "mensaje": f"Usuario {usuario.username} asignado al grupo {nombre_grupo}",
                "grupos": [g.name for g in usuario.groups.all()]
            })
        except Group.DoesNotExist:
            return Response(
                {"error": f"El grupo '{nombre_grupo}' no existe"},
                status=status.HTTP_404_NOT_FOUND
            )
