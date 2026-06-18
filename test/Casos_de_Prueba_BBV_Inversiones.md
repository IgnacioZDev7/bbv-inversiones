# Casos de Prueba (Test Cases) - Proyecto BBV Inversiones

Este archivo contiene los 15 casos de prueba extraídos del documento del proyecto, formateados individualmente como tablas en Markdown.

## Caso de Prueba: TC-001 - Inicio de sesión exitoso mediante Google OAuth

| Campo | Detalle |
| :--- | :--- |
| **Título** | Inicio de sesión exitoso mediante Google OAuth |
| **ID** | TC-001 |
| **Autor** | Equipo BBV Inversiones |
| **Fecha** |  |
| **Caso de Uso perteneciente** | DCU-01 Seguridad y Control de Acceso |
| **Módulo** | Seguridad y Control de Acceso |
| **Versión del Sistema** | 1.0.0 |
| **Descripción** | Verificar que un usuario registrado pueda autenticarse correctamente utilizando Google OAuth y acceder al sistema. |
| **Datos Requeridos** | Cuenta Google válida registrada en el sistema. |
| **Prerrequisitos** | Sistema operativo. Servicio Google OAuth disponible. Usuario previamente registrado. |
| **Postcondiciones** | Sesión iniciada correctamente. |
| **Notas** | Caso principal de autenticación. |

---

## Caso de Prueba: TC-002 - Redirección al dashboard según rol asignado

| Campo | Detalle |
| :--- | :--- |
| **Título** | Redirección al dashboard según rol asignado |
| **ID** | TC-002 |
| **Autor** | Equipo BBV Inversiones |
| **Fecha** |  |
| **Caso de Uso perteneciente** | DCU-01 Seguridad y Control de Acceso |
| **Módulo** | Seguridad y Control de Acceso |
| **Versión del Sistema** | 1.0.0 |
| **Descripción** | Verificar que el sistema redireccione al dashboard correspondiente según el rol del usuario autenticado. |
| **Datos Requeridos** | Usuarios con roles Administrador, Analista, Inversionista y Auditor. |
| **Prerrequisitos** | Usuario autenticado exitosamente. |
| **Postcondiciones** | Usuario visualiza el dashboard asociado a su rol. |
| **Notas** | Utilizar usuarios de prueba para cada rol. |

---

## Caso de Prueba: TC-003 - Restricción de acceso a módulos no autorizados

| Campo | Detalle |
| :--- | :--- |
| **Título** | Restricción de acceso a módulos no autorizados |
| **ID** | TC-003 |
| **Autor** | Equipo BBV Inversiones |
| **Fecha** |  |
| **Caso de Uso perteneciente** | DCU-01 Seguridad y Control de Acceso |
| **Módulo** | Seguridad y Control de Acceso |
| **Versión del Sistema** | 1.0.0 |
| **Descripción** | Verificar que un usuario no pueda acceder a funcionalidades que no correspondan a su rol. |
| **Datos Requeridos** | Usuario autenticado con rol limitado. |
| **Prerrequisitos** | Usuario autenticado. |
| **Postcondiciones** | Acceso denegado y mensaje de autorización insuficiente. |
| **Notas** | Validar rutas protegidas. |

---

## Caso de Prueba: TC-004 - Consulta correcta del listado de empresas registradas

| Campo | Detalle |
| :--- | :--- |
| **Título** | Consulta correcta del listado de empresas registradas |
| **ID** | TC-004 |
| **Autor** | Equipo BBV Inversiones |
| **Fecha** |  |
| **Caso de Uso perteneciente** | DCU-02 Gestión de Empresas e Información Bursátil |
| **Módulo** | Gestión de Empresas |
| **Versión del Sistema** | 1.0.0 |
| **Descripción** | Verificar que el sistema muestre correctamente el listado de empresas almacenadas en la base de datos. |
| **Datos Requeridos** | Empresas previamente cargadas. |
| **Prerrequisitos** | Usuario autenticado. |
| **Postcondiciones** | Se visualiza el listado completo de empresas. |
| **Notas** | Verificar carga correcta de registros. |

---

## Caso de Prueba: TC-005 - Visualización detallada de información financiera de una empresa

| Campo | Detalle |
| :--- | :--- |
| **Título** | Visualización detallada de información financiera de una empresa |
| **ID** | TC-005 |
| **Autor** | Equipo BBV Inversiones |
| **Fecha** |  |
| **Caso de Uso perteneciente** | DCU-02 Gestión de Empresas e Información Bursátil |
| **Módulo** | Gestión de empresas |
| **Versión del Sistema** | 1.0.0 |
| **Descripción** | Verificar que el usuario pueda consultar el detalle financiero de una empresa seleccionada. |
| **Datos Requeridos** | Empresa con información financiera registrada. |
| **Prerrequisitos** | Usuario autenticado. |
| **Postcondiciones** | Información financiera desplegada correctamente. |
| **Notas** | Verificar consistencia de datos. |

---

## Caso de Prueba: TC-006 - Consulta de estados financieros históricos

| Campo | Detalle |
| :--- | :--- |
| **Título** | Consulta de estados financieros históricos |
| **ID** | TC-006 |
| **Autor** | Equipo BBV Inversiones |
| **Fecha** |  |
| **Caso de Uso perteneciente** | DCU-02 Gestión de Empresas e Información Bursátil |
| **Módulo** | Gestión de Empresas |
| **Versión del Sistema** | 1.0.0 |
| **Descripción** | Verificar que el sistema permita consultar estados financieros correspondientes a diferentes gestiones. |
| **Datos Requeridos** | Estados financieros históricos almacenados. |
| **Prerrequisitos** | Usuario autenticado. |
| **Postcondiciones** | Historial financiero mostrado correctamente. |
| **Notas** | Validar periodos disponibles. |

---

## Caso de Prueba: TC-007 - Procesamiento correcto de archivos PDF financieros

| Campo | Detalle |
| :--- | :--- |
| **Título** | Procesamiento correcto de archivos PDF financieros |
| **ID** | TC-007 |
| **Autor** | Equipo BBV Inversiones |
| **Fecha** |  |
| **Caso de Uso perteneciente** | DCU-03 Procesamiento de Información Financiera |
| **Módulo** | Procesamiento Financiero |
| **Versión del Sistema** | 1.0.0 |
| **Descripción** | Verificar que el sistema procese correctamente archivos PDF financieros descargados de la BBV. |
| **Datos Requeridos** | PDF financiero válido. |
| **Prerrequisitos** | Servicio ETL disponible. |
| **Postcondiciones** | Información extraída y almacenada correctamente. |
| **Notas** | Validar estructura de los datos obtenidos. |

---

## Caso de Prueba: TC-008 - Ejecución exitosa del proceso ETL financiero

| Campo | Detalle |
| :--- | :--- |
| **Título** | Ejecución exitosa del proceso ETL financiero |
| **ID** | TC-008 |
| **Autor** | Equipo BBV Inversiones |
| **Fecha** |  |
| **Caso de Uso perteneciente** | DCU-03 Procesamiento de Información Financiera |
| **Módulo** | Procesamiento Financiero |
| **Versión del Sistema** | 1.0.0 |
| **Descripción** | Verificar la ejecución completa del flujo ETL financiero. |
| **Datos Requeridos** | Datos financieros fuente. |
| **Prerrequisitos** | Servicios ETL habilitados. |
| **Postcondiciones** | Datos transformados y cargados exitosamente. |
| **Notas** | Validar logs del proceso. |

---

## Caso de Prueba: TC-009 - Cálculo correcto de indicadores financieros

| Campo | Detalle |
| :--- | :--- |
| **Título** | Cálculo correcto de indicadores financieros |
| **ID** | TC-009 |
| **Autor** | Equipo BBV Inversiones |
| **Fecha** |  |
| **Caso de Uso perteneciente** | DCU-04 Análisis Financiero |
| **Módulo** | Análisis Financiero |
| **Versión del Sistema** | 1.0.0 |
| **Descripción** | Verificar el cálculo correcto de indicadores financieros utilizando información histórica. |
| **Datos Requeridos** | Estados financieros válidos. |
| **Prerrequisitos** | Datos financieros cargados. |
| **Postcondiciones** | Indicadores calculados correctamente. |
| **Notas** | Comparar resultados con cálculos esperados. |

---

## Caso de Prueba: TC-010 - Comparación de indicadores entre empresas del mismo sector

| Campo | Detalle |
| :--- | :--- |
| **Título** | Comparación de indicadores entre empresas del mismo sector |
| **ID** | TC-010 |
| **Autor** | Equipo BBV Inversiones |
| **Fecha** |  |
| **Caso de Uso perteneciente** | DCU-04 Análisis Financiero |
| **Módulo** | Análisis Financiero |
| **Versión del Sistema** | 1.0.0 |
| **Descripción** | Verificar que el sistema compare correctamente indicadores financieros entre empresas del mismo sector. |
| **Datos Requeridos** | Múltiples empresas con indicadores calculados. |
| **Prerrequisitos** | Información financiera disponible. |
| **Postcondiciones** | Comparación visualizada correctamente. |
| **Notas** | Validar ranking y métricas mostradas. |

---

## Caso de Prueba: TC-011 - Visualización correcta del dashboard financiero

| Campo | Detalle |
| :--- | :--- |
| **Título** | Visualización correcta del dashboard financiero |
| **ID** | TC-011 |
| **Autor** | Equipo BBV Inversiones |
| **Fecha** |  |
| **Caso de Uso perteneciente** | DCU-05 Visualización y Soporte a la Decisión |
| **Módulo** | Dashboard Financiero |
| **Versión del Sistema** | 1.0.0 |
| **Descripción** | Verificar que el dashboard financiero muestre correctamente indicadores y métricas relevantes. |
| **Datos Requeridos** | Datos financieros procesados. |
| **Prerrequisitos** | Usuario autenticado. |
| **Postcondiciones** | Dashboard cargado correctamente. |
| **Notas** | Verificar componentes gráficos. |

---

## Caso de Prueba: TC-012 - Visualización de gráficos históricos interactivos

| Campo | Detalle |
| :--- | :--- |
| **Título** | Visualización de gráficos históricos interactivos |
| **ID** | TC-012 |
| **Autor** | Equipo BBV Inversiones |
| **Fecha** |  |
| **Caso de Uso perteneciente** | DCU-05 Visualización y Soporte a la Decisión |
| **Módulo** | Dashboard Financiero |
| **Versión del Sistema** | 1.0.0 |
| **Descripción** | Verificar la interacción correcta con gráficos históricos. |
| **Datos Requeridos** | Series históricas cargadas. |
| **Prerrequisitos** | Dashboard disponible. |
| **Postcondiciones** | Gráficos responden correctamente a las interacciones del usuario. |
| **Notas** | Validar filtros y navegación temporal. |

---

## Caso de Prueba: TC-013 - Generación de predicción financiera utilizando modelo SVM

| Campo | Detalle |
| :--- | :--- |
| **Título** | Generación de predicción financiera utilizando modelo SVM |
| **ID** | TC-013 |
| **Autor** | Equipo BBV Inversiones |
| **Fecha** |  |
| **Caso de Uso perteneciente** | DCU-06 Inteligencia Financiera Predictiva |
| **Módulo** | Inteligencia Financiera Predictiva |
| **Versión del Sistema** | 1.0.0 |
| **Descripción** | Verificar la generación de predicciones financieras mediante el modelo SVM implementado. |
| **Datos Requeridos** | Datos históricos procesados. |
| **Prerrequisitos** | Modelo entrenado y disponible. |
| **Postcondiciones** | Predicción generada exitosamente. |
| **Notas** | Verificar coherencia de resultados. |

---

## Caso de Prueba: TC-014 - Visualización de recomendación de inversión generada por IA

| Campo | Detalle |
| :--- | :--- |
| **Título** | Visualización de recomendación de inversión generada por IA |
| **ID** | TC-014 |
| **Autor** | Equipo BBV Inversiones |
| **Fecha** |  |
| **Caso de Uso perteneciente** | DCU-06 Inteligencia Financiera Predictiva |
| **Módulo** | Inteligencia Financiera Predictiva |
| **Versión del Sistema** | 1.0.0 |
| **Descripción** | Verificar que el sistema muestre correctamente recomendaciones generadas por el modelo predictivo. |
| **Datos Requeridos** | Predicción financiera previamente generada. |
| **Prerrequisitos** | Predicción disponible. |
| **Postcondiciones** | Recomendación visualizada correctamente. |
| **Notas** | Validar consistencia entre predicción y recomendación. |

---

## Caso de Prueba: TC-015 - Consulta del historial de predicciones financieras

| Campo | Detalle |
| :--- | :--- |
| **Título** | Consulta del historial de predicciones financieras |
| **ID** | TC-015 |
| **Autor** | Equipo BBV Inversiones |
| **Fecha** |  |
| **Caso de Uso perteneciente** | DCU-06 Inteligencia Financiera Predictiva |
| **Módulo** | Inteligencia Financiera Predictiva |
| **Versión del Sistema** | 1.0.0 |
| **Descripción** | Verificar que el usuario pueda consultar el historial de predicciones generadas previamente. |
| **Datos Requeridos** | Predicciones almacenadas en la base de datos. |
| **Prerrequisitos** | Usuario autenticado y datos disponibles. |
| **Postcondiciones** | Historial mostrado correctamente. |
| **Notas** | Validar filtros por fecha y empresa. |

---

