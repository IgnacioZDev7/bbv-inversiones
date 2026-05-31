from rest_framework import serializers
from apps.financials.models import Empresa, SectorEmpresa, ReporteFinanciero

class SectorEmpresaSerializer(serializers.ModelSerializer):
    class Meta:
        model = SectorEmpresa
        fields = '__all__'

class EmpresaSerializer(serializers.ModelSerializer):
    sector_nombre = serializers.ReadOnlyField(source='sector.nombre')
    
    class Meta:
        model = Empresa
        fields = '__all__'

class ReporteFinancieroSerializer(serializers.ModelSerializer):
    empresa_nombre = serializers.ReadOnlyField(source='empresa.nombre')
    
    class Meta:
        model = ReporteFinanciero
        fields = '__all__'
