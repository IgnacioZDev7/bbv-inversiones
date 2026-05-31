from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group

class Command(BaseCommand):
    help = 'Crea los grupos iniciales para el sistema de roles'

    def handle(self, *args, **options):
        groups = ['Administrador', 'Auditor', 'Analista', 'Inversionista']
        for group_name in groups:
            group, created = Group.objects.get_or_create(name=group_name)
            if created:
                self.stdout.write(self.style.SUCCESS(f'Grupo "{group_name}" creado correctamente.'))
            else:
                self.stdout.write(self.style.WARNING(f'Grupo "{group_name}" ya existe.'))
