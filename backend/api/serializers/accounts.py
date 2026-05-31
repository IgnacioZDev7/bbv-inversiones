from rest_framework import serializers
from apps.accounts.models import Usuario


class UsuarioSerializer(serializers.ModelSerializer):

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
            'password'
        ]

        read_only_fields = ['id_usuario']

        extra_kwargs = {
            'password': {
                'write_only': True
            }
        }

    def create(self, validated_data):
        password = validated_data.pop('password', None)

        user = Usuario(**validated_data)

        if password:
            user.set_password(password)

        user.save()

        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()

        return instance