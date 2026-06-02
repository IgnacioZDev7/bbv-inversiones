import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from apps.accounts.models import Usuario
from django.contrib.auth.models import Group

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def user_data():
    return {
        "username": "testuser",
        "email": "test@example.com",
        "password": "testpassword123",
        "nombre": "Test",
        "apellido_paterno": "User",
        "ci": "1234567",
        "celular": "77777777"
    }

@pytest.fixture
def authenticated_client(api_client, user_data):
    user = Usuario.objects.create_user(**user_data)
    api_client.force_authenticate(user=user)
    return api_client, user

@pytest.mark.django_db
class TestAccounts:
    
    def test_get_me(self, authenticated_client):
        client, user = authenticated_client
        url = reverse('usuario-me')
        response = client.get(url)
        
        assert response.status_code == 200
        assert response.data['username'] == user.username
        assert response.data['profile_complete'] is True

    def test_completar_perfil_oauth_user(self, api_client):
        # Crear un usuario "incompleto" como si viniera de Google
        user = Usuario.objects.create(
            username="google_user",
            email="google@example.com",
            nombre="Google",
            apellido_paterno=None, # Incompleto
            ci=None, # Incompleto
            celular=None # Incompleto
        )
        api_client.force_authenticate(user=user)
        
        url = reverse('usuario-completar-perfil')
        data = {
            "ci": "9999999",
            "celular": "66666666",
            "apellido_paterno": "Vargas"
        }
        
        response = api_client.patch(url, data)
        
        assert response.status_code == 200
        assert response.data['profile_complete'] is True
        assert response.data['ci'] == "9999999"
        
        # Verificar en DB
        user.refresh_from_db()
        assert user.ci == "9999999"
        assert user.is_profile_complete is True

    def test_completar_perfil_ci_duplicado(self, api_client):
        # Usuario 1 con CI
        Usuario.objects.create(username="u1", ci="111")
        
        # Usuario 2 intenta ponerse el mismo CI
        user2 = Usuario.objects.create(username="u2", ci=None)
        api_client.force_authenticate(user=user2)
        
        url = reverse('usuario-completar-perfil')
        response = api_client.patch(url, {"ci": "111", "celular": "70000000", "apellido_paterno": "Test"})
        
        assert response.status_code == 400
        assert "ci" in response.data or "non_field_errors" in response.data

    def test_completar_perfil_datos_faltantes(self, api_client):
        user = Usuario.objects.create(username="incomplete", ci=None)
        api_client.force_authenticate(user=user)
        
        url = reverse('usuario-completar-perfil')
        # No enviamos apellido_paterno
        response = api_client.patch(url, {"ci": "222", "celular": "70000000"})
        
        # Como es PATCH parcial, no fallará por falta de campos si no están en el body,
        # pero profile_complete seguirá siendo False si no se mandan.
        # Sin embargo, queremos que el frontend mande todo.
        
        assert response.status_code == 200
        assert response.data['profile_complete'] is False # Sigue incompleto porque falta apellido
