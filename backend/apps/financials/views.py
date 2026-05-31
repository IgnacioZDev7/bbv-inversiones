from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from apps.financials.models import Empresa
from apps.financials.serializers import EmpresaSerializer
from core.permissions import IsAnalista, IsAdministrador


class EmpresaViewSet(ModelViewSet):
    queryset = Empresa.objects.all()
    serializer_class = EmpresaSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAuthenticated(), (IsAnalista | IsAdministrador)()]

        return [IsAuthenticated()]