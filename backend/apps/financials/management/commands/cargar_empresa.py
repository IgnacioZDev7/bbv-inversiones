from django.core.management.base import BaseCommand
from apps.financials.models import Empresa
from services.ingestion.pipeline import FinancialPipeline


class Command(BaseCommand):
    help = "Carga reportes históricos de una empresa"

    def add_arguments(self, parser):
        parser.add_argument("codigo")
        parser.add_argument("--desde", type=int, required=True)
        parser.add_argument("--hasta", type=int, required=True)

    def handle(self, *args, **options):

        codigo = options["codigo"].upper()
        desde = options["desde"]
        hasta = options["hasta"]

        try:
            empresa = Empresa.objects.get(codigo_bbv=codigo)
        except Empresa.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(
                    f"No existe empresa con código {codigo}"
                )
            )
            return

        pipeline = FinancialPipeline()

        exitosos = 0
        errores = 0

        for gestion in range(desde, hasta + 1):

            for trimestre in [1, 2, 3, 4]:

                self.stdout.write(
                    f"Procesando {codigo} - {gestion} T{trimestre}"
                )

                resultado = pipeline.procesar_reporte(
                    empresa=empresa,
                    gestion=gestion,
                    trimestre=trimestre
                )

                if resultado.get("success"):
                    exitosos += 1

                    self.stdout.write(
                        self.style.SUCCESS(
                            f"✓ {gestion} T{trimestre}"
                        )
                    )
                else:
                    errores += 1

                    self.stdout.write(
                        self.style.WARNING(
                            f"✗ {gestion} T{trimestre} -> "
                            f"{resultado.get('error')}"
                        )
                    )

        self.stdout.write("")
        self.stdout.write(
            self.style.SUCCESS(
                f"Finalizado. Éxitos: {exitosos} | Errores: {errores}"
            )
        )