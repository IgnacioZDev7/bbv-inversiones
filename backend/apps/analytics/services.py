from decimal import Decimal
from apps.analytics.models import CatalogoIndicador, IndicadorFinanciero, ValorIndicador
from apps.financials.models import ReporteFinanciero
from django.db import transaction


def calculate_financial_health_score(liquidez, endeudamiento, crecimiento_patrimonial, solvencia=None):
    """
    Función centralizada de puntaje de salud financiera.
    Fórmula: 35% liquidez + 35% endeudamiento + 20% crecimiento patrimonial + 10% solvencia
    Clasificación: >=80 Excelente, >=60 Saludable, >=40 Observación, <40 Riesgo
    """
    liq_score = min(35, max(0, (liquidez - 0.8) / 0.7 * 35)) if liquidez is not None else 0
    end_score = min(35, max(0, (0.9 - endeudamiento) / 0.5 * 35)) if endeudamiento is not None else 0
    trend_score = min(20, max(0, (crecimiento_patrimonial + 0.15) / 0.25 * 20)) if crecimiento_patrimonial is not None else 0
    solv_score = min(10, max(0, (solvencia - 1.0) / 1.0 * 10)) if solvencia is not None else 0
    total = min(100, max(0, liq_score + end_score + trend_score + solv_score))
    return round(total)


def classify_health_score(score):
    if score >= 80:
        return "Excelente"
    if score >= 60:
        return "Saludable"
    if score >= 40:
        return "Observación"
    return "Riesgo"


class AnalysisEngine:
    """
    Motor de análisis financiero encargado de calcular y persistir indicadores.
    """

    INDICADORES_CONFIG = [
        {"codigo": "LIQ_CORR", "nombre": "Liquidez Corriente", "formula": "Activo Corriente / Pasivo Corriente"},
        {"codigo": "CAP_TRAB", "nombre": "Capital de Trabajo", "formula": "Activo Corriente - Pasivo Corriente"},
        {"codigo": "END", "nombre": "Ratio de Endeudamiento", "formula": "Pasivo Total / Activo Total"},
        {"codigo": "PAT", "nombre": "Patrimonio Total", "formula": "Patrimonio Neto"},
    ]

    def initialize_catalog(self):
        """
        Asegura que el catálogo de indicadores esté poblado.
        """
        existing = set(CatalogoIndicador.objects.values_list("codigo", flat=True))
        for config in self.INDICADORES_CONFIG:
            if config["codigo"] not in existing:
                CatalogoIndicador.objects.create(
                    codigo=config["codigo"],
                    nombre=config["nombre"],
                    formula=config["formula"]
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

        # 3. Extraer datos (Balance General)
        d = reporte.datos_extraidos_json
        activo = Decimal(str(d.get("total_activo") or 0))
        pasivo = Decimal(str(d.get("total_pasivo") or 0))
        patrimonio = Decimal(str(d.get("total_patrimonio") or 0))
        ac = Decimal(str(d.get("total_activo_corriente") or 0))
        pc = Decimal(str(d.get("total_pasivo_corriente") or 0))

        # 4. Cálculos
        liq = ac / pc if pc > 0 else Decimal(0)
        end = pasivo / activo if activo > 0 else Decimal(0)
        calculos = {
            "LIQ_CORR": liq,
            "CAP_TRAB": ac - pc,
            "END": end,
            "PAT": patrimonio,
        }

        # 5. Persistencia
        for codigo, valor in calculos.items():
            catalogo = CatalogoIndicador.objects.get(codigo=codigo)
            ValorIndicador.objects.create(
                indicador=indicador_base,
                catalogo_indicador=catalogo,
                valor=valor
            )

        # 6. Calcular score financiero global centralizado
        score = calculate_financial_health_score(
            liquidez=float(liq),
            endeudamiento=float(end),
            crecimiento_patrimonial=0,
            solvencia=float(activo / pasivo) if pasivo > 0 else 0
        )
        indicador_base.score_financiero = Decimal(score)
        indicador_base.save()

        return indicador_base


class SimulationService:
    """
    Servicio encargado de ejecutar proyecciones de inversión.
    """

    @staticmethod
    def compute_indicators(empresa_id):
        """
        Calcula indicadores financieros reales usando exclusivamente
        los datos disponibles del balance general.
        """
        reportes = list(ReporteFinanciero.objects.filter(
            empresa_id=empresa_id,
            estado_procesamiento='PROCESADO'
        ).order_by('-gestion', '-trimestre'))

        if not reportes or not reportes[0].datos_extraidos_json:
            return {}

        d = reportes[0].datos_extraidos_json
        ac = float(d.get("total_activo_corriente") or 0)
        pc = float(d.get("total_pasivo_corriente") or 0)
        at = float(d.get("total_activo") or 0)
        pt = float(d.get("total_pasivo") or 0)
        pn = float(d.get("total_patrimonio") or 0)

        indicators = {}

        if pc > 0:
            liq = round(ac / pc, 2)
            indicators["liquidez_corriente"] = {
                "valor": liq,
                "estado": "Saludable" if liq >= 1.5 else "Aceptable" if liq >= 1.0 else "Precaria",
                "descripcion": f"Bs. {liq:.2f} en activos corrientes por cada Bs. 1 de pasivo corriente.",
                "numerador": round(ac, 2),
                "denominador": round(pc, 2),
                "formula": f"AC / PC = {round(ac, 2):,.0f} / {round(pc, 2):,.0f}"
            }

        if at > 0:
            end = round(pt / at, 4)
            pct = end * 100
            indicators["endeudamiento"] = {
                "valor": end,
                "estado": "Bajo" if end <= 0.5 else "Moderado" if end <= 0.7 else "Alto",
                "descripcion": f"El {pct:.1f}% del activo total está financiado por pasivos.",
                "numerador": round(pt, 2),
                "denominador": round(at, 2),
                "formula": f"TP / TA = {round(pt, 2):,.0f} / {round(at, 2):,.0f}"
            }

        if pn > 0:
            ep = round(pt / pn, 4)
            indicators["endeudamiento_patrimonial"] = {
                "valor": ep,
                "estado": "Sano" if ep <= 1.0 else "Elevado" if ep <= 2.0 else "Crítico",
                "descripcion": f"Por cada Bs. 1 de patrimonio, la empresa debe Bs. {ep:.2f}.",
                "numerador": round(pt, 2),
                "denominador": round(pn, 2),
                "formula": f"TP / Patrimonio = {round(pt, 2):,.0f} / {round(pn, 2):,.0f}"
            }

        if pt > 0:
            sol = round(at / pt, 2)
            indicators["solvencia"] = {
                "valor": sol,
                "estado": "Sólida" if sol >= 2.0 else "Aceptable" if sol >= 1.5 else "Débil",
                "descripcion": f"Bs. {sol:.2f} en activos por cada Bs. 1 de deuda total.",
                "numerador": round(at, 2),
                "denominador": round(pt, 2),
                "formula": f"TA / TP = {round(at, 2):,.0f} / {round(pt, 2):,.0f}"
            }

        if len(reportes) >= 2:
            d_prev = reportes[1].datos_extraidos_json or {}
            pn_latest = float(d.get("total_patrimonio") or 0)
            pn_prev = float(d_prev.get("total_patrimonio") or 0)
            if pn_prev > 0:
                cp = round((pn_latest - pn_prev) / pn_prev, 4)
                indicators["crecimiento_patrimonial"] = {
                    "valor": cp,
                    "estado": "Positivo" if cp > 0 else "Negativo",
                    "descripcion": f"Variación del {cp*100:+.1f}% respecto al período anterior.",
                    "numerador": round(pn_latest - pn_prev, 2),
                    "denominador": round(pn_prev, 2),
                    "formula": f"(Patₙ - Patₙ₋₁) / Patₙ₋₁ = ({round(pn_latest, 2):,.0f} - {round(pn_prev, 2):,.0f}) / {round(pn_prev, 2):,.0f}"
                }
            at_latest = float(d.get("total_activo") or 0)
            at_prev = float(d_prev.get("total_activo") or 0)
            if at_prev > 0:
                ca = round((at_latest - at_prev) / at_prev, 4)
                indicators["crecimiento_activos"] = {
                    "valor": ca,
                    "estado": "Positivo" if ca > 0 else "Negativo",
                    "descripcion": f"Variación del {ca*100:+.1f}% respecto al período anterior.",
                    "numerador": round(at_latest - at_prev, 2),
                    "denominador": round(at_prev, 2),
                    "formula": f"(ATₙ - ATₙ₋₁) / ATₙ₋₁ = ({round(at_latest, 2):,.0f} - {round(at_prev, 2):,.0f}) / {round(at_prev, 2):,.0f}"
                }
        else:
            for k in ("crecimiento_patrimonial", "crecimiento_activos"):
                indicators[k] = {
                    "valor": None,
                    "estado": "No disponible",
                    "descripcion": "Se requieren al menos 2 reportes."
                }

        return indicators

    def calculate_simulation(self, empresa_id, monto, anios, modo='basico'):
        reportes = ReporteFinanciero.objects.filter(
            empresa_id=empresa_id, 
            estado_procesamiento='PROCESADO'
        ).order_by('gestion', 'trimestre')

        if reportes.count() < 2:
            raise ValueError("Se necesitan al menos 2 reportes procesados para realizar una simulación.")

        patrimonios = []
        for r in reportes:
            val = r.datos_extraidos_json.get("total_patrimonio") or 0
            patrimonios.append(float(val))

        rendimientos = []
        for i in range(1, len(patrimonios)):
            if patrimonios[i-1] > 0:
                rendimientos.append((patrimonios[i] - patrimonios[i-1]) / patrimonios[i-1])

        raw_avg = sum(rendimientos) / len(rendimientos) if rendimientos else 0.05

        clean = [r for r in rendimientos if abs(r) <= 3.0]
        outliers_dropped = len(rendimientos) - len(clean)

        if not clean:
            raise ValueError("Los datos presentan variaciones extremas (>300%). No es posible proyectar.")

        avg_return = sum(clean) / len(clean)
        variance = sum((r - avg_return) ** 2 for r in clean) / len(clean)
        volatility = variance ** 0.5

        warnings = []

        if abs(raw_avg) > 1.0:
            warnings.append(
                f"El crecimiento histórico ({raw_avg*100:.0f}%) supera el límite del modelo "
                f"(±100%). La proyección usa una tasa ajustada de {avg_return*100:.0f}%."
            )

        capped_cagr = max(min(avg_return, 1.0), -1.0)
        capped_vol = min(volatility, 1.0)

        has_outliers = outliers_dropped > 0
        if has_outliers:
            warnings.append(
                f"Se excluyeron {outliers_dropped} variación(es) extrema(s) (>300%) "
                "para evitar distorsión en la proyección."
            )

        serie = []
        p25_rate = max(min(capped_cagr - capped_vol, 1.0), -1.0)
        p75_rate = max(min(capped_cagr + capped_vol, 1.0), -1.0)

        for t in range(1, int(anios) + 1):
            base_val = float(monto) * ((1 + capped_cagr) ** t)
            p25_val = float(monto) * ((1 + p25_rate) ** t)
            p75_val = float(monto) * ((1 + p75_rate) ** t)
            serie.append({
                "year": t,
                "value": round(base_val, 2),
                "p25": round(p25_val, 2),
                "p75": round(p75_val, 2),
            })

        future_value = float(monto) * ((1 + capped_cagr) ** float(anios))
        roi_pct = ((future_value - float(monto)) / float(monto)) * 100

        if capped_vol < 0.1:
            confidence_score = "Alta"
        elif capped_vol < 0.2:
            confidence_score = "Media"
        else:
            confidence_score = "Baja"

        indicators = self.compute_indicators(empresa_id)

        liq_val = indicators.get("liquidez_corriente", {}).get("valor", 0)
        end_val = indicators.get("endeudamiento", {}).get("valor", 0)
        cp_val = indicators.get("crecimiento_patrimonial", {}).get("valor") or 0
        sol_val = indicators.get("solvencia", {}).get("valor", 0)
        health_score = calculate_financial_health_score(liq_val, end_val, cp_val, sol_val)
        health_label = classify_health_score(health_score)

        return {
            "cagr": round(capped_cagr, 4),
            "volatility": round(capped_vol, 4),
            "backtesting_error": round(capped_vol * 100, 2),
            "confidence_score": confidence_score,
            "outliers": has_outliers,
            "valor_futuro": round(future_value, 2),
            "roi": round(roi_pct, 1),
            "modo": modo,
            "serie": serie,
            "warnings": warnings,
            "indicators": indicators,
            "health_score": health_score,
            "health_label": health_label,
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
            
            clasificacion_salud = classify_health_score(score)
            
            if score >= 80:
                tag = "RECOMENDADA"
                justificacion = f"Salud financiera {clasificacion_salud}. Sólida solvencia patrimonial y alta liquidez corriente."
            elif score >= 60:
                tag = "RECOMENDADA"
                justificacion = f"Salud financiera {clasificacion_salud}. Niveles de deuda moderados y liquidez adecuada."
            elif score >= 40:
                tag = "OBSERVAR"
                justificacion = f"Salud financiera en {clasificacion_salud}. Algunos indicadores requieren monitoreo."
            else:
                tag = "RIESGO ALTO"
                justificacion = f"Salud financiera en {clasificacion_salud}. Indicadores por debajo del promedio sectorial."

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
