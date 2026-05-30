from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType


class Command(BaseCommand):
    help = "Inicializa permisos por rol del sistema BBV"

    def handle(self, *args, **kwargs):

        # =========================
        # CREAR GRUPOS (ROLES)
        # =========================
        roles = ["Administrador", "Auditor", "Analista", "Inversionista"]

        grupos = {}
        for rol in roles:
            group, created = Group.objects.get_or_create(name=rol)
            grupos[rol] = group

            if created:
                self.stdout.write(self.style.SUCCESS(f"Grupo creado: {rol}"))
            else:
                self.stdout.write(f"Grupo ya existe: {rol}")

        # =========================
        # OBTENER PERMISOS BASE
        # =========================
        permisos = Permission.objects.all()

        def get_perms(app_label, codename_list):
            return permisos.filter(content_type__app_label=app_label, codename__in=codename_list)

        # =========================
        # ADMINISTRADOR (TODO)
        # =========================
        grupos["Administrador"].permissions.set(permisos)

        # =========================
        # AUDITOR (SOLO LECTURA + AUDITORÍA)
        # =========================
        auditor_perms = list(
            permisos.filter(codename__startswith="view_")
        )

        auditor_perms += list(
            permisos.filter(content_type__app_label="audit")
        )

        grupos["Auditor"].permissions.set(auditor_perms)

        # =========================
        # ANALISTA (FINANZAS + ANALYTICS COMPLETO)
        # =========================
        analista_perms = []

        analista_perms += list(permisos.filter(content_type__app_label="financials"))
        analista_perms += list(permisos.filter(content_type__app_label="analytics"))
        analista_perms += list(permisos.filter(codename__startswith="view_"))

        grupos["Analista"].permissions.set(set(analista_perms))

        # =========================
        # INVERSIONISTA (SOLO LECTURA LIMITADA)
        # =========================
        inversionista_perms = list(
            permisos.filter(codename__startswith="view_")
        )

        # limitar a módulos clave
        inversionista_perms = [
            p for p in inversionista_perms
            if p.content_type.app_label in ["financials", "analytics"]
        ]

        grupos["Inversionista"].permissions.set(inversionista_perms)

        self.stdout.write(self.style.SUCCESS("Permisos inicializados correctamente"))