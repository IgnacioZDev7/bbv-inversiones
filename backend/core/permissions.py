from rest_framework.permissions import BasePermission

class IsAdministrador(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            request.user.groups.filter(name="Administrador").exists()
        )

class IsAuditor(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            request.user.groups.filter(name="Auditor").exists()
        )

class IsAnalista(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            request.user.groups.filter(name="Analista").exists()
        )

class IsInversionista(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            request.user.groups.filter(name="Inversionista").exists()
        )

# Permisos Combinados
class CanViewAudit(BasePermission):
    """Admin y Auditor pueden ver auditoría."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.groups.filter(name__in=["Administrador", "Auditor"]).exists()

class CanManageData(BasePermission):
    """Admin y Analista pueden gestionar datos."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.groups.filter(name__in=["Administrador", "Analista"]).exists()

class CanSimulate(BasePermission):
    """Admin, Analista e Inversionista pueden realizar simulaciones."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.groups.filter(name__in=["Administrador", "Analista", "Inversionista"]).exists()
