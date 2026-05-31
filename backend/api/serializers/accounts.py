from rest_framework import serializers
from apps.accounts.models import Usuario
from django.contrib.auth.models import Group


class UsuarioSerializer(serializers.ModelSerializer):
    group_names = serializers.SerializerMethodField()

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
            'password'
        ]

        # groups y group_names son solo lectura para evitar cambios no autorizados via POST/PUT
        read_only_fields = ['id_usuario', 'groups', 'group_names']

        extra_kwargs = {
            'password': {
                'write_only': True
            }
        }

    def get_group_names(self, obj):
        return [group.name for group in obj.groups.all()]

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
