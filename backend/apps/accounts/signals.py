from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import Group
from allauth.socialaccount.signals import social_account_added
from .models import Usuario, PerfilUsuario

@receiver(post_save, sender=Usuario)
def create_user_profile(sender, instance, created, **kwargs):
    """
    Crea automáticamente el PerfilUsuario y asigna el grupo 'Inversionista'
    al registrar un nuevo usuario (tanto manual como social).
    """
    if created:
        # Crear Perfil (get_or_create para mayor seguridad)
        PerfilUsuario.objects.get_or_create(usuario=instance)
        
        # Asignar grupo Inversionista por defecto si no lo tiene ya
        try:
            group = Group.objects.get(name='Inversionista')
            if not instance.groups.filter(name='Inversionista').exists():
                instance.groups.add(group)
        except Group.DoesNotExist:
            # En caso de que no se hayan corrido los comandos iniciales
            pass

@receiver(social_account_added)
def assign_default_group_social(request, sociallogin, **kwargs):
    """
    Garantiza que los usuarios de redes sociales tengan el grupo Inversionista.
    Nota: post_save suele encargarse de esto, pero allauth puede disparar flujos distintos.
    """
    try:
        group = Group.objects.get(name='Inversionista')
        if not sociallogin.user.groups.filter(name='Inversionista').exists():
            sociallogin.user.groups.add(group)
    except Group.DoesNotExist:
        pass
