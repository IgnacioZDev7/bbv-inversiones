from django.db import models
from django.contrib.auth.models import AbstractUser


class Genero(models.Model):
    nombre = models.CharField(max_length=50)
    descripcion = models.TextField(blank=True, null=True)

    activo = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "genero"
        verbose_name = "Genero"
        verbose_name_plural = "Generos"
        ordering = ["nombre"]

    def __str__(self):
        return self.nombre


class Usuario(AbstractUser):
    id_usuario = models.BigAutoField(primary_key=True)

    # Eliminamos los campos heredados de Django
    first_name = None
    last_name = None

    nombre = models.CharField(
        max_length=100,
        default=""
    )

    apellido_paterno = models.CharField(
        max_length=100,
        null=True,
        blank=True
    )

    apellido_materno = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    ci = models.CharField(
        max_length=30,
        unique=True,
        null=True,
        blank=True
    )

    @property
    def is_profile_complete(self):
        """
        Valida si el usuario tiene los datos mínimos para operar.
        """
        return all([self.ci, self.celular, self.apellido_paterno])

    fecha_nacimiento = models.DateField(
        blank=True,
        null=True
    )

    genero = models.ForeignKey(
        Genero,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="usuarios"
    )

    celular = models.CharField(
        max_length=30,
        blank=True,
        null=True
    )

    foto_perfil = models.ImageField(
        upload_to="usuarios/",
        blank=True,
        null=True
    )

    oauth_google = models.BooleanField(default=False)

    activo = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "usuario"
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"

    def __str__(self):
        return self.username


class Direccion(models.Model):
    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.CASCADE,
        related_name="direcciones"
    )

    zona = models.CharField(max_length=150)

    calle = models.CharField(max_length=150)

    numero = models.CharField(
        max_length=50,
        blank=True,
        null=True
    )

    referencia = models.TextField(
        blank=True,
        null=True
    )

    principal = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "direccion"
        verbose_name = "Direccion"
        verbose_name_plural = "Direcciones"

    def __str__(self):
        return f"{self.zona} - {self.calle}"


class PerfilUsuario(models.Model):
    usuario = models.OneToOneField(
        Usuario,
        on_delete=models.CASCADE,
        related_name="perfil"
    )

    biografia = models.TextField(
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "perfil_usuario"
        verbose_name = "Perfil Usuario"
        verbose_name_plural = "Perfiles Usuario"

    def __str__(self):
        return f"Perfil de {self.usuario.username}"


class SesionUsuario(models.Model):
    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.CASCADE,
        related_name="sesiones"
    )

    token = models.CharField(max_length=500)

    ip = models.GenericIPAddressField(
        blank=True,
        null=True
    )

    dispositivo = models.CharField(
        max_length=255,
        blank=True,
        null=True
    )

    fecha_inicio = models.DateTimeField()

    fecha_expiracion = models.DateTimeField()

    activa = models.BooleanField(default=True)

    class Meta:
        db_table = "sesion_usuario"
        verbose_name = "Sesion Usuario"
        verbose_name_plural = "Sesiones Usuario"

    def __str__(self):
        return f"{self.usuario.username} - {self.fecha_inicio}"