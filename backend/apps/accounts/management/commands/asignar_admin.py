from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group
from apps.accounts.models import Usuario


class Command(BaseCommand):
    help = 'Asigna un usuario al grupo Administrador'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='Nombre de usuario')

    def handle(self, *args, **options):
        username = options['username']
        try:
            user = Usuario.objects.get(username=username)
            group, _ = Group.objects.get_or_create(name='Administrador')
            user.groups.add(group)
            self.stdout.write(self.style.SUCCESS(f'Usuario "{username}" asignado al grupo Administrador.'))
        except Usuario.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'Usuario "{username}" no existe.'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error: {str(e)}'))
