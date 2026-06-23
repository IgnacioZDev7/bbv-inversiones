# 5.3.4. Arquitectura de software

---

## 5.3.4.1. Arquitectura multicapa del sistema

El sistema BBV Inversiones sigue un modelo de arquitectura multicapa (n-tier) que separa las responsabilidades en cinco capas bien definidas, cada una con un rol específico dentro del flujo de procesamiento de la información financiera.

**Capa de presentación (Frontend)**
Construida con React 19 junto con TypeScript y Tailwind CSS. Es la interfaz con la que interactúa el usuario final. Se encarga de la renderización de dashboards, formularios, tablas dinámicas y visualizaciones de indicadores financieros. Utiliza componentes reutilizables, contexto de autenticación y un sistema de enrutamiento por roles (Administrador, Analista, Auditor, Inversionista). La comunicación con el backend se realiza exclusivamente a través de peticiones HTTP asíncronas.

**Capa de lógica de negocio (Backend)**
Implementada con Django 5.2 y Django REST Framework. Contiene toda la lógica del dominio financiero: cálculo de indicadores, ejecución del pipeline ETL, gestión de usuarios y roles, procesamiento de reportes y la lógica de autenticación y autorización. Expone una API RESTful que es consumida por la capa de presentación. También orquesta la comunicación con la capa de inteligencia artificial.

**Capa de acceso a datos (ORM)**
Utiliza el ORM (Object-Relational Mapping) de Django para abstraer las operaciones de base de datos. Los modelos definidos en las aplicaciones (`accounts`, `financials`, `processing`, `analytics`, `audit`, `ingestion`) se traducen en tablas relacionales. Esta capa garantiza la integridad referencial, ejecuta consultas optimizadas y gestiona las transacciones.

**Capa de persistencia (Base de datos)**
PostgreSQL actúa como motor de base de datos relacional. Almacena toda la información del sistema: usuarios, empresas, sectores, reportes financieros, indicadores, bitácoras de auditoría y configuraciones. Aprovecha características como índices, restricciones de unicidad y consultas JSONB para los datos extraídos de los reportes.

**Capa de inteligencia artificial (Machine Learning)**
Implementa un modelo de clasificación basado en SVM (Support Vector Machine) para la predicción de recomendaciones financieras (Comprar, Mantener, Vender). El modelo se entrena con datos históricos de indicadores financieros y se integra al backend mediante scripts de Python que utilizan scikit-learn. Los resultados se almacenan en la tabla `recomendacion_ia` y se exponen a través de la API REST.

```
┌──────────────────────────────────────────────────────┐
│          CAPA DE PRESENTACIÓN (React + TS + Tailwind) │
│  Dashboards │ Formularios │ Tablas │ Charts │ Chat    │
└────────────────────────┬─────────────────────────────┘
                         │ HTTP / JSON
┌────────────────────────▼─────────────────────────────┐
│          CAPA DE NEGOCIO (Django + DRF)               │
│  Autenticación │ Usuarios │ Empresas │ Reportes       │
│  Indicadores │ Pipeline ETL │ Chat IA │ Auditoría     │
└────────────────────────┬─────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────┐
│          CAPA DE ACCESO A DATOS (Django ORM)          │
│  Models │ Querysets │ Migrations │ Transacciones      │
└────────────────────────┬─────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────┐
│          CAPA DE PERSISTENCIA (PostgreSQL)            │
│  Tablas relacionales │ Índices │ JSONB │ Constraints  │
└────────────────────────┬─────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────┐
│          CAPA DE IA (scikit-learn / SVM)              │
│  Entrenamiento │ Predicción │ Recomendaciones         │
└──────────────────────────────────────────────────────┘
```

---

## 5.3.4.2. Arquitectura cliente-servidor

El sistema adopta el paradigma cliente-servidor en su forma más clásica, donde el cliente (navegador web) realiza peticiones al servidor (backend Django) y este responde con los datos solicitados.

**Cliente (Frontend)**
- Se ejecuta en el navegador web del usuario (Chrome, Edge, Firefox).
- La aplicación React se sirve como un bundle estático (Vite build) y se ejecuta completamente en el lado del cliente.
- Gestiona su propio estado mediante hooks (`useState`, `useEffect`) y contexto global (`SidebarContext`, autenticación).
- Las rutas están protegidas por rol: cada tipo de usuario ve únicamente las páginas a las que tiene acceso.

**Servidor (Backend)**
- Django corre en un servidor (local o en producción) y escucha peticiones HTTP en el puerto 8000.
- Es responsable de validar la autenticación, ejecutar la lógica de negocio, acceder a la base de datos y devolver respuestas JSON.
- El servidor también ejecuta tareas asíncronas como el pipeline ETL de descarga y procesamiento de reportes.

**Flujo de comunicación**

```
Navegador                  React App                  Django REST API              PostgreSQL
   │                          │                            │                          │
   │  1. Ingresa URL          │                            │                          │
   │─────────────────────────>│                            │                          │
   │                          │  2. Pide login             │                          │
   │                          │───────────────────────────>│                          │
   │                          │                            │  3. Verifica credenciales │
   │                          │                            │─────────────────────────>│
   │                          │                            │<─────────────────────────│
   │                          │  4. Devuelve JWT token     │                          │
   │                          │<───────────────────────────│                          │
   │  5. Renderiza dashboard  │                            │                          │
   │                          │  6. GET /api/dashboard/    │                          │
   │                          │  (con JWT en headers)      │                          │
   │                          │───────────────────────────>│                          │
   │                          │                            │  7. Consulta datos       │
   │                          │                            │─────────────────────────>│
   │                          │                            │<─────────────────────────│
   │                          │  8. Responde JSON          │                          │
   │                          │<───────────────────────────│                          │
   │  9. Muestra KPIs,        │                            │                          │
   │     gráficos y tablas    │                            │                          │
   │<─────────────────────────│                            │                          │
```

**Características de la comunicación:**
- Protocolo HTTP/HTTPS.
- Formato de intercambio: JSON.
- Autenticación stateless mediante tokens JWT (Bearer token en header `Authorization`).
- El frontend almacena el token en `localStorage` y lo incluye automáticamente en cada petición mediante un interceptor de Axios.
- Las peticiones son asíncronas; la interfaz no se bloquea mientras espera respuestas.

---

## 5.3.4.3. Arquitectura basada en servicios REST

El backend expone una API RESTful que sigue los principios de diseño de REST (Representational State Transfer). Cada recurso del sistema tiene una URL única y se accede mediante los métodos HTTP estándar.

**Principios REST aplicados**

| Principio | Implementación |
|---|---|
| Recursos identificados por URL | `/api/usuarios/`, `/api/empresas/`, `/api/reportes/` |
| Métodos HTTP | GET (listar/obtener), POST (crear), PATCH (actualizar parcial), DELETE (eliminar) |
| Formato JSON | Todas las respuestas y peticiones usan `application/json` |
| Stateless | Cada petición contiene toda la información necesaria (JWT incluido) |
| HATEOAS | Los listados incluyen metadatos de paginación (`count`, `next`, `previous`) |

**Endpoints principales**

```
Módulo de autenticación:
  POST   /api/auth/login/          → Iniciar sesión (devuelve JWT)
  POST   /api/auth/logout/         → Cerrar sesión
  GET    /api/auth/me/             → Obtener usuario autenticado

Módulo de usuarios (Admin):
  GET    /api/usuarios/            → Listar usuarios (paginado)
  POST   /api/usuarios/            → Crear usuario
  GET    /api/usuarios/{id}/       → Obtener usuario
  PATCH  /api/usuarios/{id}/       → Actualizar usuario
  DELETE /api/usuarios/{id}/       → Eliminar usuario
  POST   /api/usuarios/{id}/cambiar-grupo/ → Cambiar rol

Módulo de empresas y sectores:
  GET    /api/empresas/            → Listar empresas (filtrable)
  POST   /api/empresas/            → Crear empresa
  GET    /api/empresas/{id}/       → Detalle de empresa
  PATCH  /api/empresas/{id}/       → Actualizar empresa
  DELETE /api/empresas/{id}/       → Eliminar empresa
  GET    /api/sectores/            → Listar sectores
  POST   /api/sectores/            → Crear sector

Módulo de reportes financieros:
  GET    /api/reportes/            → Listar reportes (filtrable)
  GET    /api/empresas/{id}/reportes/ → Reportes por empresa

Módulo de análisis e indicadores:
  GET    /api/dashboard/           → Datos consolidados del dashboard
  GET    /api/indicadores/         → Indicadores financieros
  GET    /api/catalogo-indicadores/ → Catálogo de indicadores

Módulo de inteligencia artificial:
  POST   /api/ia/recomendar/       → Generar recomendación con SVM
  GET    /api/ia/recomendaciones/   → Historial de recomendaciones

Módulo de pipeline ETL:
  POST   /api/pipeline/ejecutar/   → Ejecutar pipeline de carga
  GET    /api/procesos/            → Historial de procesos

Módulo de chat:
  POST   /api/chat/                → Enviar consulta al asistente
```

**Autenticación JWT**
- El cliente obtiene un token JWT mediante `POST /api/auth/login/`.
- El token tiene una expiración configurable (por defecto 24 horas).
- Cada petición a la API incluye el header: `Authorization: Bearer <token>`.
- El backend valida el token en cada request mediante middleware de DRF.
- Los permisos se verifican por grupo de usuario (Administrador, Analista, Auditor, Inversionista).

**Formato de respuesta estándar**
```json
{
  "count": 53,
  "next": "/api/empresas/?page=2",
  "previous": null,
  "results": [
    {
      "id_empresa": 1,
      "nombre": "Banco Nacional de Bolivia",
      "codigo_bbv": "BNB",
      "sector_nombre": "Bancario",
      "activa": true
    }
  ]
}
```

---

## 5.3.4.4. Componentes de la arquitectura del sistema

El sistema BBV Inversiones está compuesto por siete grandes módulos que trabajan de forma coordinada para cubrir todo el ciclo de vida del análisis financiero.

### Módulo de autenticación y gestión de usuarios
- **Ubicación**: `apps/accounts/`
- **Modelos**: `Usuario`, `Genero`, `Direccion`, `PerfilUsuario`, `SesionUsuario`
- **Funcionalidad**: registro, inicio de sesión (con JWT), cierre de sesión, recuperación de contraseña, perfil de usuario, gestión de roles (Administrador, Analista, Auditor, Inversionista).
- **Tecnologías**: Django REST Framework + `djangorestframework-simplejwt` + django-allauth (autenticación por Google OAuth).

### Módulo ETL (Pipeline de carga de datos)
- **Ubicación**: `apps/processing/` e `apps/ingestion/`
- **Modelos**: `ProcesoCarga`, `ArchivoProcesado`
- **Funcionalidad**: descarga automatizada de reportes financieros desde fuentes externas (BBV), extracción de datos PDF, limpieza y transformación, carga a la base de datos.
- **Tecnologías**: Django management commands, `requests` para descarga, `pdfplumber` para extracción.
- **Flujo**: `PENDIENTE → DESCARGADO → PROCESADO → [ERROR]`

### Módulo de empresas y sectores
- **Ubicación**: `apps/financials/`
- **Modelos**: `SectorEmpresa`, `Empresa`, `ReporteFinanciero`
- **Funcionalidad**: catálogo de empresas con clasificación por sector económico, registro de códigos BBV, seguimiento de reportes financieros por período (gestión y trimestre).

### Módulo de análisis financiero
- **Ubicación**: `apps/analytics/`
- **Modelos**: `CatalogoIndicador`, `IndicadorFinanciero`, `ValorIndicador`
- **Funcionalidad**: cálculo de indicadores financieros (liquidez, rentabilidad, endeudamiento), generación de scores financieros, clasificación de riesgo, almacenamiento de valores históricos por reporte.

### Módulo predictivo basado en SVM
- **Ubicación**: `apps/analytics/` (modelos `RecomendacionIA`, `SimulacionFinanciera`)
- **Funcionalidad**: entrenamiento de modelo SVM con datos históricos, predicción de recomendaciones (Comprar/Mantener/Vender), simulación de escenarios financieros, cálculo de score de confianza.
- **Tecnologías**: scikit-learn (`SVC`), joblib para serialización del modelo, NumPy/Pandas para preprocesamiento.

### Módulo de visualización y dashboards
- **Ubicación**: `frontend/src/pages/`
- **Funcionalidad**: dashboards por rol (Administrador, Analista, Auditor, Inversionista), gráficos de indicadores financieros, tablas dinámicas con búsqueda y filtros, vista de detalle de empresas con historial de reportes.
- **Tecnologías**: React, Recharts (gráficos), Tailwind CSS, TypeScript.

### Módulo de auditoría y configuración
- **Ubicación**: `apps/audit/`
- **Modelos**: `BitacoraSistema`, `ConfiguracionSistema`, `TareaProgramada`, `EjecucionTarea`
- **Funcionalidad**: registro de todas las acciones de los usuarios, configuración de parámetros del sistema, programación de tareas periódicas (limpieza, actualización de datos), ejecución y monitoreo de tareas.

### Diagrama de componentes

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           BBV Inversiones                                 │
├────────────────────────────────────────────────────────────────────────────┤
│                              FRONTEND (React + TS)                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │Dashboard │ │Empresas  │ │Reportes  │ │Usuarios  │ │ Chat / IA    │   │
│  │(Admin)   │ │(Analista)│ │(Auditor) │ │(Admin)   │ │(Inversionista)│   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │
│                              │ HTTP / JSON / JWT                          │
├──────────────────────────────┼────────────────────────────────────────────┤
│                     BACKEND (Django + DRF)                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │Auth      │ │Financials│ │Analytics │ │Processing│ │ Audit / IA   │   │
│  │(accounts)│ │(empresas)│ │(indic.)  │ │(ETL)     │ │ (bitácora)   │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │
│                              │ ORM / SQL                                  │
├──────────────────────────────┼────────────────────────────────────────────┤
│                     BASE DE DATOS (PostgreSQL)                           │
│  19 tablas del proyecto + 17 tablas del framework                        │
└────────────────────────────────────────────────────────────────────────────┘
```
