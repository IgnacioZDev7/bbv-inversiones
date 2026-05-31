from django.core.management.base import BaseCommand
from apps.financials.models import Empresa
from services.ingestion.pipeline import FinancialPipeline
from django.utils import timezone

class Command(BaseCommand):
    help = 'Ejecuta el pipeline de actualización financiera para todas las empresas activas'

    def add_arguments(self, parser):
        parser.add_argument('--gestion', type=int, help='Año de la gestión (ej. 2023)')
        parser.add_argument('--trimestre', type=int, help='Trimestre (1-4)')

    def handle(self, *args, **options):
        gestion = options.get('gestion') or timezone.now().year
        trimestre = options.get('trimestre')
        
        # Determinar trimestre automáticamente si no se provee
        if not trimestre:
            mes = timezone.now().month
            if mes <= 3: trimestre = 1
            elif mes <= 6: trimestre = 2
            elif mes <= 9: trimestre = 3
            else: trimestre = 4

        self.stdout.write(self.style.NOTICE(f'Iniciando pipeline para Gestión {gestion}, Trimestre {trimestre}...'))
        
        empresas = Empresa.objects.filter(activa=True)
        pipeline = FinancialPipeline()
        
        exitos = 0
        fallos = 0
        
        for empresa in empresas:
            self.stdout.write(f'Procesando {empresa.nombre} ({empresa.codigo_bbv})...')
            result = pipeline.procesar_reporte(empresa, gestion, trimestre)
            
            if result['success']:
                self.stdout.write(self.style.SUCCESS(f'  Éxito: {empresa.nombre}'))
                exitos += 1
            else:
                self.stdout.write(self.style.ERROR(f'  Fallo: {empresa.nombre}. Motivo: {result.get("error")}'))
                fallos += 1
        
        self.stdout.write(self.style.MIGRATE_HEADING(
            f'\nResumen: {exitos} exitosos, {fallos} fallidos.'
        ))
