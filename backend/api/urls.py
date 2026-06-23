from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views.financials import EmpresaViewSet, SectorEmpresaViewSet, ReporteFinancieroViewSet
from api.views.accounts import UsuarioViewSet
from api.views.analytics import IndicadorViewSet, SimulacionViewSet, RecomendacionViewSet
from api.views.biometrics import VerifyIdentityView, LivenessDetectionView, DocumentValidationView, PoseVerificationView
from api.views.chat import ChatView
from api.views.dashboard import DashboardView
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

    # Biometrics — Verificación facial, liveness y validación documental
    path('biometrics/verify/', VerifyIdentityView.as_view(), name='biometrics-verify'),
    path('biometrics/liveness/', LivenessDetectionView.as_view(), name='biometrics-liveness'),
    path('biometrics/validate-document/', DocumentValidationView.as_view(), name='biometrics-validate-document'),
    path('biometrics/verify-poses/', PoseVerificationView.as_view(), name='biometrics-verify-poses'),

    # Chat — Asistente financiero con Gemini
    path('chat/', ChatView.as_view(), name='chat'),

    # Dashboard — Datos agregados para la vista principal
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
]
