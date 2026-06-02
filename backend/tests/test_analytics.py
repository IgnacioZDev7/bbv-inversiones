import pytest
from decimal import Decimal
from apps.financials.models import Empresa, SectorEmpresa, ReporteFinanciero
from apps.analytics.services import AnalysisEngine, SimulationService, RecommendationService
from apps.analytics.models import IndicadorFinanciero, ValorIndicador

@pytest.fixture
def base_data(db):
    sector = SectorEmpresa.objects.create(nombre="Tecnología")
    empresa = Empresa.objects.create(nombre="Test Corp", codigo_bbv="TEST", sector=sector)
    reporte = ReporteFinanciero.objects.create(
        empresa=empresa,
        gestion=2024,
        tipo_periodo="ANUAL",
        estado_procesamiento="PROCESADO",
        datos_extraidos_json={
            "total_activo": 1000000,
            "total_pasivo": 400000,
            "total_patrimonio": 600000,
            "total_activo_corriente": 200000,
            "total_pasivo_corriente": 100000,
            "ingresos_totales": 500000,
            "utilidad_neta": 50000
        }
    )
    return empresa, reporte

@pytest.mark.django_db
class TestAnalysisEngine:
    
    def test_calculate_ratios(self, base_data):
        empresa, reporte = base_data
        engine = AnalysisEngine()
        indicador = engine.process_report(reporte.id_reporte)
        
        assert indicador is not None
        assert indicador.reporte == reporte
        
        # Verificar Liquidez Corriente (200k / 100k = 2.0)
        liq = ValorIndicador.objects.get(indicador=indicador, catalogo_indicador__codigo="LIQ_CORR")
        assert liq.valor == Decimal("2.0")
        
        # Verificar Endeudamiento (400k / 1M = 0.4)
        end = ValorIndicador.objects.get(indicador=indicador, catalogo_indicador__codigo="END")
        assert end.valor == Decimal("0.4")
        
        # Verificar ROA (50k / 1M = 0.05)
        roa = ValorIndicador.objects.get(indicador=indicador, catalogo_indicador__codigo="ROA")
        assert roa.valor == Decimal("0.05")

    def test_score_logic(self, base_data):
        empresa, reporte = base_data
        engine = AnalysisEngine()
        indicador = engine.process_report(reporte.id_reporte)
        
        # Con liq=2.0 (>1.2) y end=0.4 (<0.5), debería tener un score alto
        assert indicador.score_financiero > 50

@pytest.mark.django_db
class TestSimulationService:
    
    def test_calculate_simulation(self, base_data):
        empresa, reporte = base_data
        # Crear un segundo reporte para tener serie histórica
        ReporteFinanciero.objects.create(
            empresa=empresa,
            gestion=2025,
            tipo_periodo="ANUAL",
            estado_procesamiento="PROCESADO",
            datos_extraidos_json={
                "total_activo": 1200000,
                "total_pasivo": 450000,
                "total_patrimonio": 750000,
                "total_activo_corriente": 250000,
                "total_pasivo_corriente": 120000,
            }
        )
        
        service = SimulationService()
        res = service.calculate_simulation(empresa.id_empresa, 1000, 5)
        
        assert "escenarios" in res
        assert "moderado" in res["escenarios"]
        assert res["monto_inicial"] == 1000
        # Patrimonio creció de 600k a 750k (25%), el retorno debería ser positivo
        assert res["escenarios"]["moderado"]["tasa_estimada"] > 0

@pytest.mark.django_db
class TestRecommendationService:
    
    def test_get_top_recommendations(self, base_data):
        empresa, reporte = base_data
        # Procesar indicadores
        AnalysisEngine().process_report(reporte.id_reporte)
        
        service = RecommendationService()
        recoms = service.get_top_recommendations()
        
        assert len(recoms) > 0
        assert recoms[0]["empresa_id"] == empresa.id_empresa
        assert "recomendacion" in recoms[0]
