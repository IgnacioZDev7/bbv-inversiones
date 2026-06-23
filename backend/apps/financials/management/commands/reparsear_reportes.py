import os

from django.core.management.base import BaseCommand

from apps.analytics.models import CatalogoIndicador, IndicadorFinanciero, ValorIndicador
from apps.financials.models import ReporteFinanciero
from services.ingestion.cleaners import DataCleaner
from services.ingestion.pdf_parser import PDFParser
from services.analytics.indicator_engine import IndicatorEngine


class Command(BaseCommand):
    """
    Re-extrae los totales de los PDF ya descargados (sin volver a descargarlos)
    usando el parser corregido (ver services/ingestion/pdf_parser.py) y actualiza
    los reportes cuyo total_activo cambie de forma significativa.

    Corrige el bug histórico que inflaba ~100x los valores de los reportes con
    decimales (formato "1,732,228.26"), porque el parser anterior eliminaba el
    punto decimal junto con las comas de miles.
    """

    help = "Re-parsea localmente los PDF ya descargados y corrige datos_extraidos_json."

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true", help="Solo muestra qué cambiaría, sin guardar.")

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        pdf_parser = PDFParser()
        cleaner = DataCleaner()
        engine = IndicatorEngine()

        reportes = ReporteFinanciero.objects.filter(
            estado_procesamiento="PROCESADO", ruta_archivo__isnull=False
        ).exclude(ruta_archivo="").select_related("empresa").order_by(
            "empresa__codigo_bbv", "gestion", "trimestre"
        )

        total = reportes.count()
        cambiados = 0
        sin_cambio = 0
        errores = 0

        for reporte in reportes:
            etiqueta = f"{reporte.empresa.codigo_bbv} {reporte.gestion}T{reporte.trimestre}"

            if not os.path.exists(reporte.ruta_archivo):
                self.stderr.write(f"[FALTA PDF] {etiqueta} -> {reporte.ruta_archivo}")
                errores += 1
                continue

            parse_result = pdf_parser.parse(reporte.ruta_archivo)
            if not parse_result["success"]:
                self.stderr.write(f"[ERROR PARSE] {etiqueta} -> {parse_result.get('error')}")
                errores += 1
                continue

            nuevos_valores = parse_result["valores_brutos"]
            viejo_activo = (reporte.datos_extraidos_json or {}).get("total_activo")
            nuevo_activo = nuevos_valores.get("total_activo")

            if viejo_activo and nuevo_activo and abs(viejo_activo - nuevo_activo) < 1:
                sin_cambio += 1
                continue

            clean_result = cleaner.clean(nuevos_valores)
            if not clean_result["success"]:
                self.stderr.write(f"[ERROR LIMPIEZA] {etiqueta} -> {clean_result.get('error')}")
                errores += 1
                continue

            valores_limpios = clean_result["valores_limpios"]
            calc_result = engine.calculate(valores_limpios)

            self.stdout.write(
                f"[CAMBIO] {etiqueta}: total_activo {viejo_activo} -> {nuevo_activo}"
            )
            cambiados += 1

            if dry_run:
                continue

            nueva_fecha = parse_result.get("fecha_publicacion")
            if nueva_fecha:
                reporte.fecha_publicacion = nueva_fecha
            reporte.datos_extraidos_json = nuevos_valores
            reporte.save()

            indicador_master, _ = IndicadorFinanciero.objects.get_or_create(reporte=reporte)
            indicadores_finales = {**valores_limpios, **calc_result["indicators"]}
            for codigo, valor in indicadores_finales.items():
                if valor is not None:
                    catalogo, _ = CatalogoIndicador.objects.get_or_create(
                        codigo=codigo.upper(),
                        defaults={"nombre": codigo.replace("_", " ").title()},
                    )
                    ValorIndicador.objects.update_or_create(
                        indicador=indicador_master,
                        catalogo_indicador=catalogo,
                        defaults={"valor": valor},
                    )

        self.stdout.write(self.style.SUCCESS(
            f"Total: {total} | Cambiados: {cambiados} | Sin cambio: {sin_cambio} | Errores: {errores}"
            + (" (DRY RUN, nada se guardó)" if dry_run else "")
        ))
