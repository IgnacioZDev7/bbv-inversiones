from decimal import Decimal
from apps.analytics.models import CatalogoIndicador, IndicadorFinanciero, ValorIndicador
from apps.financials.models import ReporteFinanciero
from django.db import transaction

class AnalysisEngine:
    """
    Motor de análisis financiero encargado de calcular y persistir indicadores.
    """

    INDICADORES_CONFIG = [
        {"codigo": "LIQ_CORR", "nombre": "Liquidez Corriente", "formula": "Activo Corriente / Pasivo Corriente"},
        {"codigo": "CAP_TRAB", "nombre": "Capital de Trabajo", "formula": "Activo Corriente - Pasivo Corriente"},
        {"codigo": "END", "nombre": "Ratio de Endeudamiento", "formula": "Pasivo Total / Activo Total"},
        {"codigo": "PAT", "nombre": "Patrimonio Total", "formula": "Patrimonio Neto"},
        {"codigo": "ROA", "nombre": "ROA (Return on Assets)", "formula": "Utilidad Neta / Activo Total"},
        {"codigo": "ROE", "nombre": "ROE (Return on Equity)", "formula": "Utilidad Neta / Patrimonio Neto"},
        {"codigo": "MARG_NETO", "nombre": "Margen Neto", "formula": "Utilidad Neta / Ingresos Totales"},
    ]

    def initialize_catalog(self):
        """
        Asegura que el catálogo de indicadores esté poblado.
        """
        for config in self.INDICADORES_CONFIG:
            CatalogoIndicador.objects.get_or_create(
                codigo=config["codigo"],
                defaults={
                    "nombre": config["nombre"],
                    "formula": config["formula"]
                }
            )

    @transaction.atomic
    def process_report(self, reporte_id: int):
        """
        Calcula todos los indicadores para un reporte específico.
        """
        reporte = ReporteFinanciero.objects.get(pk=reporte_id)
        if reporte.estado_procesamiento != "PROCESADO" or not reporte.datos_extraidos_json:
            return None

        # 1. Asegurar catálogo inicializado
        self.initialize_catalog()

        # 2. Crear o resetear el contenedor de indicadores
        indicador_base, _ = IndicadorFinanciero.objects.get_or_create(reporte=reporte)
        indicador_base.valores.all().delete()

        # 3. Extraer datos (Singular como en el backend real)
        d = reporte.datos_extraidos_json
        activo = Decimal(str(d.get("total_activo") or 0))
        pasivo = Decimal(str(d.get("total_pasivo") or 0))
        patrimonio = Decimal(str(d.get("total_patrimonio") or 0))
        ac = Decimal(str(d.get("total_activo_corriente") or 0))
        pc = Decimal(str(d.get("total_pasivo_corriente") or 0))
        
        # Opcionales (Estado de Resultados)
        ingresos = Decimal(str(d.get("ingresos_totales") or 0))
        utilidad = Decimal(str(d.get("utilidad_neta") or 0))

        # 4. Cálculos
        calculos = {
            "LIQ_CORR": ac / pc if pc > 0 else Decimal(0),
            "CAP_TRAB": ac - pc,
            "END": pasivo / activo if activo > 0 else Decimal(0),
            "PAT": patrimonio,
            "ROA": utilidad / activo if activo > 0 else Decimal(0),
            "ROE": utilidad / patrimonio if patrimonio > 0 else Decimal(0),
            "MARG_NETO": utilidad / ingresos if ingresos > 0 else Decimal(0),
        }

        # 5. Persistencia
        for codigo, valor in calculos.items():
            catalogo = CatalogoIndicador.objects.get(codigo=codigo)
            ValorIndicador.objects.create(
                indicador=indicador_base,
                catalogo_indicador=catalogo,
                valor=valor
            )

        # 6. Actualizar score y clasificación básica (placeholder para IA futura)
        indicador_base.score_financiero = self._calculate_basic_score(calculos)
        indicador_base.save()

        return indicador_base

    def _calculate_basic_score(self, calculos):
        """
        Lógica heurística para un score preliminar (0-100).
        """
        score = Decimal(0)
        # +30 pts por liquidez saludable
        if calculos["LIQ_CORR"] >= 1.2: score += 30
        elif calculos["LIQ_CORR"] >= 1.0: score += 15
        
        # +40 pts por bajo endeudamiento
        if calculos["END"] <= 0.5: score += 40
        elif calculos["END"] <= 0.8: score += 20
        
        # +30 pts por patrimonio positivo
        if calculos["PAT"] > 0: score += 30
        
        return score


class SimulationService:
    """
    Servicio encargado de ejecutar proyecciones de inversión basadas en volatilidad histórica.
    """

    def calculate_simulation(self, empresa_id, monto, anios):
        reportes = ReporteFinanciero.objects.filter(
            empresa_id=empresa_id, 
            estado_procesamiento='PROCESADO'
        ).order_by('gestion', 'trimestre')

        if reportes.count() < 2:
            raise ValueError("Se necesitan al menos 2 reportes procesados para realizar una simulación.")

        # Extraer serie de patrimonio
        patrimonios = []
        for r in reportes:
            val = r.datos_extraidos_json.get("total_patrimonio") or 0
            patrimonios.append(float(val))

        # Calcular rendimientos anualizados simples
        rendimientos = []
        for i in range(1, len(patrimonios)):
            if patrimonios[i-1] > 0:
                rendimientos.append((patrimonios[i] - patrimonios[i-1]) / patrimonios[i-1])
        
        avg_return = sum(rendimientos) / len(rendimientos) if rendimientos else 0.05
        # Volatilidad simplificada (desviación estándar)
        variance = sum((r - avg_return) ** 2 for r in rendimientos) / len(rendimientos) if rendimientos else 0.01
        volatility = variance ** 0.5

        # Generar escenarios
        # Conservador: Retorno promedio - 1 volatilidad
        # Moderado: Retorno promedio
        # Agresivo: Retorno promedio + 1 volatilidad
        
        resultados = {}
        for key, adj in [("conservador", -1), ("moderado", 0), ("agresivo", 1)]:
            expected_rate = avg_return + (volatility * adj)
            future_value = float(monto) * ((1 + expected_rate) ** float(anios))
            resultados[key] = {
                "tasa_estimada": round(expected_rate, 4),
                "valor_futuro": round(future_value, 2),
                "roi": round((future_value - float(monto)) / float(monto), 4)
            }

        return {
            "monto_inicial": monto,
            "horizonte_anios": anios,
            "volatilidad_historica": round(volatility, 4),
            "escenarios": resultados
        }


class RecommendationService:
    """
    Genera recomendaciones de inversión basadas en el score de salud financiera.
    """

    def get_top_recommendations(self):
        from apps.financials.models import Empresa
        
        empresas = Empresa.objects.filter(activa=True)
        recomendaciones = []

        for empresa in empresas:
            # Obtener el indicador más reciente
            latest_indicator = IndicadorFinanciero.objects.filter(
                reporte__empresa=empresa
            ).order_by('-reporte__gestion', '-reporte__trimestre').first()

            if not latest_indicator:
                continue

            score = float(latest_indicator.score_financiero)
            
            # Clasificación
            if score >= 80:
                tag = "RECOMENDADA"
                justificacion = "Sólida solvencia patrimonial y alta liquidez corriente."
            elif score >= 50:
                tag = "OBSERVAR"
                justificacion = "Salud financiera estable con niveles de deuda moderados."
            else:
                tag = "RIESGO ALTO"
                justificacion = "Indicadores de liquidez o endeudamiento por debajo del promedio sectorial."

            recomendaciones.append({
                "empresa_id": empresa.id_empresa,
                "nombre": empresa.nombre,
                "codigo_bbv": empresa.codigo_bbv,
                "score": score,
                "recomendacion": tag,
                "justificacion": justificacion
            })

        # Ordenar por score descendente
        return sorted(recomendaciones, key=lambda x: x['score'], reverse=True)
