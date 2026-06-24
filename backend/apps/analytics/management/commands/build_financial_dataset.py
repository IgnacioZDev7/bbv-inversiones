import csv
import math
import os

from django.core.management.base import BaseCommand

from apps.analytics.services import calculate_financial_health_score, classify_health_score
from apps.financials.models import ReporteFinanciero, Empresa


class Command(BaseCommand):
    """
    Construye financial_health_dataset.csv para entrenamiento de un modelo SVM
    de clasificación financiera.

    Todas las variables se calculan EXCLUSIVAMENTE con:
      - los campos reales de ReporteFinanciero.datos_extraidos_json
        (total_activo, total_pasivo, total_patrimonio,
         total_activo_corriente, total_pasivo_corriente)
      - las funciones ya existentes en apps/analytics/services.py:
        calculate_financial_health_score() y classify_health_score()
        (se importan directamente, no se reescriben ni se redefinen pesos).

    No se inventa ninguna fórmula nueva. Las fórmulas de los 6 ratios
    replican exactamente la lógica de SimulationService.compute_indicators
    (mismo archivo), fila por fila en vez de solo para el último periodo.
    """

    help = "Genera el dataset financial_health_dataset.csv para entrenamiento de SVM."

    def add_arguments(self, parser):
        parser.add_argument(
            "--output",
            default=os.path.join(os.path.dirname(__file__), "..", "..", "..", "financial_health_dataset.csv"),
            help="Ruta de salida del CSV.",
        )

    def handle(self, *args, **options):
        output_path = os.path.abspath(options["output"])

        empresas = {e.id_empresa: e for e in Empresa.objects.select_related("sector").all()}

        filas = []
        descartadas = {
            "pc_invalido": 0,
            "at_invalido": 0,
            "pt_invalido": 0,
            "pn_invalido": 0,
            "pn_prev_invalido": 0,
            "at_prev_invalido": 0,
            "no_finito": 0,
        }

        for empresa_id in empresas:
            reportes = list(
                ReporteFinanciero.objects.filter(
                    empresa_id=empresa_id, estado_procesamiento="PROCESADO"
                ).order_by("gestion", "trimestre")
            )

            for i in range(1, len(reportes)):
                actual = reportes[i]
                anterior = reportes[i - 1]

                d = actual.datos_extraidos_json or {}
                d_prev = anterior.datos_extraidos_json or {}

                ac = float(d.get("total_activo_corriente") or 0)
                pc = float(d.get("total_pasivo_corriente") or 0)
                at = float(d.get("total_activo") or 0)
                pt = float(d.get("total_pasivo") or 0)
                pn = float(d.get("total_patrimonio") or 0)
                at_prev = float(d_prev.get("total_activo") or 0)
                pn_prev = float(d_prev.get("total_patrimonio") or 0)

                # ── Eliminar filas con división por cero (igual que el sistema) ──
                if pc <= 0:
                    descartadas["pc_invalido"] += 1
                    continue
                if at <= 0:
                    descartadas["at_invalido"] += 1
                    continue
                if pt <= 0:
                    descartadas["pt_invalido"] += 1
                    continue
                if pn <= 0:
                    descartadas["pn_invalido"] += 1
                    continue
                if pn_prev <= 0:
                    descartadas["pn_prev_invalido"] += 1
                    continue
                if at_prev <= 0:
                    descartadas["at_prev_invalido"] += 1
                    continue

                # ── Fórmulas exactas (services.py: compute_indicators) ──
                liquidez_corriente = ac / pc
                endeudamiento = pt / at
                solvencia = at / pt
                endeudamiento_patrimonial = pt / pn
                crecimiento_patrimonial = (pn - pn_prev) / pn_prev
                crecimiento_activos = (at - at_prev) / at_prev

                valores = [
                    liquidez_corriente, endeudamiento, solvencia,
                    endeudamiento_patrimonial, crecimiento_patrimonial, crecimiento_activos,
                ]
                if not all(math.isfinite(v) for v in valores):
                    descartadas["no_finito"] += 1
                    continue

                # ── Score y clasificación: funciones reales del sistema, sin redefinir pesos ──
                score_financiero = calculate_financial_health_score(
                    liquidez=liquidez_corriente,
                    endeudamiento=endeudamiento,
                    crecimiento_patrimonial=crecimiento_patrimonial,
                    solvencia=solvencia,
                )
                clasificacion_financiera = classify_health_score(score_financiero)

                empresa = empresas[empresa_id]
                filas.append({
                    "empresa": empresa.codigo_bbv,
                    "sector": empresa.sector.nombre if empresa.sector else "",
                    "gestion": actual.gestion,
                    "trimestre": actual.trimestre,
                    "liquidez_corriente": round(liquidez_corriente, 6),
                    "endeudamiento": round(endeudamiento, 6),
                    "solvencia": round(solvencia, 6),
                    "endeudamiento_patrimonial": round(endeudamiento_patrimonial, 6),
                    "crecimiento_patrimonial": round(crecimiento_patrimonial, 6),
                    "crecimiento_activos": round(crecimiento_activos, 6),
                    "score_financiero": score_financiero,
                    "clasificacion_financiera": clasificacion_financiera,
                })

        columnas = [
            "empresa", "sector", "gestion", "trimestre",
            "liquidez_corriente", "endeudamiento", "solvencia",
            "endeudamiento_patrimonial", "crecimiento_patrimonial", "crecimiento_activos",
            "score_financiero", "clasificacion_financiera",
        ]

        with open(output_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=columnas)
            writer.writeheader()
            writer.writerows(filas)

        # ── Resumen estadístico ──
        self.stdout.write(self.style.SUCCESS(f"CSV generado en: {output_path}"))
        self.stdout.write(f"Filas finales: {len(filas)}")
        self.stdout.write(f"Columnas: {len(columnas)} -> {columnas}")

        self.stdout.write("\nFilas descartadas por motivo (division por cero / dato invalido):")
        for motivo, n in descartadas.items():
            self.stdout.write(f"  {motivo}: {n}")

        self.stdout.write("\nDistribucion de clases (clasificacion_financiera):")
        conteo_clase = {}
        for fila in filas:
            conteo_clase[fila["clasificacion_financiera"]] = conteo_clase.get(fila["clasificacion_financiera"], 0) + 1
        for clase, n in sorted(conteo_clase.items(), key=lambda x: -x[1]):
            pct = n / len(filas) * 100 if filas else 0
            self.stdout.write(f"  {clase:15s} {n:5d} ({pct:.1f}%)")

        self.stdout.write("\nRegistros por sector:")
        conteo_sector = {}
        for fila in filas:
            conteo_sector[fila["sector"]] = conteo_sector.get(fila["sector"], 0) + 1
        for sector, n in sorted(conteo_sector.items(), key=lambda x: -x[1]):
            self.stdout.write(f"  {sector:40s} {n:5d}")

        self.stdout.write("\nValores faltantes por columna (deben ser 0):")
        for col in columnas:
            faltantes = sum(1 for fila in filas if fila[col] is None or fila[col] == "")
            self.stdout.write(f"  {col:30s} {faltantes}")
