# Análisis Completo - BBV Inversiones

> Basado únicamente en código existente. Sin invenciones.

---

## 1. Arquitectura General

| Capa | Tecnología | Ubicación |
|------|-----------|-----------|
| Backend | Django 5.2 + DRF + PostgreSQL | `backend/` |
| Frontend | React 19 + Vite + TypeScript + Tailwind v4 | `frontend/src/` |
| Autenticación | Google OAuth + JWT (SimpleJWT) | `backend/api/urls.py` |
| Documentación API | Swagger (drf-spectacular) | `/api/docs/` |

**Roles**: Administrador, Analista, Auditor, Inversionista (Groups de Django)

---

## 2. APIs Implementadas

Todas bajo `/api/` (prefijo en `core/urls.py`):

| Endpoint | Método | Vista | Implementado |
|----------|--------|-------|-------------|
| `auth/google/` | POST | `GoogleLogin` | ✅ Completo |
| `auth/` | varias | `dj_rest_auth` | ✅ Completo |
| `accounts/me/` | GET | `UserMeView` | ✅ Completo |
| `accounts/me/` | PATCH | `UserMeView` | ✅ Completo |
| `usuarios/` | GET/POST | `UsuarioViewSet` | ✅ Completo |
| `usuarios/{id}/` | GET/PUT/PATCH/DELETE | `UsuarioViewSet` | ✅ Completo |
| `usuarios/me/` | GET/PATCH | `UsuarioViewSet.me` | ✅ Completo |
| `usuarios/me/completar_perfil/` | PATCH | `UsuarioViewSet.completar_perfil` | ✅ Completo |
| `usuarios/{id}/cambiar-grupo/` | POST | `UsuarioViewSet.cambiar_grupo` | ✅ Completo |
| `empresas/` | GET/POST | `EmpresaViewSet` (api) | ✅ Completo |
| `empresas/{id}/` | GET/PUT/PATCH/DELETE | `EmpresaViewSet` (api) | ✅ Completo |
| `empresas/{id}/actualizar-reportes/` | POST | `EmpresaViewSet.actualizar_reportes` | ✅ Completo |
| `sectores/` | GET/POST | `SectorEmpresaViewSet` | ✅ Completo |
| `sectores/{id}/` | GET/PUT/PATCH/DELETE | `SectorEmpresaViewSet` | ✅ Completo |
| `reportes/` | GET/POST | `ReporteFinancieroViewSet` | ✅ Completo |
| `reportes/{id}/` | GET/PUT/PATCH/DELETE | `ReporteFinancieroViewSet` | ✅ Completo |
| `indicadores/` | GET | `IndicadorViewSet` | ✅ Completo |
| `indicadores/{id}/` | GET | `IndicadorViewSet` | ✅ Completo |
| `indicadores/resumen/` | GET | `IndicadorViewSet.resumen` | ✅ Completo |
| `indicadores/historico/` | GET | `IndicadorViewSet.historico` | ✅ Completo |
| `indicadores/recalcular/` | POST | `IndicadorViewSet.recalcular` | ✅ Completo |
| `simulator/` | GET/POST | `SimulacionViewSet` | ✅ Completo |
| `simulator/execute/` | POST | `SimulacionViewSet.execute` | ✅ Completo |
| `recomendaciones/` | GET | `RecomendacionViewSet` | ✅ Completo |
| `recomendaciones/top/` | GET | `RecomendacionViewSet.top` | ✅ Completo |
| `biometrics/verify/` | POST | `VerifyIdentityView` | ✅ Completo |
| `biometrics/liveness/` | POST | `LivenessDetectionView` | ✅ Completo |
| `chat/` | POST | `ChatView` | ✅ Completo |

---

## 3. Matriz de Casos de Prueba Funcionales

### Pruebas Unitarias

| ID | Nombre | Módulo | Objetivo | Precondiciones | Datos de Entrada | Resultado Esperado | Prioridad | Tipo |
|----|--------|--------|----------|---------------|-----------------|-------------------|-----------|------|
| U-01 | Calcular liquidez corriente | Analytics Engine | Verificar fórmula Activo Corriente / Pasivo Corriente | Reporte con datos extraídos válidos | `ac=1000, pc=500` | `LIQ_CORR=2.0` | Alta | Unitaria |
| U-02 | Calcular ratio de endeudamiento | Analytics Engine | Verificar fórmula Pasivo / Activo | Reporte con datos extraídos | `pasivo=800, activo=2000` | `END=0.4` | Alta | Unitaria |
| U-03 | Calcular ROE | Analytics Engine | Verificar fórmula Utilidad / Patrimonio | Reporte con datos extraídos | `utilidad=100, patrimonio=500` | `ROE=0.2` | Alta | Unitaria |
| U-04 | Calcular score financiero heurístico | Analytics Engine | Verificar puntuación 0-100 con reglas de negocio | Reporte procesado | `LIQ_CORR>=1.2, END<=0.5, PAT>0` | score=100 | Alta | Unitaria |
| U-05 | Validar CI duplicado en completar perfil | Accounts | Rechazar CI ya registrado | Usuario con CI registrado | `ci="1234567"` (existente) | HTTP 400 + error | Media | Unitaria |
| U-06 | Validar campos requeridos en completar perfil | Accounts | Rechazar perfil sin datos obligatorios | Usuario OAuth sin perfil | `ci=""` | HTTP 400 + detalle | Media | Unitaria |
| U-07 | Calculadora de simulación: escenario base | Simulation Service | Verificar cálculo de valor futuro con rendimiento promedio | 2+ reportes financieros procesados | `monto=10000, anios=5` | `valor_futuro > monto` | Alta | Unitaria |
| U-08 | Clasificación de recomendación: score >= 80 | Recommendation Service | Tag "RECOMENDADA" para empresa saludable | Indicador con score 85 | empresa con score 85 | recomendacion="RECOMENDADA" | Media | Unitaria |
| U-09 | Verificar integridad ecuación contable | Data Cleaner | `Activo = Pasivo + Patrimonio` debe cumplirse | Datos extraídos de PDF | `activo=1000, pasivo=400, patrimonio=600` | Válido | Alta | Unitaria |
| U-10 | Validar tamaño imagen biométrica | Biometrics | Rechazar imágenes > 10MB | Imagen de 15MB | `image.size > 10MB` | HTTP 400 + error | Media | Unitaria |

### Pruebas de Integración

| ID | Nombre | Módulo | Objetivo | Precondiciones | Datos de Entrada | Resultado Esperado | Prioridad | Tipo |
|----|--------|--------|----------|---------------|-----------------|-------------------|-----------|------|
| I-01 | Inicio sesión Google OAuth + JWT | Autenticación | Obtener tokens JWT vía Google | Token Google válido | `POST /auth/google/` con access_token | 200 + access + refresh tokens | Alta | Integración |
| I-02 | CRUD completo de empresas | Empresas | Crear, leer, actualizar, eliminar empresa | Usuario Admin autenticado | nombre, codigo_bbv, sector_id | 201 → 200 → 200 → 204 | Alta | Integración |
| I-03 | Ejecutar pipeline ETL completo | Pipeline | Descargar PDF → parsear → limpiar → calcular indicadores | Empresa con código BBV válido | empresa_id, gestion=2024, trimestre=1 | reporte creado + indicadores calculados | Alta | Integración |
| I-04 | Verificar identidad biométrica | Biometrics | Comparar carnet vs selfie con Rekognition | Usuario autenticado + AWS Rekognition activo | `carnet_image` + `selfie_image` (multipart) | 200 + verified + similarity | Alta | Integración |
| I-05 | Chat con asistente Gemini | Chat IA | Enviar mensaje y recibir respuesta financiera | Usuario autenticado + GEMINI_API_KEY | `{"message": "¿Liquidez de empresa X?"}` | 200 + reply + conversation_id | Alta | Integración |
| I-06 | Recalcular indicadores de una empresa | Indicadores | Ejecutar AnalysisEngine.process_report para todos los reportes | Reportes en estado PROCESADO | empresa_id | 200 + lista de indicadores_ids | Alta | Integración |
| I-07 | Simulación financiera completa | Simulador | Ejecutar simulación Monte Carlo y persistir resultado | Usuario autenticado + 2+ reportes | `{"empresa_id":1, "monto":10000, "horizonte":5}` | 201 + SimulacionFinanciera creada | Alta | Integración |
| I-08 | Obtener recomendaciones top por scoring | Recomendaciones | Ranking descendente de empresas por score | Indicadores financieros calculados | GET `/recomendaciones/top/` | 200 + array ordenado por score | Media | Integración |
| I-09 | Detección de liveness facial | Biometrics | Verificar rostro vivo con Rekognition | Usuario autenticado + AWS activo | `selfie_image` (multipart) | 200 + alive + confidence | Alta | Integración |
| I-10 | CRUD completo de reportes financieros | Reportes | CRUD de reportes con filtros por empresa/gestión | Usuario autenticado | empresa_id, gestion, trimestre | 201 → 200 → 200 → 204 | Alta | Integración |

### Pruebas de Sistema

| ID | Nombre | Módulo | Objetivo | Precondiciones | Datos de Entrada | Resultado Esperado | Prioridad | Tipo |
|----|--------|--------|----------|---------------|-----------------|-------------------|-----------|------|
| S-01 | Flujo completo: Registro Google → completar perfil → dashboard | Sistema | Usuario nuevo completa onboarding completo | Cuenta Google | Autenticación → completar perfil → redirección | Dashboard según rol | Alta | Sistema |
| S-02 | Redirección por rol (Admin/Analista/Auditor/Inversionista) | Sistema | Cada rol ve su propio dashboard | Usuario autenticado con cada rol | GET `/` | Redirección a ruta específica del rol | Alta | Sistema |
| S-03 | Restricción de acceso: Admin a ruta de Inversionista | Seguridad | Admin no puede ver /investor/* | Usuario Admin autenticado | GET `/investor/dashboard` | 403 o redirect a unauthorized | Alta | Sistema |
| S-04 | Dashboard Admin: visualización completa con indicadores | Dashboard Admin | Ver KPIs, gráficos, tabla financiera | Empresas + reportes cargados | GET `/admin/` | Todas las secciones renderizadas con datos | Media | Sistema |
| S-05 | Dashboard Investor: simulación biométrica gate | Dashboard Investor | Simulador bloqueado hasta verificación facial | Usuario Investor autenticado sin verificar | Click en "Ir al Simulador" | BiometricWizard se muestra | Alta | Sistema |
| S-06 | Verificación biométrica → acceso al simulador | Simulador | Usuario se verifica y accede al simulador | Usuario Investor sin verificar | 3 pasos wizard biométrico | sessionStorage.biometric_verified = true + Simulador visible | Alta | Sistema |
| S-07 | Pipeline ETL: descarga → parseo → indicadores (flujo completo) | Procesamiento | Procesar reporte real desde descarga hasta indicadores | Empresa con código BBV + conexión internet | POST `empresas/{id}/actualizar-reportes/` | Reporte + Indicadores + Valores creados en BD | Alta | Sistema |
| S-08 | Chat contextual por empresa (Admin) | Chat IA | Consultar sobre empresa específica desde detalle | Empresa cargada | Mensaje en chat de `Admin/CompanyDetail` | Respuesta contextualizada de Gemini | Media | Sistema |
| S-09 | Gestión completa de usuarios por Admin | Usuarios | CRUD + cambio de roles | Usuario Admin autenticado | Crear, editar, eliminar, cambiar grupo | Operaciones reflejadas en BD | Alta | Sistema |
| S-10 | Calendario con eventos (placeholder) | UI | Visualizar calendario con interacción | Navegación a `/calendar` | Seleccionar fecha | Console.log de fecha seleccionada | Baja | Sistema |

---

## 4. Matriz de Cobertura

| Requisito / Módulo | Casos de Prueba Asociados |
|--------------------|--------------------------|
| **Autenticación Google OAuth + JWT** | I-01, S-01 |
| **Roles y permisos (4 roles)** | S-02, S-03 |
| **CRUD Empresas** | I-02 |
| **CRUD Sectores** | (no cubierto - se puede inferir de I-02) |
| **CRUD Reportes Financieros** | I-10 |
| **CRUD Usuarios + cambio de roles** | S-09 |
| **Pipeline ETL (descargar → parsear → limpiar → indicadores)** | I-03, S-07 |
| **Cálculo de indicadores financieros (7 indicadores)** | U-01, U-02, U-03, U-04 |
| **Score financiero heurístico** | U-04 |
| **Simulación financiera (3 escenarios)** | U-07, I-07 |
| **Recomendaciones por scoring** | U-08, I-08 |
| **Biometría: verificación facial** | I-04, U-10 |
| **Biometría: detección de liveness** | I-09 |
| **Chat con Gemini** | I-05, S-08 |
| **Dashboard Admin** | S-04 |
| **Dashboard Investor** | S-05, S-06 |
| **Dashboard Analyst** | (no cubierto - similar a S-04) |
| **Dashboard Auditor** | (no cubierto - placeholder) |
| **Completar perfil de usuario** | U-05, U-06, S-01 |
| **Validaciones de datos financieros** | U-09 |

---

## 5. Funcionalidades Implementadas

Basado en código existente verificable:

### Backend (Django - 100% implementado)

1. **Autenticación Google OAuth** - `GoogleLogin` vía dj-rest-auth + allauth
2. **JWT (access + refresh)** - SimpleJWT integrado con refresh automático en frontend
3. **Gestión de Usuarios** - CRUD completo con `UsuarioViewSet`, cambio de roles, completar perfil
4. **Roles y Permisos** - 4 grupos (Administrador, Analista, Auditor, Inversionista) con 7 clases de permiso
5. **CRUD Empresas** - `EmpresaViewSet` con filtros, búsqueda, ordenamiento
6. **CRUD Sectores** - `SectorEmpresaViewSet`
7. **CRUD Reportes Financieros** - `ReporteFinancieroViewSet` con filtros por empresa/gestión/trimestre/estado
8. **Pipeline ETL** - `FinancialPipeline`: BBVDownloader (descarga PDF) → PDFParser (extracción) → DataCleaner (validación ecuación contable) → IndicatorEngine (cálculo ratios) → persistencia
9. **Cálculo de Indicadores** - `AnalysisEngine`: 7 indicadores (LIQ_CORR, CAP_TRAB, END, PAT, ROA, ROE, MARG_NETO) + score heurístico 0-100
10. **Simulación Financiera** - `SimulationService`: 3 escenarios (conservador/moderado/agresivo) basados en volatilidad histórica
11. **Recomendaciones por Scoring** - `RecommendationService`: ranking descendente con 3 niveles (RECOMENDADA/OBSERVAR/RIESGO ALTO)
12. **Chat con Gemini 2.5 Flash** - `chat_with_gemini` con system prompt financiero
13. **Biometría Facial** - `verify_identity` con Amazon Rekognition CompareFaces
14. **Detección de Liveness** - `detect_liveness` con Amazon Rekognition DetectFaces (ojos abiertos, pose frontal)
15. **Modelo de Datos Completo** - Usuario, Direccion, PerfilUsuario, SesionUsuario, Genero, SectorEmpresa, Empresa, ReporteFinanciero, CatalogoIndicador, IndicadorFinanciero, ValorIndicador, SimulacionFinanciera, RecomendacionIA, ArchivoProcesado, ProcesoCarga, BitacoraSistema, ConfiguracionSistema, TareaProgramada, EjecucionTarea
16. **Auditoría** - Modelo `BitacoraSistema` creado (sin endpoints de consulta implementados)
17. **Documentación API** - Swagger + Redoc con drf-spectacular
18. **Pruebas Unitarias** - `test_analytics.py` (7 tests), `test_accounts.py` (4 tests)

### Frontend (React - implementado)

1. **Autenticación** - SignIn/SignUp con Google OAuth + login manual, refresh automático de JWT
2. **Sidebar por rol** - Navegación filtrada por grupo del usuario
3. **Dashboard Admin** - Selector de empresas, KPIs, gráficos financieros (Lightweight Charts, Recharts, ApexCharts), comparación sectorial, chat IA, watchlist, 3D visualization
4. **Dashboard Analyst** - KPIs, gráficos históricos, indicadores financieros, tabla de métricas, gauge de riesgo
5. **Dashboard Investor** - KPIs, watchlist, gráficos históricos, chart toggle (line/area/bar/candle)
6. **Simulador Financiero** - Protegido por biometría, 3 escenarios, gráficos Lightweight Charts, tabla de métricas (TIR, VAN, ROI, Payback)
7. **CRUD Empresas (Admin)** - Tabla con búsqueda/filtros, modales de creación/edición/eliminación
8. **Detalle de Empresa** - Tabs: Info, Reportes, Ratios, Comparación Sectorial, Chat IA
9. **CRUD Usuarios (Admin)** - Tabla con modales, cambio de rol
10. **CRUD Sectores (Admin)** - Tabla con modales
11. **Procesos/Auditoría (Admin)** - Filtros por fecha/acción/usuario, tabla paginada
12. **Chat** - Interfaz completa con historial de conversaciones (localStorage)
13. **Perfil de Usuario** - Edición de datos personales con foto
14. **Página de Inicio** - Dashboard demo con métricas, gráficos, tabla de órdenes
15. **Gráficos Financieros** - 8 componentes de chart (Recharts, ApexCharts, Lightweight Charts, Three.js)
16. **Rutas Protegidas** - `ProtectedRoute` por rol
17. **BiometricWizard** - 3 pasos: documento → captura facial → verificación

---

## 6. Funcionalidades Parcialmente Implementadas

| Funcionalidad | Qué falta | Archivos |
|--------------|-----------|----------|
| **Dashboard Auditor** | Solo placeholders con datos hardcodeados, sin integración API | `frontend/src/pages/Auditor/index.tsx` |
| **Auditoría (BitacoraSistema)** | Modelo creado, endpoint de consulta NO implementado, frontend usa datos placeholder | `backend/apps/audit/models.py`, `backend/apps/audit/views.py` (stub) |
| **Pipeline ETL - run_pipeline** | Comando creado pero depende de conexión BBV y PDF reales | `backend/apps/financials/management/commands/run_pipeline.py` |
| **Tests** | Solo 11 tests para 2 apps, cobertura muy baja | `backend/tests/` |
| **BiometricWizard - captura real** | Usa webcam pero no envía realmente a AWS (simula verificación en frontend) | `frontend/src/components/biometrics/` |
| **Página de Inicio (Home)** | Datos hardcodeados de demostración, no conectados a API real | `frontend/src/pages/Dashboard/Home.tsx` |
| **Gráfico de Demografía** | Datos placeholder, no reales | `frontend/src/components/ecommerce/DemographicCard.tsx` |

---

## 7. Funcionalidades No Implementadas (Solo Placeholders o Vacías)

| Funcionalidad | Evidencia |
|--------------|-----------|
| **AI - Financial Simulation Agent** | `backend/services/ai/financial_simulation_agent.py` — archivo vacío |
| **AI - Recommendation Agent** | `backend/services/ai/recommendation_agent.py` — archivo vacío |
| **AI - Risk Analysis Agent** | `backend/services/ai/risk_analysis_agent.py` — archivo vacío |
| **Scoring Engine** | `backend/services/analytics/scoring_engine.py` — archivo vacío |
| **Trend Engine** | `backend/services/analytics/trend_engine.py` — archivo vacío |
| **JWT Manager** | `backend/services/security/jwt_manager.py` — archivo vacío |
| **OAuth Manager** | `backend/services/security/oauth_manager.py` — archivo vacío |
| **Permissions Manager** | `backend/services/security/permissions_manager.py` — archivo vacío |
| **Integraciones AWS** | `backend/services/integrations/aws/` — directorio vacío |
| **Integraciones Google** | `backend/services/integrations/google/` — directorio vacío |
| **Integraciones OpenAI** | `backend/services/integrations/openai/` — directorio vacío |
| **Módulo Parsers** | `backend/services/parsers/` — directorio vacío |
| **Módulo Pipelines** | `backend/services/pipelines/` — directorio vacío |
| **Módulo Engines** | `backend/services/engines/` — directorio vacío |
| **Routers API** | `backend/api/routers/` — directorio vacío |
| **Permissions API** | `backend/api/permissions/` — directorio vacío |
| **Legacy** | `backend/legacy/` — directorio vacío |
| **Notebooks Jupyter** | Ningún `.ipynb` en el proyecto |
| **Modelos ML entrenados** | Ningún `.pkl`, `.h5`, ni scripts de entrenamiento |
| **Predicción de precios/SVM** | No existe ruta, vista, ni modelo para esto |
| **Frontend - Mapa real** | `CountryMap.tsx` solo muestra puntos, no mapa real |
| **Frontend - Auditor tabs (Historial, Reportes, Logs)** | Solo tablas placeholder sin datos reales |

---

## 8. Resumen de Cobertura de Código

| Métrica | Valor |
|---------|-------|
| Modelos Django creados | 19 |
| Vistas DRF implementadas | 12 (ViewSets + APIViews) |
| Endpoints REST | 28 |
| Serializers | 8 |
| Clases de permiso | 7 |
| Comandos management | 5 |
| Tests unitarios | 11 |
| Servicios de negocio | 6 (AnalysisEngine, SimulationService, RecommendationService, IndicatorEngine, BBVDownloader, PDFParser, DataCleaner, Pipeline) |
| Páginas frontend | 34 |
| Componentes React | ~150 |
| Servicios frontend API | 18 funciones |
| Archivos vacíos/placeholders | 17 |
