from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group


class Command(BaseCommand):
    help = "Inicializa los roles base del sistema"

    def handle(self, *args, **kwargs):

        roles = [
            "Administrador",
            "Auditor",
            "Analista",
            "Inversionista",
        ]

        for role in roles:
            group, created = Group.objects.get_or_create(name=role)

            if created:
                self.stdout.write(self.style.SUCCESS(f"Rol creado: {role}"))
            else:
                self.stdout.write(f"Rol ya existe: {role}")

        self.stdout.write(self.style.SUCCESS("Inicialización de roles completada"))