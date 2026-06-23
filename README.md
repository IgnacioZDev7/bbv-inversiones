<div align="center">
  <img src="frontend/public/images/logo/logo.svg" alt="BBV Inversiones" width="200"/>
  <h1>BBV Inversiones</h1>
  <p><strong>Sistema de Análisis Financiero con IA</strong></p>
  <p>Plataforma inteligente para el análisis, simulación y recomendación de inversiones<br/>basada en información histórica de empresas registradas en la Bolsa Boliviana de Valores.</p>
</div>

---

## Características principales

- **Autenticación JWT + Google OAuth** — Inicio de sesión seguro con tokens de acceso/refresco y soporte para cuentas de Google.
- **RBAC con 4 roles** — Administrador, Analista, Auditor e Inversionista con permisos granularmente diferenciados.
- **Pipeline ETL automatizado** — Descarga, parseo y procesamiento de reportes financieros desde la BBV (PDF → datos estructurados).
- **Recomendaciones con IA (SVM)** — Modelo de clasificación basado en scikit-learn que genera recomendaciones Comprar / Mantener / Vender.
- **Asistente financiero Gemini** — Chat interactivo con Gemini 2.5 Flash para consultas sobre empresas, indicadores y el mercado.
- **Verificación facial (AWS Rekognition)** — Biometría facial con detección de suplantación (liveness) para operaciones sensibles.
- **Dashboards dinámicos** — Visualización interactiva de indicadores financieros, históricos y simulaciones con Recharts y ApexCharts.
- **Simulador financiero** — Proyección de escenarios de inversión basados en datos históricos.
- **Registro de auditoría** — Trazabilidad completa de acciones críticas realizadas en el sistema.
- **API REST documentada** — Documentación interactiva vía Swagger y Redoc.

## Tecnologías utilizadas

### Backend
| Tecnología | Versión |
|---|---|
| Python | 3.12 |
| Django | 5.2.12 |
| Django REST Framework | 3.17.1 |
| PostgreSQL | 16+ |
| djangorestframework-simplejwt | 5.5 |
| django-allauth | 65.4 |
| dj-rest-auth | 7.2 |
| django-filter | 24.3 |
| drf-spectacular | 0.29 |
| django-cors-headers | 4.9 |
| Celery | — |

### Frontend
| Tecnología | Versión |
|---|---|
| React | 19 |
| TypeScript | 5.7 |
| Vite | 6.1 |
| Tailwind CSS | 4.0 |
| Axios | 1.14 |
| Recharts | 3.8 |
| ApexCharts | 4.1 |
| Framer Motion | 12 |
| React Router | 7 |
| React Dropzone | 14 |

### Machine Learning e IA
| Tecnología | Propósito |
|---|---|
| scikit-learn 1.8 | SVM para recomendaciones de inversión |
| NumPy / Pandas | Procesamiento de datos financieros |
| Google Gemini 2.5 Flash | Chat asistente financiero |
| AWS Rekognition | Verificación facial y liveness |

### Infraestructura y herramientas
| Herramienta | Uso |
|---|---|
| PostgreSQL | Base de datos principal |
| Graphviz | Generación de diagramas ER (opcional) |
| Pytest | Tests del backend |
| Black / isort / flake8 | Formateo y linting |
| Docker | Contenedores para despliegue |

## Requisitos previos

- **Python** 3.12 o superior
- **Node.js** 18 o superior
- **PostgreSQL** 16 o superior
- **Graphviz** (opcional) — para generar diagramas entidad-relación
- **Credenciales AWS** (opcional) — para el módulo de biometría facial
- **Gemini API Key** (opcional) — para el asistente financiero ChatBBV

## Instalación y configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/bbv-inversiones.git
cd bbv-inversiones
```

### 2. Crear la base de datos PostgreSQL

```bash
psql -U postgres
CREATE DATABASE bbv_inversiones;
\q
```

### 3. Configurar variables de entorno

```bash
cd backend
cp .env.example .env
```

Editar `.env` con los valores correspondientes:

```env
DB_NAME=bbv_inversiones
DB_USER=postgres
DB_PASSWORD=tu_password
DB_HOST=localhost
DB_PORT=5432

GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret

AWS_ACCESS_KEY_ID=tu_aws_access_key
AWS_SECRET_ACCESS_KEY=tu_aws_secret_key
AWS_DEFAULT_REGION=us-east-1

GEMINI_API_KEY=tu_gemini_api_key
```

### 4. Instalar dependencias del backend

```bash
pip install -r requirements/dev.txt
```

### 5. Ejecutar migraciones

```bash
python manage.py migrate
```

### 6. Sembrar roles y datos iniciales

```bash
python manage.py seed_roles
```

### 7. Iniciar el servidor backend

```bash
python manage.py runserver
```

El backend estará disponible en `http://localhost:8000`.

### 8. Instalar dependencias del frontend

```bash
cd frontend
npm install
```

### 9. Iniciar el servidor frontend

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

## Estructura del proyecto

```
bbv-inversiones/
├── backend/
│   ├── core/                  # Configuración Django (settings, urls, wsgi, asgi)
│   ├── api/                   # API REST (views, serializers, routers, urls)
│   ├── apps/
│   │   ├── accounts/          # Gestión de usuarios y autenticación
│   │   ├── analytics/         # Indicadores, simulaciones y recomendaciones
│   │   ├── audit/             # Registro de pistas de auditoría
│   │   ├── biometrics/        # Verificación facial
│   │   ├── financials/        # Empresas, sectores y reportes financieros
│   │   ├── ingestion/         # Gestión del pipeline de ingesta
│   │   └── processing/        # Procesamiento de datos financieros
│   ├── services/
│   │   ├── ai/                # Agentes de IA (chat, riesgo, recomendación)
│   │   ├── analytics/         # Motores de puntuación, tendencias e indicadores
│   │   ├── biometrics/        # Verificación facial y liveness (AWS)
│   │   ├── ingestion/         # Pipeline ETL (descarga, parseo, limpieza)
│   │   └── security/          # JWT, OAuth y permisos
│   ├── data/                  # Datos sin procesar, procesados y semillas
│   ├── requirements/          # Dependencias (base, dev, prod)
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── api/               # Cliente Axios e integración con backend
│   │   ├── components/        # Componentes reutilizables (UI, charts, tables)
│   │   ├── context/           # Contextos de React (sidebar, tema)
│   │   ├── hooks/             # Hooks personalizados
│   │   ├── layout/            # Estructura de la aplicación (header, sidebar)
│   │   ├── pages/             # Páginas por módulo (Auth, Dashboard, Charts)
│   │   ├── icons/             # Iconos SVG del sistema
│   │   ├── App.tsx            # Componente raíz con rutas
│   │   └── main.tsx           # Punto de entrada
│   ├── public/images/         # Recursos gráficos
│   ├── vite.config.ts
│   └── package.json
├── docs/                      # Documentación del proyecto
├── scripts/                   # Scripts de despliegue y mantenimiento
└── docker/                    # Configuración Docker
```

## Roles del sistema

| Rol | Permisos |
|---|---|
| **Administrador** | Acceso completo al sistema. Gestión de usuarios, empresas, roles y configuración global. |
| **Analista** | Visualización y análisis de datos financieros. Acceso a indicadores, simulaciones y reportes. No puede modificar usuarios ni roles. |
| **Auditor** | Acceso de solo lectura a todas las entidades del sistema. Visualización de pistas de auditoría. |
| **Inversionista** | Visualización de empresas, indicadores públicos y recomendaciones. Acceso al simulador y al chat financiero. |

## API endpoints

| Grupo | Endpoints | Descripción |
|---|---|---|
| **Autenticación** | `POST /api/auth/login/`, `/logout/`, `/token/refresh/`, `/password/reset/` | Inicio de sesión JWT, cierre, refresco de token y recuperación de contraseña. |
| **Google OAuth** | `POST /api/auth/google/` | Autenticación mediante cuenta de Google. |
| **Usuarios** | `GET/POST/PUT/DELETE /api/usuarios/` | CRUD de usuarios del sistema (solo administradores). |
| **Perfil** | `GET/PUT /api/accounts/me/` | Visualización y edición del perfil del usuario autenticado. |
| **Empresas** | `GET/POST/PUT/DELETE /api/empresas/` | CRUD de empresas registradas en la BBV. Filtro por sector. |
| **Sectores** | `GET /api/sectores/` | Listado de sectores económicos. |
| **Reportes** | `GET/POST/PUT/DELETE /api/reportes/` | Reportes financieros por empresa, gestión y trimestre. |
| **Indicadores** | `GET /api/indicadores/` | Indicadores financieros calculados por empresa. |
| **Recomendaciones** | `GET /api/recomendaciones/` | Recomendaciones generadas por el modelo SVM. |
| **Simulador** | `POST /api/simulator/` | Simulación de escenarios de inversión. |
| **Dashboard** | `GET /api/dashboard/` | Datos agregados para la vista principal. |
| **Biometría** | `POST /api/biometrics/verify/`, `/liveness/` | Verificación facial y detección de suplantación. |
| **Chat** | `POST /api/chat/` | Asistente financiero impulsado por Gemini. |
| **Documentación** | `GET /api/docs/`, `/api/redoc/`, `/api/schema/` | Swagger UI, Redoc y schema OpenAPI. |

## Pipeline ETL

El sistema incorpora un pipeline automatizado de extracción, transformación y carga para procesar los reportes financieros de la Bolsa Boliviana de Valores:

1. **Descarga** — `bbv_downloader.py` obtiene los archivos PDF desde las fuentes oficiales de la BBV.
2. **Parseo** — Los PDF son procesados con `pdfplumber`, `camelot-py` y `tabula-py` para extraer tablas y datos financieros.
3. **Limpieza** — `cleaners.py` normaliza, valida y estructura los datos extraídos.
4. **Carga** — Los datos procesados se persisten en PostgreSQL a través de los modelos de Django.

El pipeline se ejecuta mediante el comando de gestión:

```bash
python manage.py run_pipeline
```

## Documentación adicional

- **Swagger UI** — Disponible en `/api/docs/` con el servidor en ejecución.
- **Redoc** — Disponible en `/api/redoc/`.
- **Schema OpenAPI** — Disponible en `/api/schema/`.
- **Documentación del proyecto** — Ver el directorio `docs/` para arquitectura, base de datos, despliegue y más.

---

<div align="center">
  <p>Desarrollado como proyecto de fin de semestre — PGM-II, Universidad Franz Tamayo</p>
</div>
