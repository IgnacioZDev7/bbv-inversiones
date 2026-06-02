from allauth.socialaccount.adapter import DefaultSocialAccountAdapter

class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    def populate_user(self, request, sociallogin, data):
        """
        Mapea los datos provenientes de Google OAuth a los campos
        personalizados del modelo Usuario.
        """
        user = super().populate_user(request, sociallogin, data)
        
        # Mapeo de datos de Google
        # data contiene 'first_name', 'last_name', 'email', etc.
        user.nombre = data.get('first_name', '')
        user.apellido_paterno = data.get('last_name', '')
        
        # Marcar como usuario de Google
        user.oauth_google = True
        
        return user
