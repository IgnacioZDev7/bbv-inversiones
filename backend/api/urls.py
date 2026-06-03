from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views.financials import EmpresaViewSet, SectorEmpresaViewSet, ReporteFinancieroViewSet
from api.views.accounts import UsuarioViewSet
from api.views.analytics import IndicadorViewSet, SimulacionViewSet, RecomendacionViewSet
from api.views.biometrics import VerifyIdentityView, LivenessDetectionView
from api.views.chat import ChatView
from apps.accounts.views import GoogleLogin, UserMeView

router = DefaultRouter()
router.register(r'usuarios', UsuarioViewSet, basename='usuario')
router.register(r'empresas', EmpresaViewSet, basename='empresa')
router.register(r'sectores', SectorEmpresaViewSet, basename='sector')
router.register(r'reportes', ReporteFinancieroViewSet, basename='reporte')
router.register(r'indicadores', IndicadorViewSet, basename='indicador')
router.register(r'simulator', SimulacionViewSet, basename='simulacion')
router.register(r'recomendaciones', RecomendacionViewSet, basename='recomendacion')

urlpatterns = [
    path('', include(router.urls)),
    
    # Endpoints de Autenticación
    path('accounts/me/', UserMeView.as_view(), name='user-me'),
    path('auth/', include('dj_rest_auth.urls')),
    path('auth/google/', GoogleLogin.as_view(), name='google_login'),

    # Biometrics — Verificación facial y liveness
    path('biometrics/verify/', VerifyIdentityView.as_view(), name='biometrics-verify'),
    path('biometrics/liveness/', LivenessDetectionView.as_view(), name='biometrics-liveness'),

    # Chat — Asistente financiero con Gemini
    path('chat/', ChatView.as_view(), name='chat'),
]
