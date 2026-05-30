from django.db import models

from apps.accounts.models import Usuario


class BitacoraSistema(models.Model):
    id_bitacora = models.AutoField(primary_key=True)

    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="bitacoras"
    )

    accion = models.CharField(max_length=200)

    modulo = models.CharField(max_length=100)

    detalle = models.TextField(
        blank=True,
        null=True
    )

    ip = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        db_table = "bitacora_sistema"

    def __str__(self):
        return f"{self.modulo} - {self.accion}"


class ConfiguracionSistema(models.Model):
    id_configuracion = models.AutoField(
        primary_key=True
    )

    clave = models.CharField(
        max_length=100,
        unique=True
    )

    valor = models.TextField()

    descripcion = models.TextField(
        blank=True,
        null=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        db_table = "configuracion_sistema"

    def __str__(self):
        return self.clave


class TareaProgramada(models.Model):
    id_tarea = models.AutoField(
        primary_key=True
    )

    nombre = models.CharField(
        max_length=150
    )

    descripcion = models.TextField(
        blank=True,
        null=True
    )

    cron = models.CharField(
        max_length=100
    )

    activa = models.BooleanField(
        default=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        db_table = "tarea_programada"

    def __str__(self):
        return self.nombre


class EjecucionTarea(models.Model):
    id_ejecucion = models.AutoField(
        primary_key=True
    )

    tarea = models.ForeignKey(
        TareaProgramada,
        on_delete=models.CASCADE,
        related_name="ejecuciones"
    )

    fecha_inicio = models.DateTimeField()

    fecha_fin = models.DateTimeField(
        null=True,
        blank=True
    )

    estado = models.CharField(
        max_length=50
    )

    resultado = models.TextField(
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        db_table = "ejecucion_tarea"

    def __str__(self):
        return f"{self.tarea.nombre} - {self.estado}"