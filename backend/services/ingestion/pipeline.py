from django.utils import timezone
from apps.financials.models import Empresa, ReporteFinanciero
from apps.processing.models import ProcesoCarga
from apps.analytics.models import IndicadorFinanciero, ValorIndicador, CatalogoIndicador
from services.ingestion.bbv_downloader import BBVDownloader
from services.ingestion.pdf_parser import PDFParser
from services.ingestion.cleaners import DataCleaner
from services.analytics.indicator_engine import IndicatorEngine

class FinancialPipeline:
    def __init__(self):
        self.downloader = BBVDownloader()
        self.parser = PDFParser()
        self.cleaner = DataCleaner()
        self.engine = IndicatorEngine()
        
    def _crear_proceso(self, empresa, reporte, tipo):
        return ProcesoCarga.objects.create(
            empresa=empresa,
            reporte=reporte,
            tipo_proceso=tipo,
            estado="en_proceso"
        )

    def _actualizar_proceso(self, proceso, error=None):
        if error:
            proceso.estado = "fallido"
            proceso.mensaje_error = str(error)
        else:
            proceso.estado = "exitoso"
        proceso.fecha_fin = timezone.now()
        proceso.save()
        
    def procesar_reporte(self, empresa: Empresa, gestion: int, trimestre: int) -> dict:
        """
        Orquesta el flujo: Descarga -> Parser -> Limpiar -> Calcular Ratios -> Guardar BD.
        """
        proceso_carga_completa = self._crear_proceso(empresa, None, "carga_completa")
        
        try:
            # 1: Obtener o crear el reporte base
            reporte, _ = ReporteFinanciero.objects.get_or_create(
                empresa=empresa,
                gestion=gestion,
                trimestre=trimestre,
                tipo_periodo="TRIMESTRAL",
                defaults={'estado_procesamiento': "PENDIENTE"}
            )
            proceso_carga_completa.reporte = reporte
            proceso_carga_completa.save()

            # Descarga
            proceso_desc = self._crear_proceso(empresa, reporte, "descarga")
            download_result = self.downloader.download_report(empresa.codigo_bbv, gestion, trimestre)
            
            if not download_result['success']:
                self._actualizar_proceso(proceso_desc, download_result.get('error'))
                self._actualizar_proceso(proceso_carga_completa, "Falla en descarga.")
                reporte.estado_procesamiento = "ERROR"
                reporte.mensaje_error = download_result.get('error')
                reporte.save()
                return download_result

            reporte.url_pdf = download_result['url']
            reporte.ruta_archivo = download_result['ruta_archivo_local']
            reporte.nombre_archivo = download_result['nombre_archivo']
            reporte.hash_archivo = download_result['hash_archivo']
            reporte.tamano_archivo = download_result['tamano_bytes']
            reporte.fecha_descarga = timezone.now()
            reporte.estado_procesamiento = "DESCARGADO"
            reporte.save()
            self._actualizar_proceso(proceso_desc)
            
            # 2: Extracción
            proceso_extr = self._crear_proceso(empresa, reporte, "extraccion")
            parse_result = self.parser.parse(reporte.ruta_archivo)
            
            if not parse_result['success']:
                self._actualizar_proceso(proceso_extr, parse_result.get('error'))
                self._actualizar_proceso(proceso_carga_completa, "Falla extracción.")
                reporte.estado_procesamiento = "ERROR"
                reporte.mensaje_error = parse_result.get('error')
                reporte.save()
                return parse_result
                
            reporte.fecha_publicacion = parse_result.get('fecha_publicacion')
            reporte.datos_extraidos_json = parse_result.get('valores_brutos')
            reporte.save()
            self._actualizar_proceso(proceso_extr)

            # 3: Limpieza
            proceso_limp = self._crear_proceso(empresa, reporte, "limpieza")
            clean_result = self.cleaner.clean(parse_result['valores_brutos'])
            if not clean_result['success']:
                self._actualizar_proceso(proceso_limp, clean_result.get('error'))
                self._actualizar_proceso(proceso_carga_completa, "Falla limpieza.")
                reporte.estado_procesamiento = "ERROR"
                reporte.mensaje_error = clean_result.get('error')
                reporte.save()
                return clean_result
                
            self._actualizar_proceso(proceso_limp)
            valores_limpios = clean_result['valores_limpios']
            
            # 4: Cálculo de Indicadores
            proceso_calc = self._crear_proceso(empresa, reporte, "calculo")
            calc_result = self.engine.calculate(valores_limpios)
            self._actualizar_proceso(proceso_calc)
            
            # 5: Guardar en Base de Datos (Estructura de Analytics)
            reporte.estado_procesamiento = "PROCESADO"
            reporte.save()
            
            # Crear cabecera de indicadores
            indicador_master, _ = IndicadorFinanciero.objects.get_or_create(reporte=reporte)
            
            # Guardar cada valor calculado
            indicadores_finales = {**valores_limpios, **calc_result['indicators']}
            for codigo, valor in indicadores_finales.items():
                if valor is not None:
                    catalogo, _ = CatalogoIndicador.objects.get_or_create(
                        codigo=codigo.upper(),
                        defaults={'nombre': codigo.replace('_', ' ').title()}
                    )
                    ValorIndicador.objects.update_or_create(
                        indicador=indicador_master,
                        catalogo_indicador=catalogo,
                        defaults={'valor': valor}
                    )
            
            self._actualizar_proceso(proceso_carga_completa)
            return {
                'success': True, 
                'report_id': reporte.id_reporte,
                'patron_exitoso': reporte.nombre_archivo
            }
            
        except Exception as e:
            self._actualizar_proceso(proceso_carga_completa, str(e))
            return {'success': False, 'error': f"Error en pipeline central: {str(e)}"}
