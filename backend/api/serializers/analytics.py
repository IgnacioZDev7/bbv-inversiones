from rest_framework import serializers
from apps.analytics.models import (
    CatalogoIndicador, 
    IndicadorFinanciero, 
    ValorIndicador,
    SimulacionFinanciera,
    RecomendacionIA
)

class CatalogoIndicadorSerializer(serializers.ModelSerializer):
    class Meta:
        model = CatalogoIndicador
        fields = ['codigo', 'nombre', 'descripcion', 'formula']

class ValorIndicadorSerializer(serializers.ModelSerializer):
    codigo = serializers.ReadOnlyField(source='catalogo_indicador.codigo')
    nombre = serializers.ReadOnlyField(source='catalogo_indicador.nombre')

    class Meta:
        model = ValorIndicador
        fields = ['codigo', 'nombre', 'valor']

class IndicadorFinancieroSerializer(serializers.ModelSerializer):
    valores = ValorIndicadorSerializer(many=True, read_only=True)
    gestion = serializers.ReadOnlyField(source='reporte.gestion')
    trimestre = serializers.ReadOnlyField(source='reporte.trimestre')
    empresa_nombre = serializers.ReadOnlyField(source='reporte.empresa.nombre')

    class Meta:
        model = IndicadorFinanciero
        fields = [
            'id_indicador',
            'gestion',
            'trimestre',
            'empresa_nombre',
            'score_financiero',
            'clasificacion_riesgo',
            'recomendacion',
            'valores',
            'fecha_calculo'
        ]

class SimulacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SimulacionFinanciera
        fields = '__all__'
        read_only_fields = ['id_simulacion', 'usuario', 'created_at']

class RecomendacionSerializer(serializers.ModelSerializer):
    empresa_nombre = serializers.ReadOnlyField(source='empresa.nombre')

    class Meta:
        model = RecomendacionIA
        fields = '__all__'
        read_only_fields = ['id_recomendacion', 'usuario', 'created_at']
