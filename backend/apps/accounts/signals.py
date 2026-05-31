from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import Group
from allauth.socialaccount.signals import social_account_added
from .models import Usuario

@receiver(social_account_added)
def assign_default_group(request, sociallogin, **kwargs):
    """
    Asigna automáticamente el grupo 'Inversionista' a los usuarios 
    que se registran por primera vez con una cuenta social (Google).
    """
    try:
        group = Group.objects.get(name='Inversionista')
        sociallogin.user.groups.add(group)
    except Group.DoesNotExist:
        # Si el grupo no existe, podrías loguear el error o crearlo
        pass
