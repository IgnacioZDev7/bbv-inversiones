# 5.3.2. Metodología CRISP-DM

El desarrollo del sistema BBV Inversiones se ha guiado por la metodología CRISP-DM (Cross-Industry Standard Process for Data Mining), que proporciona un enfoque estructurado y cíclico para proyectos de análisis de datos y machine learning. A continuación se describen las cinco fases aplicadas al proyecto.

---

## 5.3.2.1. Comprensión del negocio

**Objetivo del negocio**
Desarrollar una plataforma web que automatice la recolección, procesamiento y análisis de reportes financieros de empresas registradas en la Bolsa Boliviana de Valores (BBV), proporcionando dashboards interactivos, indicadores financieros clave y recomendaciones de inversión basadas en machine learning.

**Actores involucrados**

| Rol | Necesidad principal |
|---|---|
| Administrador | Gestionar usuarios, empresas, sectores y monitorear el sistema |
| Analista | Visualizar indicadores financieros, comparar empresas, ejecutar análisis |
| Auditor | Revisar el historial de procesamiento de reportes y la bitácora del sistema |
| Inversionista | Obtener recomendaciones de inversión basadas en datos y consultar al asistente IA |

**Problemas identificados**
1. Los reportes financieros se descargaban manualmente desde fuentes dispersas.
2. No existía una base de datos centralizada con el historial financiero de las empresas.
3. El cálculo de indicadores se realizaba en hojas de cálculo propensas a errores.
4. No había herramientas predictivas para apoyar la toma de decisiones de inversión.
5. Cada rol (administrador, analista, auditor, inversionista) no contaba con una vista adaptada a sus necesidades.

**Criterios de éxito**
- Automatizar la descarga y procesamiento de reportes financieros (Pipeline ETL).
- Centralizar la información en una base de datos relacional con 19 tablas del dominio.
- Generar indicadores financieros calculados automáticamente a partir de los datos extraídos.
- Implementar un modelo SVM con precisión superior al 70% en recomendaciones.
- Proveer dashboards diferenciados por rol funcional.

---

## 5.3.2.2. Comprensión de los datos

**Fuentes de datos**

| Fuente | Tipo | Formato | Volumen |
|---|---|---|---|
| Bolsa Boliviana de Valores (BBV) | Reportes financieros públicos | PDF | ~988 reportes de 53 empresas |
| Registro manual de empresas | Datos corporativos | Formulario web | 53 empresas en 19 sectores |
| Usuarios del sistema | Datos de registro y perfil | Formulario web | 7 usuarios |

**Descripción de los datos**

**Datos de empresas (SectorEmpresa, Empresa)**
- 19 sectores económicos (Bancario, Seguros, Agropecuario, Energético, etc.)
- 53 empresas con código BBV, nombre, sigla, descripción y sitio web
- Cada empresa pertenece a un único sector

**Datos de reportes financieros (ReporteFinanciero)**
- Reportes trimestrales y anuales por empresa
- Estados: PENDIENTE, DESCARGADO, PROCESADO, ERROR
- Metadatos: gestión, trimestre, fecha de publicación, URL PDF, hash del archivo
- Datos extraídos almacenados en formato JSONB

**Datos de indicadores (CatalogoIndicador, IndicadorFinanciero, ValorIndicador)**
- Catálogo de indicadores con nombre, código único y fórmula
- Valores numéricos de indicadores por reporte
- Score financiero (0-100) y clasificación de riesgo

**Datos de usuarios (Usuario)**
- 7 usuarios distribuidos en 4 grupos (Administrador, Analista, Auditor, Inversionista)
- Datos personales: nombre, email, CI, celular, fecha de nacimiento, género
- Autenticación mediante JWT con soporte OAuth2 (Google)

**Calidad de los datos**
- Los reportes PDF presentan formatos heterogéneos según la empresa emisora.
- Algunos campos contienen valores nulos (descripción, sitio web, sigla).
- Se implementaron validaciones en el backend (DRF serializers) y en la base de datos (constraints NOT NULL, UNIQUE).

---

## 5.3.2.3. Preparación de los datos

**Pipeline ETL (Extract, Transform, Load)**

El proceso de preparación de datos se automatizó mediante un pipeline orquestado desde Django:

```
1. EXTRACCIÓN
   ├── Consulta programada a fuentes BBV
   ├── Descarga de archivos PDF
   └── Almacenamiento en servidor (ruta_archivo)

2. TRANSFORMACIÓN
   ├── Extracción de texto con pdfplumber
   ├── Parseo de tablas financieras
   ├── Limpieza de datos (eliminación de caracteres no numéricos)
   ├── Transformación a JSON estructurado
   └── Normalización de nombres de campos

3. CARGA
   ├── Inserción en tabla reporte_financiero
   ├── Creación de registros en archivo_procesado
   ├── Cálculo y almacenamiento de indicadores
   └── Actualización de estado (PENDIENTE → PROCESADO)
```

**Tareas de preparación específicas**

| Tarea | Descripción | Herramienta |
|---|---|---|
| Extracción PDF | Lectura de tablas y texto desde reportes PDF | pdfplumber, PyPDF2 |
| Limpieza | Eliminación de caracteres especiales, normalización de decimales | Python (re, pandas) |
| Transformación a JSON | Estructuración de datos extraídos en formato JSONB | json.dumps() |
| Validación | Verificación de tipos de datos y rangos | Serializers de DRF |
| Deduplicación | Control por empresa + gestión + trimestre | unique_together en modelo |

**Manejo de datos faltantes**
- Campos opcionales se almacenan como NULL en la base de datos.
- El frontend muestra "—" cuando el valor es nulo.
- Para el modelo SVM, los valores nulos se imputan con la media del indicador.

---

## 5.3.2.4. Modelado mediante SVM

**Problema a resolver**
Clasificar empresas en tres categorías de recomendación de inversión: **Comprar**, **Mantener** o **Vender**, basándose en indicadores financieros históricos.

**Algoritmo seleccionado**
Se eligió SVM (Support Vector Machine) con kernel RBF (Radial Basis Function) por su capacidad para manejar datos multidimensionales y su buen rendimiento en problemas de clasificación con fronteras no lineales.

**Arquitectura del modelo**

```
Características de entrada (features):
  ├── score_financiero (0-100)
  ├── clasificacion_riesgo (codificada)
  ├── valores de indicadores individuales
  │     └── liquidez, rentabilidad, endeudamiento, etc.
  └── variables temporales (gestión, trimestre)

Procesamiento:
  ├── Normalización (StandardScaler)
  ├── Reducción de dimensionalidad (opcional)
  └── Clasificación con SVC(kernel='rbf', C=1.0, gamma='scale')

Salida:
  └── Recomendación: COMPRAR | MANTENER | VENDER
      └── Score de confianza (0.00 - 100.00)
```

**Implementación**

```python
from sklearn import svm
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

modelo = Pipeline([
    ('scaler', StandardScaler()),
    ('svm', svm.SVC(kernel='rbf', C=1.0, gamma='scale', probability=True))
])

modelo.fit(X_train, y_train)
predicciones = modelo.predict(X_test)
probabilidades = modelo.predict_proba(X_test)
```

**Integración con Django**
- El modelo entrenado se serializa con `joblib` y se almacena en el servidor.
- El endpoint `POST /api/ia/recomendar/` recibe los datos de una empresa, ejecuta la predicción y almacena el resultado en `recomendacion_ia`.
- Cada recomendación queda vinculada al usuario que la solicitó y a la empresa analizada.

---

## 5.3.2.5. Evaluación y validación del modelo

**Métricas de evaluación**

| Métrica | Valor esperado | Propósito |
|---|---|---|
| Accuracy | ≥ 75% | Proporción de predicciones correctas |
| Precision | ≥ 70% | Porcentaje de positivos correctos sobre el total de positivos |
| Recall | ≥ 70% | Capacidad de identificar todos los positivos |
| F1-Score | ≥ 72% | Media armónica de precisión y recall |
| Matriz de confusión | — | Visualización de aciertos y errores por clase |

**Validación cruzada**
Se aplicó validación cruzada de 5 folds (k-fold cross validation) para garantizar que el modelo generalice correctamente y no presente sobreajuste (overfitting).

**Resultados esperados**

```
Matriz de confusión:
                Predicho
                C   M   V
Real    Comprar  8   1   1
        Mantener 1   7   2
        Vender   1   1   8
```

**Ciclo de mejora continua**
Siguiendo la naturaleza iterativa de CRISP-DM:
1. Se recolectan nuevos reportes financieros cada trimestre.
2. El modelo se reentrena periódicamente con los nuevos datos.
3. Las predicciones se comparan con el rendimiento real de las empresas.
4. Los hiperparámetros del SVM se ajustan según los resultados.

---

---

# 5.3.3. Metodología Design Thinking

El diseño de la interfaz de usuario y la experiencia de navegación del sistema BBV Inversiones se desarrolló siguiendo la metodología Design Thinking, centrada en el usuario final y sus necesidades reales. A continuación se describen las cinco fases aplicadas.

---

## 5.3.3.1. Empatizar

**Objetivo**
Comprender las necesidades, frustraciones y contexto de cada tipo de usuario que interactuaría con el sistema.

**Perfiles de usuario identificados**

| Perfil | Contexto de uso | Dolor principal |
|---|---|---|
| **Administrador** | Gestiona la plataforma: usuarios, empresas, sectores. Supervisa el funcionamiento del sistema. | Procesos manuales para administrar el catálogo de empresas y usuarios. Falta de visibilidad del estado del sistema. |
| **Analista** | Evalúa indicadores financieros, compara empresas, genera reportes de análisis. | Datos dispersos en múltiples fuentes. Cálculos manuales en Excel propensos a errores. |
| **Auditor** | Revisa la integridad del procesamiento de datos y las acciones de los usuarios. | No existe un registro centralizado de actividades ni trazabilidad de procesos. |
| **Inversionista** | Toma decisiones de inversión basadas en datos y recomendaciones. | Falta de herramientas predictivas. Dificultad para interpretar grandes volúmenes de datos financieros. |

**Técnicas utilizadas**
- Entrevistas informales con potenciales usuarios del sistema.
- Observación del flujo de trabajo actual (revisión manual de reportes BBV).
- Análisis de sistemas similares en el mercado.

---

## 5.3.3.2. Definir

**Objetivo**
Sintetizar la información recabada en la fase de empatía para definir problemas concretos y accionables.

**Problemas definidos**

| # | Problema | Afecta a |
|---|---|---|
| P1 | No existe una plataforma centralizada que consolide los reportes financieros de la BBV. | Analistas, Inversionistas |
| P2 | La descarga y procesamiento de reportes se realiza manualmente, consumiendo horas de trabajo. | Administradores, Analistas |
| P3 | Los indicadores financieros se calculan con herramientas ofimáticas sin control de versiones. | Analistas |
| P4 | No hay recomendaciones automatizadas basadas en datos objetivos para apoyar decisiones de inversión. | Inversionistas |
| P5 | Cada rol necesita una vista diferente del sistema, pero no existe diferenciación de permisos ni interfaces adaptadas. | Todos los roles |
| P6 | No hay registro de auditoría sobre quién hizo qué y cuándo en el sistema. | Auditores, Administradores |

**Propuesta de valor**
> "Un sistema web integral que automatiza la recolección y procesamiento de reportes financieros, calcula indicadores clave, genera recomendaciones de inversión mediante inteligencia artificial y ofrece dashboards adaptados a cada rol, todo en una plataforma centralizada, segura y fácil de usar."

---

## 5.3.3.3. Idear

**Objetivo**
Generar soluciones creativas para cada uno de los problemas definidos.

**Lluvia de ideas y soluciones propuestas**

| Problema | Solución propuesta |
|---|---|
| P1 | Base de datos centralizada con modelo relacional (19 tablas del proyecto). |
| P2 | Pipeline ETL automatizado que descarga, extrae y procesa los reportes sin intervención manual. |
| P3 | Módulo de análisis financiero que calcula indicadores automáticamente desde los datos extraídos. |
| P4 | Modelo SVM de clasificación que genera recomendaciones Comprar/Mantener/Vender con score de confianza. |
| P5 | Sistema de autenticación por roles con dashboards, rutas y componentes diferenciados por grupo. |
| P6 | Módulo de bitácora que registra todas las acciones de los usuarios con fecha, IP y detalle. |

**Características priorizadas**
1. MVP funcional con autenticación y gestión básica de empresas.
2. Dashboard de administrador con KPIs y gráficos.
3. Pipeline ETL para automatizar la carga de reportes.
4. Módulo de indicadores financieros y visualización.
5. Modelo SVM para recomendaciones de inversión.
6. Chat asistente por IA para consultas en lenguaje natural.

---

## 5.3.3.4. Prototipar

**Objetivo**
Convertir las ideas en prototipos funcionales que puedan ser probados y refinados.

**Prototipos desarrollados**

**Prototipo 1: Wireframes de navegación (Baja fidelidad)**
- Se diseñaron mockups en papel y herramientas digitales mostrando la estructura de cada página.
- Se definió la navegación principal: sidebar con secciones por rol.
- Se estableció el flujo: Login → Dashboard → Módulos específicos.

**Prototipo 2: Frontend funcional (Media fidelidad)**
- Se implementaron componentes React con datos simulados (mock data).
- 12 páginas distribuidas en 4 roles:
  - **Admin**: Dashboard, Usuarios, Empresas, Sectores, Procesos, Bitácora
  - **Analista**: Dashboard, Indicadores, Comparación, Simulación
  - **Auditor**: Dashboard, Procesos, Bitácora
  - **Inversionista**: Dashboard, Cartera, Recomendaciones, Chat
- Se probaron layouts responsivos (cards en móvil, tabla en desktop).

**Prototipo 3: Backend API (Alta fidelidad)**
- Implementación completa de la API REST con Django REST Framework.
- Endpoints reales conectados a PostgreSQL.
- Autenticación JWT funcional.
- Pipeline ETL operativo.

**Prototipo 4: Integración completa**
- Conexión frontend-backend con datos reales.
- Dashboard unificado con endpoint `/api/dashboard/` que consolida KPIs.
- Tablas con búsqueda, filtros y paginación desde el backend.

**Tecnologías de prototipado**

| Componente | Tecnología |
|---|---|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS |
| Backend | Python 3.12 + Django 5.2 + DRF |
| Base de datos | PostgreSQL |
| Gráficos | Recharts |
| ML | scikit-learn (SVM) |
| Contenedores | Docker + docker-compose |

---

## 5.3.3.5. Evaluación de prototipos

**Objetivo**
Probar los prototipos con usuarios reales o simulados para identificar problemas de usabilidad y funcionalidad, y retroalimentar el ciclo de diseño.

**Criterios de evaluación**

| Aspecto | Criterio | Método |
|---|---|---|
| Usabilidad | El usuario completa una tarea en menos de 3 pasos | Observación directa |
| Claridad visual | Los datos se interpretan sin confusión | Entrevista post-prueba |
| Tiempo de carga | Las páginas cargan en menos de 2 segundos | Medición con herramientas de desarrollo |
| Responsividad | La interfaz se ve bien en móvil y desktop | Prueba en múltiples viewports |
| Consistencia | Los colores, tipografía y espaciado son uniformes | Revisión de estilo |

**Hallazgos y mejoras implementadas**

| Hallazgo | Mejora aplicada |
|---|---|
| El dashboard hacía múltiples llamadas API causando lentitud | Se creó un solo endpoint `/api/dashboard/` que consolida todos los datos |
| Las tablas se desbordaban en pantallas pequeñas | Se agregó `overflow-x-auto` en todas las tablas y vista en cards para móvil |
| Los colores de texto no eran legibles en modo oscuro | Se agregaron clases `dark:` en todos los componentes |
| Los usuarios no sabían qué acciones podían hacer | Se agregaron títulos descriptivos a los botones y breadcrumbs de navegación |
| Los modales se cortaban en pantallas pequeñas | Se agregó `overflow-y-auto` + `py-10` en todos los overlays |
| La tabla de usuarios era demasiado ancha | Se eliminaron anchos fijos de columnas, se usó `min-w-full` con `overflow-x-auto` |

**Ciclo iterativo**
Cada evaluación generó una nueva iteración de prototipado:

```
Prototipo inicial → Evaluación → Feedback → Refinamiento → Nuevo prototipo
```

Este ciclo se repitió hasta alcanzar un nivel de usabilidad aceptable para cada módulo del sistema.
