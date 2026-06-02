from django.db import migrations

def clean_ci_empty_strings(apps, schema_editor):
    Usuario = apps.get_model('accounts', 'Usuario')
    # Convertimos cualquier cadena vacía en NULL para evitar conflictos con el índice UNIQUE
    Usuario.objects.filter(ci='').update(ci=None)

class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0003_alter_usuario_apellido_paterno_alter_usuario_ci'),
    ]

    operations = [
        migrations.RunPython(clean_ci_empty_strings),
    ]
