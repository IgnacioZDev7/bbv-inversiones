from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views.financials import EmpresaViewSet, SectorEmpresaViewSet, ReporteFinancieroViewSet
from api.views.accounts import UsuarioViewSet

router = DefaultRouter()
router.register(r'empresas', EmpresaViewSet, basename='empresa')
router.register(r'sectores', SectorEmpresaViewSet, basename='sector')
router.register(r'reportes', ReporteFinancieroViewSet, basename='reporte')
router.register(r'usuarios', UsuarioViewSet, basename='usuario')

urlpatterns = [
    path('', include(router.urls)),
]
