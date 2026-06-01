# BBV Inversiones - Contexto de Continuidad

## Objetivo

Sistema de análisis financiero e inversiones basado en información histórica de empresas registradas en la Bolsa Boliviana de Valores.

---

# Stack

## Backend

- Django 5
- Django REST Framework
- PostgreSQL
- SimpleJWT
- dj-rest-auth
- django-allauth
- Google OAuth

## Frontend

- React
- TypeScript
- Vite
- Axios
- Recharts

---

# Estado Actual

## Autenticación

Completamente funcional.

Implementado:

- Google OAuth
- JWT Access Token
- JWT Refresh Token
- Refresh automático por Axios Interceptor
- Roles mediante Django Groups
- Protección de rutas

Roles:

- Administrador
- Analista
- Auditor
- Inversionista

---

# Arquitectura Obligatoria

NO descargar todos los reportes financieros para construir dashboards.

Problema detectado en el proyecto original:

Se consumían todas las empresas y todos los reportes de un sector para generar gráficos.

Esto generaba problemas de escalabilidad.

Nueva regla obligatoria:

Los dashboards deben trabajar sobre una empresa seleccionada.

Correcto:

GET /api/reportes/?empresa={id}

Incorrecto:

GET /api/reportes/

para construir gráficos.

---

# Backend Disponible

## EmpresaViewSet

filterset_fields:

- sector

## ReporteFinancieroViewSet

filterset_fields:

- empresa
- gestion
- trimestre

## Paginación

REST_FRAMEWORK:

DEFAULT_PAGINATION_CLASS:
PageNumberPagination

PAGE_SIZE:
10

## Filtros

DEFAULT_FILTER_BACKENDS:

django_filters.rest_framework.DjangoFilterBackend

---

# Trabajo realizado por Antigravity

Archivos creados:

src/types/api.ts

src/services/apiServices.ts

src/hooks/useApi.ts

src/pages/Admin/index.tsx

src/pages/Admin/CompaniesManagement.tsx

src/pages/Admin/CompanyDetail.tsx

src/pages/Analyst/Indicators.tsx

---

# Restricciones

No usar mocks.

No crear datos ficticios.

No reemplazar arquitectura existente.

No cambiar backend salvo necesidad técnica justificada.

Mantener tipado TypeScript estricto.

Mantener compatibilidad con JWT actual.

Mantener compatibilidad con RBAC actual.

---

# Prioridades

1. Auditoría técnica.
2. Corrección de errores TypeScript.
3. Completar dashboards.
4. Completar visualización financiera.
5. Completar módulo administrativo.
6. Optimizar rendimiento.