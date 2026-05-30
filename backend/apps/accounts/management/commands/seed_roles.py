from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group


class Command(BaseCommand):

    help = "Crea los grupos iniciales del sistema"

    def handle(self, *args, **kwargs):

        roles = [
            "Administrador",
            "Auditor",
            "Analista",
            "Inversionista",
        ]

        for rol in roles:

            Group.objects.get_or_create(
                name=rol
            )

            self.stdout.write(
                self.style.SUCCESS(
                    f"Rol creado: {rol}"
                )
            )