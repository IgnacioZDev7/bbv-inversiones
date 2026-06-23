from rest_framework import serializers
from apps.accounts.models import Usuario
from django.contrib.auth.models import Group


class UsuarioSerializer(serializers.ModelSerializer):
    group_names = serializers.SerializerMethodField()
    profile_complete = serializers.SerializerMethodField()

    class Meta:
        model = Usuario

        fields = [
            'id_usuario',
            'username',
            'nombre',
            'apellido_paterno',
            'apellido_materno',
            'email',
            'ci',
            'fecha_nacimiento',
            'celular',
            'activo',
            'groups',
            'group_names',
            'profile_complete',
            'password'
        ]

        # groups y group_names son solo lectura para evitar cambios no autorizados via POST/PUT
        read_only_fields = ['id_usuario', 'groups', 'group_names', 'profile_complete']

        extra_kwargs = {
            'password': {
                'write_only': True
            }
        }

    def get_group_names(self, obj):
        return [group.name for group in obj.groups.all()]

    def get_profile_complete(self, obj):
        return obj.is_profile_complete

    def create(self, validated_data):
        # Eliminamos cualquier intento de enviar groups desde el cliente (por si acaso)
        validated_data.pop('groups', None)
        password = validated_data.pop('password', None)

        user = Usuario(**validated_data)

        if password:
            user.set_password(password)

        user.save()
        return user

    def update(self, instance, validated_data):
        # Eliminamos cualquier intento de enviar groups desde el cliente
        validated_data.pop('groups', None)
        password = validated_data.pop('password', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()
        return instance


class CompletarPerfilSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['ci', 'celular', 'apellido_paterno', 'apellido_materno', 'nombre', 'fecha_nacimiento']

    def validate_ci(self, value):
        if not value:
            raise serializers.ValidationError("El CI es obligatorio para completar el perfil.")
        # La unicidad ya la valida el ModelSerializer por el campo unique=True del modelo, 
        # pero siendo explícitos para mayor claridad en el error de Sprint.
        if Usuario.objects.exclude(pk=self.instance.pk).filter(ci=value).exists():
            raise serializers.ValidationError("Este CI ya está registrado.")
        return value

    def validate_apellido_paterno(self, value):
        if not value:
            raise serializers.ValidationError("El apellido paterno es obligatorio.")
        return value

    def validate_celular(self, value):
        if not value:
            raise serializers.ValidationError("El número de celular es obligatorio.")
        if len(value) < 7:
            raise serializers.ValidationError("Número de celular no válido.")
        return value
