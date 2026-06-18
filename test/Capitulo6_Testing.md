# Capítulo 6 — Testing

## 6.5 Casos de Prueba

### 6.5.1 Tabla Resumen de Casos de Prueba

| ID | Nombre del Caso de Prueba | Tipo de Prueba | Técnica Utilizada | Resultado Esperado | Estado |
|:---|:--------------------------|:---------------|:------------------|:-------------------|:-------|
| **TC-001** | Login con Google OAuth | Funcional (Integración) | Casos de Uso | Sesión iniciada correctamente con tokens de acceso | Aprobado |
| **TC-002** | Redirección según rol | Funcional (Sistema) | Tabla de Decisiones | Usuario redirigido al dashboard de su rol | Aprobado |
| **TC-003** | Restricción de acceso por permisos | Funcional (Seguridad) | Partición de Equivalencias, Tabla de Decisiones | Acceso denegado a módulos no autorizados | Aprobado |
| **TC-004** | Registrar usuario | Funcional (Integración) | Casos de Uso, Partición de Equivalencias | Usuario registrado correctamente | Aprobado |
| **TC-005** | Modificar usuario | Funcional (Integración) | Casos de Uso, Valores Límite | Datos del usuario actualizados | Aprobado |
| **TC-006** | Desactivar usuario | Funcional (Integración) | Transición de Estados | Usuario desactivado sin acceso al sistema | Aprobado |
| **TC-007** | Asignar rol | Funcional (Integración) | Tabla de Decisiones | Rol del usuario cambiado exitosamente | Aprobado |
| **TC-008** | Validación de permisos por rol | Funcional (Seguridad) | Tabla de Decisiones, Partición de Equivalencias | Permisos correctos según matriz de roles | Aprobado |
| **TC-009** | Registrar sector económico | Funcional (Integración) | Casos de Uso, Partición de Equivalencias | Sector económico creado | Aprobado |
| **TC-010** | Modificar y eliminar sector | Funcional (Integración) | Casos de Uso, Valores Límite | Sector modificado o eliminado | Aprobado |
| **TC-011** | Registrar empresa | Funcional (Integración) | Casos de Uso, Partición de Equivalencias | Empresa registrada en el sistema | Aprobado |
| **TC-012** | Consultar empresa | Funcional (Integración) | Partición de Equivalencias | Información de la empresa visible | Aprobado |
| **TC-013** | Modificar y eliminar empresa | Funcional (Integración) | Casos de Uso, Valores Límite | Empresa modificada o eliminada | Aprobado |
| **TC-014** | Descarga automática de estados financieros | Funcional (Sistema) | Casos de Uso, Transición de Estados | Estado financiero descargado desde la BBV | Aprobado |
| **TC-015** | Procesamiento de PDF financiero | Funcional (Integración) | Casos de Uso, Partición de Equivalencias | Datos financieros extraídos y validados | Aprobado |
| **TC-016** | Consulta histórica financiera | Funcional (Integración) | Partición de Equivalencias, Valores Límite | Historial financiero consultado correctamente | Aprobado |
| **TC-017** | Cálculo de indicadores financieros | Funcional (Integración) | Valores Límite, Partición de Equivalencias | Indicadores calculados correctamente | Aprobado |
| **TC-018** | Comparación entre empresas | Funcional (Aceptación) | Casos de Uso | Comparación visualizada correctamente | Aprobado |
| **TC-019** | Dashboard y visualización financiera | Funcional (Aceptación) | Casos de Uso | Dashboard cargado con datos financieros | Aprobado |
| **TC-020** | Generación y exportación de reportes | Funcional (Sistema) | Casos de Uso | Reporte generado y descargable | Pendiente de ejecución |
| **TC-021** | Predicción financiera mediante SVM | Funcional (Integración) | Casos de Uso, Cobertura de Decisión | Predicción generada por el modelo SVM | Pendiente de ejecución |
| **TC-022** | Asistente financiero conversacional | Funcional (Integración) | Casos de Uso, Cobertura de Decisión | Respuesta contextual a consulta financiera | Aprobado |
| **TC-023** | Auditoría de operaciones | Funcional (Seguridad) | Casos de Uso, Transición de Estados | Eventos registrados y consultables | Pendiente de ejecución |

### 6.5.2 Casos de Prueba Detallados

---

#### Caso de Prueba: TC-001 — Login con Google OAuth

| Campo | Detalle |
|:------|:--------|
| **Título** | Login con Google OAuth |
| **ID** | TC-001 |
| **Autor** | Equipo BBV Inversiones |
| **Fecha** | 2025 |
| **Caso de Uso perteneciente** | DCU-01 Autenticación y Control de Acceso |
| **Módulo** | Seguridad |
| **Versión del Sistema** | 1.0.0 |
| **Descripción** | Verificar que un usuario registrado pueda autenticarse correctamente utilizando Google OAuth. El sistema recibe el token de autenticación de Google, lo valida contra los servicios de Google y retorna los tokens de acceso que permiten al usuario navegar por el sistema. |
| **Datos Requeridos** | Cuenta Google válida registrada en el sistema. Cliente de Google OAuth configurado en el frontend. |
| **Prerrequisitos** | Servicio Google OAuth configurado y disponible. Backend del sistema en ejecución. Usuario registrado previamente. |
| **Postcondiciones** | Sesión iniciada correctamente. Tokens de acceso almacenados localmente. Usuario redirigido al dashboard correspondiente a su rol. |
| **Pasos de ejecución** | 1. Acceder a la página de inicio de sesión. 2. Seleccionar "Continuar con Google". 3. Iniciar sesión con una cuenta Google válida. 4. Verificar la redirección al dashboard. |
| **Resultado esperado** | El sistema permite el ingreso del usuario autenticado y lo redirige al módulo correspondiente según su rol. |
| **Estado** | Aprobado |
| **Notas** | Caso principal de autenticación. Si el token de Google es inválido o ha expirado, el sistema debe rechazar la autenticación. |

---

#### Caso de Prueba: TC-002 — Redirección según rol

| Campo | Detalle |
|:------|:--------|
| **Título** | Redirección según rol |
| **ID** | TC-002 |
| **Autor** | Equipo BBV Inversiones |
| **Fecha** | 2025 |
| **Caso de Uso perteneciente** | DCU-01 Autenticación y Control de Acceso |
| **Módulo** | Seguridad |
| **Versión del Sistema** | 1.0.0 |
| **Descripción** | Verificar que el sistema redireccione al dashboard correspondiente según el rol del usuario autenticado. Los roles disponibles son: Administrador, Analista, Inversionista y Auditor, cada uno con un dashboard y menú de navegación específico. |
| **Datos Requeridos** | Cuatro cuentas de usuario con roles distintos (Administrador, Analista, Inversionista, Auditor). |
| **Prerrequisitos** | Usuario autenticado exitosamente. Rol asignado correctamente en el sistema. |
| **Postcondiciones** | Usuario visualiza el dashboard asociado a su rol. El menú de navegación se filtra mostrando solo las opciones permitidas para ese rol. |
| **Pasos de ejecución** | 1. Iniciar sesión con un usuario Administrador. 2. Verificar redirección a `/admin`. 3. Repetir con usuario Analista (→ `/analyst`). 4. Repetir con usuario Inversionista (→ `/investor`). 5. Repetir con usuario Auditor (→ `/auditor`). |
| **Resultado esperado** | Cada usuario es redirigido al dashboard correspondiente a su rol y visualiza únicamente las opciones de navegación permitidas. |
| **Estado** | Aprobado |
| **Notas** | El rol del usuario se determina a partir del grupo asignado en el sistema de gestión de usuarios. |

---

#### Caso de Prueba: TC-003 — Restricción de acceso por permisos

| Campo | Detalle |
|:------|:--------|
| **Título** | Restricción de acceso por permisos |
| **ID** | TC-003 |
| **Autor** | Equipo BBV Inversiones |
| **Fecha** | 2025 |
| **Caso de Uso perteneciente** | DCU-01 Autenticación y Control de Acceso |
| **Módulo** | Seguridad |
| **Versión del Sistema** | 1.0.0 |
| **Descripción** | Verificar que un usuario no pueda acceder a rutas o funcionalidades que no correspondan a su rol. El sistema implementa un sistema de permisos que valida cada solicitud contra el rol del usuario autenticado, tanto en el frontend como en el backend. |
| **Datos Requeridos** | Usuario autenticado con rol limitado (ej. Inversionista intentando acceder a funcionalidades de administración). |
| **Prerrequisitos** | Usuario autenticado. |
| **Postcondiciones** | El sistema deniega el acceso y redirige al usuario a una página de no autorizado. |
| **Pasos de ejecución** | 1. Iniciar sesión como Inversionista. 2. Intentar acceder a la ruta de administración de usuarios. 3. Verificar que el sistema deniegue el acceso. 4. Intentar acceder mediante solicitud directa. 5. Verificar que el backend rechace la solicitud. |
| **Resultado esperado** | El sistema deniega el acceso a funcionalidades no autorizadas y muestra un mensaje de permisos insuficientes. |
| **Estado** | Aprobado |
| **Notas** | Validar tanto la protección en el frontend (ocultación de rutas) como en el backend (validación de permisos en cada solicitud). |

---

#### Caso de Prueba: TC-004 — Registrar usuario

| Campo | Detalle |
|:------|:--------|
| **Título** | Registrar usuario |
| **ID** | TC-004 |
| **Autor** | Equipo BBV Inversiones |
| **Fecha** | 2025 |
| **Caso de Uso perteneciente** | DCU-02 Gestión de Usuarios |
| **Módulo** | Gestión de Usuarios |
| **Versión del Sistema** | 1.0.0 |
| **Descripción** | Verificar que un usuario con rol Administrador pueda registrar un nuevo usuario en el sistema proporcionando los datos obligatorios: correo electrónico, nombre completo, documento de identidad y rol a asignar. |
| **Datos Requeridos** | Correo electrónico (válido y único), nombre completo, documento de identidad, número de teléfono, rol a asignar. |
| **Prerrequisitos** | Usuario Administrador autenticado. |
| **Postcondiciones** | Usuario creado en la base de datos. El usuario registrado puede iniciar sesión con Google OAuth. |
| **Pasos de ejecución** | 1. Iniciar sesión como Administrador. 2. Enviar solicitud de registro con datos del nuevo usuario. 3. Verificar que el sistema confirme la creación. 4. Intentar registrar el mismo correo electrónico nuevamente. 5. Verificar que el sistema rechace el duplicado. |
| **Resultado esperado** | El sistema registra al usuario validando los datos obligatorios y rechaza registros duplicados. |
| **Estado** | Aprobado |
| **Notas** | El sistema valida que el correo electrónico sea único. El registro también puede realizarse mediante el panel de administración. |

---

#### Caso de Prueba: TC-005 — Modificar usuario

| Campo | Detalle |
|:------|:--------|
| **Título** | Modificar usuario |
| **ID** | TC-005 |
| **Autor** | Equipo BBV Inversiones |
| **Fecha** | 2025 |
| **Caso de Uso perteneciente** | DCU-02 Gestión de Usuarios |
| **Módulo** | Gestión de Usuarios |
| **Versión del Sistema** | 1.0.0 |
| **Descripción** | Verificar que un Administrador pueda modificar los datos de un usuario existente, y que cada usuario pueda actualizar su propio perfil personal (nombre, documento de identidad, teléfono, dirección). |
| **Datos Requeridos** | Identificador del usuario existente. Campos a modificar: nombre, correo electrónico, teléfono, documento de identidad. |
| **Prerrequisitos** | Para modificar otros usuarios: rol Administrador. Para modificar perfil propio: usuario autenticado. |
| **Postcondiciones** | Datos del usuario actualizados en la base de datos. Perfil actualizado visible en el sistema. |
| **Pasos de ejecución** | 1. Iniciar sesión como Administrador. 2. Seleccionar un usuario existente. 3. Modificar sus datos personales. 4. Verificar que los cambios se guarden. 5. Iniciar sesión como el usuario modificado. 6. Verificar que los datos actualizados se reflejen en su perfil. |
| **Resultado esperado** | El sistema actualiza los datos del usuario y permite la modificación del perfil propio. |
| **Estado** | Aprobado |
| **Notas** | La actualización parcial (modificar solo algunos campos) debe funcionar correctamente. |

---

#### Caso de Prueba: TC-006 — Desactivar usuario

| Campo | Detalle |
|:------|:--------|
| **Título** | Desactivar usuario |
| **ID** | TC-006 |
| **Autor** | Equipo BBV Inversiones |
| **Fecha** | 2025 |
| **Caso de Uso perteneciente** | DCU-02 Gestión de Usuarios |
| **Módulo** | Gestión de Usuarios |
| **Versión del Sistema** | 1.0.0 |
| **Descripción** | Verificar que un Administrador pueda desactivar a un usuario del sistema. El usuario desactivado no debe poder iniciar sesión ni acceder a ninguna funcionalidad del sistema. |
| **Datos Requeridos** | Identificador del usuario a desactivar. |
| **Prerrequisitos** | Usuario Administrador autenticado. Usuario objetivo existente y activo. |
| **Postcondiciones** | Usuario marcado como inactivo en el sistema. El usuario desactivado no puede autenticarse. |
| **Pasos de ejecución** | 1. Iniciar sesión como Administrador. 2. Seleccionar un usuario activo. 3. Ejecutar la desactivación del usuario. 4. Verificar que el sistema confirme la desactivación. 5. Intentar iniciar sesión con el usuario desactivado. 6. Verificar que el sistema rechace el acceso. |
| **Resultado esperado** | El sistema desactiva al usuario y este no puede acceder al sistema. |
| **Estado** | Aprobado |
| **Notas** | Verificar también la posibilidad de reactivar un usuario previamente desactivado. |

---

#### Caso de Prueba: TC-007 — Asignar rol

| Campo | Detalle |
|:------|:--------|
| **Título** | Asignar rol |
| **ID** | TC-007 |
| **Autor** | Equipo BBV Inversiones |
| **Fecha** | 2025 |
| **Caso de Uso perteneciente** | DCU-02 Gestión de Usuarios |
| **Módulo** | Gestión de Usuarios |
| **Versión del Sistema** | 1.0.0 |
| **Descripción** | Verificar que un Administrador pueda asignar o cambiar el rol de un usuario. Los roles disponibles son: Administrador, Analista, Inversionista y Auditor. El cambio de rol debe actualizar los permisos del usuario inmediatamente. |
| **Datos Requeridos** | Identificador del usuario objetivo. Nombre del nuevo rol a asignar. |
| **Prerrequisitos** | Usuario Administrador autenticado. Usuario objetivo existente. |
| **Postcondiciones** | Usuario cambia de rol en el sistema. Al cerrar e iniciar sesión nuevamente, el usuario accede al dashboard del nuevo rol. |
| **Pasos de ejecución** | 1. Iniciar sesión como Administrador. 2. Seleccionar un usuario existente. 3. Cambiar su rol a Analista. 4. Verificar la confirmación del sistema. 5. Iniciar sesión como el usuario modificado. 6. Verificar que el dashboard corresponda al nuevo rol. |
| **Resultado esperado** | El sistema asigna el nuevo rol al usuario y los permisos se actualizan correctamente. |
| **Estado** | Aprobado |
| **Notas** | Probar el cambio entre los 4 roles disponibles y verificar que los permisos se actualicen correctamente en cada caso. |

---

#### Caso de Prueba: TC-008 — Validación de permisos por rol

| Campo | Detalle |
|:------|:--------|
| **Título** | Validación de permisos por rol |
| **ID** | TC-008 |
| **Autor** | Equipo BBV Inversiones |
| **Fecha** | 2025 |
| **Caso de Uso perteneciente** | DCU-02 Gestión de Usuarios |
| **Módulo** | Seguridad |
| **Versión del Sistema** | 1.0.0 |
| **Descripción** | Verificar que cada endpoint del sistema aplique correctamente los permisos según el rol del usuario. Se debe validar que los usuarios solo puedan acceder a las funcionalidades permitidas según la matriz de permisos definida para cada rol. |
| **Datos Requeridos** | Usuarios autenticados con cada uno de los 4 roles (Administrador, Analista, Inversionista, Auditor). |
| **Prerrequisitos** | Usuarios con roles creados y permisos configurados. |
| **Postcondiciones** | Cada usuario accede únicamente a los módulos permitidos. El sistema retorna error de permisos para accesos no autorizados. |
| **Pasos de ejecución** | 1. Para cada rol, iniciar sesión. 2. Intentar acceder a cada módulo del sistema. 3. Verificar que el acceso sea concedido o denegado según la matriz de permisos. 4. Registrar los resultados. |
| **Resultado esperado** | El sistema aplica correctamente la matriz de permisos: Administrador accede a todo; Analista a empresas, reportes e indicadores; Inversionista a consultas, simulaciones y chat; Auditor a consultas y bitácora. |
| **Estado** | Aprobado |
| **Notas** | Los permisos se definen mediante un sistema de clases que controlan el acceso a cada funcionalidad del backend. |

---

#### Caso de Prueba: TC-009 — Registrar sector económico

| Campo | Detalle |
|:------|:--------|
| **Título** | Registrar sector económico |
| **ID** | TC-009 |
| **Autor** | Equipo BBV Inversiones |
| **Fecha** | 2025 |
| **Caso de Uso perteneciente** | DCU-03 Gestión de Sectores |
| **Módulo** | Gestión de Sectores |
| **Versión del Sistema** | 1.0.0 |
| **Descripción** | Verificar que un usuario autenticado pueda registrar un nuevo sector económico en el sistema y consultar el listado de sectores disponibles. |
| **Datos Requeridos** | Nombre del sector económico (único en el sistema). Descripción opcional del sector. |
| **Prerrequisitos** | Usuario autenticado. |
| **Postcondiciones** | Sector creado y visible en el listado de sectores del sistema. |
| **Pasos de ejecución** | 1. Iniciar sesión en el sistema. 2. Enviar solicitud de registro de un nuevo sector. 3. Verificar la confirmación del sistema. 4. Consultar el listado de sectores. 5. Verificar que el nuevo sector aparezca en el listado. 6. Intentar registrar un sector con nombre duplicado. 7. Verificar que el sistema rechace el duplicado. |
| **Resultado esperado** | El sistema registra el sector económico y lo muestra en el listado. Rechaza nombres duplicados. |
| **Estado** | Aprobado |
| **Notas** | Ejemplos de sectores: Financiero, Industrial, Agropecuario, Servicios, Energético. |

---

#### Caso de Prueba: TC-010 — Modificar y eliminar sector

| Campo | Detalle |
|:------|:--------|
| **Título** | Modificar y eliminar sector |
| **ID** | TC-010 |
| **Autor** | Equipo BBV Inversiones |
| **Fecha** | 2025 |
| **Caso de Uso perteneciente** | DCU-03 Gestión de Sectores |
| **Módulo** | Gestión de Sectores |
| **Versión del Sistema** | 1.0.0 |
| **Descripción** | Verificar la actualización de los datos de un sector económico existente y su eliminación. La eliminación debe respetar la integridad de los datos si existen empresas asociadas al sector. |
| **Datos Requeridos** | Identificador del sector existente. Datos actualizados (nombre, descripción). |
| **Prerrequisitos** | Usuario autenticado. Sector económico existente. |
| **Postcondiciones** | Sector actualizado o eliminado. Si tiene empresas asociadas, la eliminación debe ser rechazada. |
| **Pasos de ejecución** | 1. Iniciar sesión. 2. Seleccionar un sector existente. 3. Modificar su nombre. 4. Verificar la actualización. 5. Intentar eliminar un sector sin empresas asociadas. 6. Verificar la eliminación. 7. Intentar eliminar un sector con empresas asociadas. 8. Verificar que el sistema rechace la eliminación. |
| **Resultado esperado** | El sistema permite modificar sectores y eliminarlos solo si no tienen empresas asociadas. |
| **Estado** | Aprobado |
| **Notas** | Validar que el nombre modificado no entre en conflicto con otro sector existente. |

---

#### Caso de Prueba: TC-011 — Registrar empresa

| Campo | Detalle |
|:------|:--------|
| **Título** | Registrar empresa |
| **ID** | TC-011 |
| **Autor** | Equipo BBV Inversiones |
| **Fecha** | 2025 |
| **Caso de Uso perteneciente** | DCU-04 Gestión de Empresas |
| **Módulo** | Gestión de Empresas |
| **Versión del Sistema** | 1.0.0 |
| **Descripción** | Verificar que un usuario autorizado pueda registrar una nueva empresa en el sistema proporcionando el nombre, código BBV (identificador único en la Bolsa Boliviana de Valores), sigla y sector económico al que pertenece. |
| **Datos Requeridos** | Nombre de la empresa, código BBV (único), sigla, identificador del sector económico. |
| **Prerrequisitos** | Usuario autenticado con permisos de gestión de datos. Sector económico existente. |
| **Postcondiciones** | Empresa creada en el sistema. Visible en el listado de empresas del frontend. |
| **Pasos de ejecución** | 1. Iniciar sesión con usuario autorizado. 2. Enviar solicitud de registro con datos de la empresa. 3. Verificar la confirmación del sistema. 4. Consultar el listado de empresas. 5. Verificar que la nueva empresa aparezca. 6. Intentar registrar con código BBV duplicado. 7. Verificar el rechazo. |
| **Resultado esperado** | El sistema registra la empresa validando que el código BBV sea único. |
| **Estado** | Aprobado |
| **Notas** | Ejemplos de empresas: Banco Nacional de Bolivia (BNB), Banco Mercantil Santa Cruz (BME), SOBOCE, PIL Andina. |

---

#### Caso de Prueba: TC-012 — Consultar empresa

| Campo | Detalle |
|:------|:--------|
| **Título** | Consultar empresa |
| **ID** | TC-012 |
| **Autor** | Equipo BBV Inversiones |
| **Fecha** | 2025 |
| **Caso de Uso perteneciente** | DCU-04 Gestión de Empresas |
| **Módulo** | Gestión de Empresas |
| **Versión del Sistema** | 1.0.0 |
| **Descripción** | Verificar que el sistema permita consultar el listado de empresas registradas con filtros por sector, búsqueda por nombre o código, y paginación. También verificar la consulta del detalle completo de una empresa específica incluyendo su información general y reportes financieros asociados. |
| **Datos Requeridos** | Empresas previamente cargadas en el sistema. |
| **Prerrequisitos** | Usuario autenticado. |
| **Postcondiciones** | Listado de empresas visible con paginación. Detalle de empresa con información general y reportes financieros. |
| **Pasos de ejecución** | 1. Iniciar sesión. 2. Navegar al listado de empresas. 3. Aplicar filtros por sector. 4. Verificar los resultados filtrados. 5. Buscar por nombre parcial. 6. Verificar la búsqueda. 7. Seleccionar una empresa. 8. Verificar el detalle. |
| **Resultado esperado** | El sistema muestra el listado filtrado y paginado de empresas, y el detalle completo de cada una. |
| **Estado** | Aprobado |
| **Notas** | Verificar que la consulta de una empresa inexistente muestre un mensaje adecuado. |

---

#### Caso de Prueba: TC-013 — Modificar y eliminar empresa

| Campo | Detalle |
|:------|:--------|
| **Título** | Modificar y eliminar empresa |
| **ID** | TC-013 |
| **Autor** | Equipo BBV Inversiones |
| **Fecha** | 2025 |
| **Caso de Uso perteneciente** | DCU-04 Gestión de Empresas |
| **Módulo** | Gestión de Empresas |
| **Versión del Sistema** | 1.0.0 |
| **Descripción** | Verificar la actualización de los datos de una empresa existente y su eliminación. La eliminación debe respetar la integridad de los datos si existen reportes financieros asociados a la empresa. |
| **Datos Requeridos** | Identificador de la empresa existente. Campos a modificar (nombre, código BBV, sector). |
| **Prerrequisitos** | Usuario autenticado con permisos de gestión de datos. Empresa existente. |
| **Postcondiciones** | Empresa actualizada o eliminada. Si tiene reportes financieros asociados, la eliminación debe ser rechazada. |
| **Pasos de ejecución** | 1. Iniciar sesión como usuario autorizado. 2. Seleccionar una empresa existente. 3. Modificar su nombre o sector. 4. Verificar la actualización. 5. Intentar eliminar una empresa sin reportes. 6. Verificar la eliminación. 7. Intentar eliminar una empresa con reportes. 8. Verificar el rechazo. |
| **Resultado esperado** | El sistema permite modificar empresas y eliminarlas solo si no tienen reportes financieros asociados. |
| **Estado** | Aprobado |
| **Notas** | Validar que el código BBV modificado no entre en conflicto con otra empresa. |

---

#### Caso de Prueba: TC-014 — Descarga automática de estados financieros

| Campo | Detalle |
|:------|:--------|
| **Título** | Descarga automática de estados financieros |
| **ID** | TC-014 |
| **Autor** | Equipo BBV Inversiones |
| **Fecha** | 2025 |
| **Caso de Uso perteneciente** | DCU-05 Procesamiento Financiero |
| **Módulo** | Procesamiento Financiero |
| **Versión del Sistema** | 1.0.0 |
| **Descripción** | Verificar que el sistema pueda descargar automáticamente los estados financieros de una empresa desde la Bolsa Boliviana de Valores (BBV) para una gestión y trimestre específicos, utilizando el código BBV registrado de la empresa. |
| **Datos Requeridos** | Identificador de empresa con código BBV válido. Gestión (año) y trimestre (1 al 4) a descargar. |
| **Prerrequisitos** | Usuario autenticado con permisos de gestión. Empresa con código BBV registrado. Conexión a internet disponible. |
| **Postcondiciones** | Estado financiero descargado y almacenado en el sistema. Reporte creado con estado de procesamiento inicial. |
| **Pasos de ejecución** | 1. Iniciar sesión como usuario autorizado. 2. Seleccionar una empresa con código BBV. 3. Solicitar la descarga del estado financiero para una gestión y trimestre específicos. 4. Verificar que el sistema confirme la descarga. 5. Verificar que el reporte se haya creado en el sistema. |
| **Resultado esperado** | El sistema descarga el estado financiero desde la BBV y lo almacena para su procesamiento posterior. |
| **Estado** | Aprobado |
| **Notas** | Si el PDF no está disponible en la BBV para el período solicitado, el reporte queda registrado con estado pendiente sin generar errores. |

---

#### Caso de Prueba: TC-015 — Procesamiento de PDF financiero

| Campo | Detalle |
|:------|:--------|
| **Título** | Procesamiento de PDF financiero |
| **ID** | TC-015 |
| **Autor** | Equipo BBV Inversiones |
| **Fecha** | 2025 |
| **Caso de Uso perteneciente** | DCU-05 Procesamiento Financiero |
| **Módulo** | Procesamiento Financiero |
| **Versión del Sistema** | 1.0.0 |
| **Descripción** | Verificar el procesamiento completo del archivo PDF del estado financiero. El sistema extrae los datos financieros del PDF, valida la integridad contable (Activo = Pasivo + Patrimonio), limpia y transforma los datos, y finalmente calcula los indicadores financieros correspondientes. |
| **Datos Requeridos** | Archivo PDF válido del estado financiero de una empresa, previamente descargado de la BBV. |
| **Prerrequisitos** | Reporte financiero descargado previamente. Servicios de procesamiento habilitados. |
| **Postcondiciones** | Datos financieros extraídos, validados y almacenados. Indicadores financieros calculados. |
| **Pasos de ejecución** | 1. Iniciar sesión como usuario autorizado. 2. Seleccionar una empresa con reporte descargado. 3. Ejecutar el proceso de extracción de datos del PDF. 4. Verificar que el sistema confirme el procesamiento exitoso. 5. Consultar los datos financieros extraídos. 6. Verificar que la ecuación contable se cumpla. |
| **Resultado esperado** | El sistema extrae los datos financieros del PDF, valida la ecuación contable y calcula los indicadores financieros. |
| **Estado** | Aprobado |
| **Notas** | Si la ecuación contable no se cumple, el reporte debe marcarse con estado de error para su revisión manual. |

---

#### Caso de Prueba: TC-016 — Consulta histórica financiera

| Campo | Detalle |
|:------|:--------|
| **Título** | Consulta histórica financiera |
| **ID** | TC-016 |
| **Autor** | Equipo BBV Inversiones |
| **Fecha** | 2025 |
| **Caso de Uso perteneciente** | DCU-06 Análisis Financiero |
| **Módulo** | Gestión de Reportes |
| **Versión del Sistema** | 1.0.0 |
| **Descripción** | Verificar que el sistema permita consultar el historial de estados financieros de una empresa con filtros por gestión, trimestre y estado de procesamiento. Los datos históricos incluyen activo, pasivo, patrimonio, ingresos y utilidad de cada período. |
| **Datos Requeridos** | Reportes financieros almacenados para al menos dos gestiones distintas de una misma empresa. |
| **Prerrequisitos** | Usuario autenticado. Reportes financieros cargados y procesados para la empresa. |
| **Postcondiciones** | Historial financiero visible con datos de los períodos solicitados, ordenados cronológicamente. |
| **Pasos de ejecución** | 1. Iniciar sesión. 2. Seleccionar una empresa. 3. Consultar el historial de reportes financieros. 4. Aplicar filtros por gestión y trimestre. 5. Verificar que los datos correspondan a los períodos seleccionados. 6. Verificar la paginación si existen muchos registros. |
| **Resultado esperado** | El sistema muestra el historial financiero completo con filtros funcionales y datos correctos. |
| **Estado** | Aprobado |
| **Notas** | Verificar que el sistema mantenga la integridad de los datos históricos a través del tiempo. |

---

#### Caso de Prueba: TC-017 — Cálculo de indicadores financieros

| Campo | Detalle |
|:------|:--------|
| **Título** | Cálculo de indicadores financieros |
| **ID** | TC-017 |
| **Autor** | Equipo BBV Inversiones |
| **Fecha** | 2025 |
| **Caso de Uso perteneciente** | DCU-06 Análisis Financiero |
| **Módulo** | Análisis Financiero |
| **Versión del Sistema** | 1.0.0 |
| **Descripción** | Verificar el cálculo correcto de los indicadores financieros a partir de los datos extraídos de los estados financieros. Los indicadores calculados son: Liquidez Corriente, Capital de Trabajo, Endeudamiento, Patrimonio, ROA, ROE y Margen Neto. Adicionalmente se calcula un puntaje de salud financiera de 0 a 100 basado en reglas de negocio. |
| **Datos Requeridos** | Reportes financieros procesados con datos válidos (activo corriente, pasivo corriente, activo total, pasivo total, patrimonio, utilidad neta, ingresos). |
| **Prerrequisitos** | Datos financieros cargados y validados. |
| **Postcondiciones** | Indicadores financieros calculados y almacenados. Puntaje de salud financiera registrado. |
| **Pasos de ejecución** | 1. Iniciar sesión. 2. Seleccionar una empresa con datos financieros procesados. 3. Solicitar el cálculo de indicadores. 4. Verificar que los indicadores se hayan calculado. 5. Comparar los resultados con cálculos manuales esperados. 6. Verificar el puntaje de salud financiera. |
| **Resultado esperado** | El sistema calcula correctamente todos los indicadores financieros utilizando las fórmulas contables estándar. |
| **Estado** | Aprobado |
| **Notas** | Fórmulas: Liquidez = AC/PC, Endeudamiento = Pasivo/Activo, ROE = Utilidad/Patrimonio, ROA = Utilidad/Activo, Margen Neto = Utilidad/Ingresos. |

---

#### Caso de Prueba: TC-018 — Comparación entre empresas

| Campo | Detalle |
|:------|:--------|
| **Título** | Comparación entre empresas |
| **ID** | TC-018 |
| **Autor** | Equipo BBV Inversiones |
| **Fecha** | 2025 |
| **Caso de Uso perteneciente** | DCU-06 Análisis Financiero |
| **Módulo** | Análisis Financiero |
| **Versión del Sistema** | 1.0.0 |
| **Descripción** | Verificar que el sistema permita comparar los indicadores financieros de múltiples empresas pertenecientes al mismo sector económico, mostrando gráficos comparativos y un ranking ordenado por puntaje de salud financiera. |
| **Datos Requeridos** | Múltiples empresas (mínimo 3) con indicadores financieros calculados, del mismo sector económico. |
| **Prerrequisitos** | Indicadores financieros calculados para todas las empresas del sector. |
| **Postcondiciones** | Gráficos comparativos visibles con indicadores lado a lado. Ranking de empresas por puntaje mostrado. |
| **Pasos de ejecución** | 1. Iniciar sesión. 2. Navegar a la sección de comparación. 3. Seleccionar un sector económico. 4. Seleccionar múltiples empresas del mismo sector. 5. Verificar los gráficos comparativos. 6. Verificar el ranking por puntaje. |
| **Resultado esperado** | El sistema muestra la comparación de indicadores entre empresas del mismo sector con gráficos y ranking. |
| **Estado** | Aprobado |
| **Notas** | La comparación se realiza dentro del mismo sector económico para asegurar relevancia en el análisis. |

---

#### Caso de Prueba: TC-019 — Dashboard y visualización financiera

| Campo | Detalle |
|:------|:--------|
| **Título** | Dashboard y visualización financiera |
| **ID** | TC-019 |
| **Autor** | Equipo BBV Inversiones |
| **Fecha** | 2025 |
| **Caso de Uso perteneciente** | DCU-07 Dashboard Financiero |
| **Módulo** | Dashboard Financiero |
| **Versión del Sistema** | 1.0.0 |
| **Descripción** | Verificar que los dashboards financieros muestren correctamente la información según el rol del usuario. El Administrador visualiza indicadores de gestión, gráficos de actividad, distribución de estados y tablas de datos. El Analista visualiza métricas financieras, acciones rápidas y gráficos de evolución. El Inversionista visualiza una lista de seguimiento, indicadores resumidos y empresas recomendadas. |
| **Datos Requeridos** | Datos financieros procesados (empresas, reportes, indicadores). |
| **Prerrequisitos** | Usuario autenticado según el rol correspondiente. Empresas con reportes e indicadores cargados. |
| **Postcondiciones** | Dashboard cargado con datos reales del sistema. Todos los componentes gráficos renderizados correctamente. |
| **Pasos de ejecución** | 1. Iniciar sesión como Administrador. 2. Verificar KPIs, gráficos y tablas del dashboard. 3. Iniciar sesión como Analista. 4. Verificar métricas financieras y acciones rápidas. 5. Iniciar sesión como Inversionista. 6. Verificar lista de seguimiento y empresas recomendadas. |
| **Resultado esperado** | Cada rol visualiza su dashboard con datos reales del sistema y componentes gráficos funcionales. |
| **Estado** | Aprobado |
| **Notas** | Cada rol tiene una vista adaptada a sus necesidades: administración, análisis o inversión. |

---

#### Caso de Prueba: TC-020 — Generación y exportación de reportes

| Campo | Detalle |
|:------|:--------|
| **Título** | Generación y exportación de reportes |
| **ID** | TC-020 |
| **Autor** | Equipo BBV Inversiones |
| **Fecha** | 2025 |
| **Caso de Uso perteneciente** | DCU-08 Generación de Reportes |
| **Módulo** | Reportes |
| **Versión del Sistema** | 1.0.0 |
| **Descripción** | Verificar que el sistema permita generar y exportar reportes financieros en formatos PDF y CSV. El usuario podrá seleccionar una empresa y un período y generar un reporte que incluya los datos financieros, indicadores calculados y puntaje de salud financiera. |
| **Datos Requeridos** | Empresa con reportes financieros procesados e indicadores calculados. Período a reportar. |
| **Prerrequisitos** | Usuario autenticado con permisos de visualización. Reportes e indicadores disponibles. |
| **Postcondiciones** | Archivo PDF o CSV generado y descargable. Reporte almacenado para consulta posterior. |
| **Pasos de ejecución** | 1. Iniciar sesión. 2. Seleccionar una empresa. 3. Seleccionar el período a reportar. 4. Seleccionar el formato de exportación. 5. Generar el reporte. 6. Verificar la descarga del archivo. 7. Verificar que los datos en el reporte sean correctos. |
| **Resultado esperado** | El sistema genera un reporte financiero en el formato seleccionado con los datos correctos de la empresa y período indicados. |
| **Estado** | Pendiente de ejecución |
| **Notas** | Funcionalidad en desarrollo. Se espera que la implementación permita generar reportes en PDF (formato documento) y CSV (formato datos abiertos). |

---

#### Caso de Prueba: TC-021 — Predicción financiera mediante SVM

| Campo | Detalle |
|:------|:--------|
| **Título** | Predicción financiera mediante SVM |
| **ID** | TC-021 |
| **Autor** | Equipo BBV Inversiones |
| **Fecha** | 2025 |
| **Caso de Uso perteneciente** | DCU-09 Inteligencia Artificial |
| **Módulo** | Inteligencia Artificial |
| **Versión del Sistema** | 1.0.0 |
| **Descripción** | Verificar que el sistema genere predicciones financieras utilizando un modelo de Máquinas de Soporte Vectorial (SVM). El modelo recibe como entrada los indicadores financieros históricos de una empresa y genera una clasificación sobre su salud financiera futura. |
| **Datos Requeridos** | Identificador de empresa con indicadores financieros históricos calculados. |
| **Prerrequisitos** | Modelo SVM entrenado y disponible. Indicadores financieros históricos cargados para la empresa. |
| **Postcondiciones** | Predicción generada con clasificación y nivel de confianza. Resultado almacenado y consultable. |
| **Pasos de ejecución** | 1. Iniciar sesión. 2. Seleccionar una empresa con indicadores históricos. 3. Solicitar la predicción financiera. 4. Verificar que el sistema genere la clasificación. 5. Consultar el nivel de confianza de la predicción. |
| **Resultado esperado** | El sistema genera una predicción financiera utilizando el modelo SVM con indicadores históricos como entrada. |
| **Estado** | Pendiente de ejecución |
| **Notas** | Funcionalidad en desarrollo. El modelo SVM se entrenará con datos históricos de empresas de la BBV. Las características de entrada serán los indicadores financieros calculados por el sistema. |

---

#### Caso de Prueba: TC-022 — Asistente financiero conversacional

| Campo | Detalle |
|:------|:--------|
| **Título** | Asistente financiero conversacional |
| **ID** | TC-022 |
| **Autor** | Equipo BBV Inversiones |
| **Fecha** | 2025 |
| **Caso de Uso perteneciente** | DCU-09 Inteligencia Artificial |
| **Módulo** | Inteligencia Artificial |
| **Versión del Sistema** | 1.0.0 |
| **Descripción** | Verificar que el asistente financiero conversacional responda adecuadamente a consultas de los usuarios sobre conceptos financieros, indicadores económicos y terminología de la Bolsa Boliviana de Valores. El asistente utiliza un modelo de lenguaje avanzado especializado en el dominio financiero. |
| **Datos Requeridos** | Mensaje de texto con consulta financiera del usuario (ej. "¿Qué es el ROE?", "¿Cómo se calcula la liquidez de una empresa?"). |
| **Prerrequisitos** | Usuario autenticado. Servicio de asistente conversacional configurado. |
| **Postcondiciones** | Respuesta generada por el asistente con información financiera contextualizada. Conversación almacenada para referencia posterior. |
| **Pasos de ejecución** | 1. Iniciar sesión. 2. Navegar al asistente conversacional. 3. Enviar una consulta sobre un concepto financiero. 4. Verificar que el asistente responda con información relevante. 5. Enviar una consulta de seguimiento. 6. Verificar que el asistente mantenga el contexto de la conversación. |
| **Resultado esperado** | El asistente responde con información financiera precisa y contextualizada a la consulta del usuario. |
| **Estado** | Aprobado |
| **Notas** | El asistente está configurado con un perfil de conocimiento financiero especializado en la Bolsa Boliviana de Valores. No tiene acceso directo a la base de datos del sistema. |

---

#### Caso de Prueba: TC-023 — Auditoría de operaciones

| Campo | Detalle |
|:------|:--------|
| **Título** | Auditoría de operaciones |
| **ID** | TC-023 |
| **Autor** | Equipo BBV Inversiones |
| **Fecha** | 2025 |
| **Caso de Uso perteneciente** | DCU-10 Auditoría |
| **Módulo** | Seguridad |
| **Versión del Sistema** | 1.0.0 |
| **Descripción** | Verificar que el sistema registre y permita consultar las operaciones realizadas por los usuarios. La bitácora de auditoría debe almacenar: usuario que realizó la acción, tipo de acción ejecutada, módulo afectado, descripción detallada, dirección IP y fecha del evento. Los usuarios con rol Auditor o Administrador deben poder consultar estos registros. |
| **Datos Requeridos** | Usuarios autenticados realizando operaciones en el sistema (inicio de sesión, creación de registros, ejecución de procesos). |
| **Prerrequisitos** | Usuario autenticado con permisos de auditoría (Administrador o Auditor). |
| **Postcondiciones** | Cada operación relevante registrada en la bitácora con todos los datos requeridos. El historial es consultable con filtros por fecha, acción y usuario. |
| **Pasos de ejecución** | 1. Iniciar sesión como Administrador. 2. Realizar varias operaciones (crear usuario, modificar empresa, ejecutar pipeline). 3. Iniciar sesión como Auditor. 4. Navegar al módulo de auditoría. 5. Consultar el historial de operaciones. 6. Aplicar filtros por fecha y tipo de acción. 7. Verificar que las operaciones realizadas estén registradas. |
| **Resultado esperado** | El sistema registra todas las operaciones relevantes y permite su consulta con filtros. |
| **Estado** | Pendiente de ejecución |
| **Notas** | Funcionalidad en desarrollo. Actualmente el sistema registra el historial de procesamiento de reportes financieros. Se encuentra en desarrollo la exposición de la bitácora completa del sistema para consulta de auditores. |

---

## 6.6 Matriz de Trazabilidad

### 6.6.1 Requisitos Funcionales

| ID | Nombre del Requisito Funcional | Módulo | Estado |
|:---|:-------------------------------|:-------|:-------|
| **RF-01** | Gestión de usuarios | Seguridad | Implementado |
| **RF-02** | Gestión de roles y permisos | Seguridad | Implementado |
| **RF-03** | Gestión de sectores económicos | Gestión de Sectores | Implementado |
| **RF-04** | Gestión de empresas | Gestión de Empresas | Implementado |
| **RF-05** | Descarga automática de estados financieros | Procesamiento Financiero | Implementado |
| **RF-06** | Procesamiento de documentos financieros | Procesamiento Financiero | Implementado |
| **RF-07** | Transformación y limpieza de datos | Procesamiento Financiero | Implementado |
| **RF-08** | Almacenamiento histórico de información financiera | Gestión de Reportes | Implementado |
| **RF-09** | Cálculo de indicadores financieros | Análisis Financiero | Implementado |
| **RF-10** | Visualización de información financiera | Dashboard Financiero | Implementado |
| **RF-11** | Comparación entre empresas | Análisis Financiero | Implementado |
| **RF-12** | Consulta histórica financiera | Gestión de Empresas | Implementado |
| **RF-13** | Generación de reportes | Reportes | En desarrollo |
| **RF-14** | Predicción financiera mediante SVM | Inteligencia Artificial | En desarrollo |
| **RF-15** | Dashboard financiero | Dashboard Financiero | Implementado |
| **RF-16** | Auditoría de operaciones | Seguridad | En desarrollo |
| **RF-17** | Asistente financiero conversacional | Inteligencia Artificial | Implementado |

### 6.6.2 Relación Casos de Prueba — Requisitos Funcionales

| Requisito Funcional | Casos de Prueba Relacionados |
|:--------------------|:-----------------------------|
| **RF-01** — Gestión de usuarios | TC-001, TC-004, TC-005, TC-006 |
| **RF-02** — Gestión de roles y permisos | TC-002, TC-003, TC-007, TC-008 |
| **RF-03** — Gestión de sectores económicos | TC-009, TC-010 |
| **RF-04** — Gestión de empresas | TC-011, TC-012, TC-013 |
| **RF-05** — Descarga automática de estados financieros | TC-014 |
| **RF-06** — Procesamiento de documentos financieros | TC-015 |
| **RF-07** — Transformación y limpieza de datos | TC-015 |
| **RF-08** — Almacenamiento histórico de información financiera | TC-016 |
| **RF-09** — Cálculo de indicadores financieros | TC-017 |
| **RF-10** — Visualización de información financiera | TC-019 |
| **RF-11** — Comparación entre empresas | TC-018 |
| **RF-12** — Consulta histórica financiera | TC-016 |
| **RF-13** — Generación de reportes | TC-020 |
| **RF-14** — Predicción financiera mediante SVM | TC-021 |
| **RF-15** — Dashboard financiero | TC-019 |
| **RF-16** — Auditoría de operaciones | TC-023 |
| **RF-17** — Asistente financiero conversacional | TC-022 |

### 6.6.3 Matriz de Trazabilidad (RF ↔ TC)

| RF \ TC | TC-001 | TC-002 | TC-003 | TC-004 | TC-005 | TC-006 | TC-007 | TC-008 | TC-009 | TC-010 | TC-011 | TC-012 | TC-013 | TC-014 | TC-015 | TC-016 | TC-017 | TC-018 | TC-019 | TC-020 | TC-021 | TC-022 | TC-023 |
|:--------|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|
| **RF-01** | ✓ | | | ✓ | ✓ | ✓ | | | | | | | | | | | | | | | | | |
| **RF-02** | | ✓ | ✓ | | | | ✓ | ✓ | | | | | | | | | | | | | | | |
| **RF-03** | | | | | | | | | ✓ | ✓ | | | | | | | | | | | | | |
| **RF-04** | | | | | | | | | | | ✓ | ✓ | ✓ | | | | | | | | | | |
| **RF-05** | | | | | | | | | | | | | | ✓ | | | | | | | | | |
| **RF-06** | | | | | | | | | | | | | | | ✓ | | | | | | | | |
| **RF-07** | | | | | | | | | | | | | | | ✓ | | | | | | | | |
| **RF-08** | | | | | | | | | | | | | | | | ✓ | | | | | | | |
| **RF-09** | | | | | | | | | | | | | | | | | ✓ | | | | | | |
| **RF-10** | | | | | | | | | | | | | | | | | | | ✓ | | | | |
| **RF-11** | | | | | | | | | | | | | | | | | | ✓ | | | | | |
| **RF-12** | | | | | | | | | | | | | | | | ✓ | | | | | | | |
| **RF-13** | | | | | | | | | | | | | | | | | | | | ✓ | | | |
| **RF-14** | | | | | | | | | | | | | | | | | | | | | ✓ | | |
| **RF-15** | | | | | | | | | | | | | | | | | | | ✓ | | | | |
| **RF-16** | | | | | | | | | | | | | | | | | | | | | | | ✓ |
| **RF-17** | | | | | | | | | | | | | | | | | | | | | | ✓ | |

### 6.6.4 Resumen de Cobertura

| Métrica | Valor |
|:--------|:------|
| Total de Casos de Prueba | 23 |
| Pruebas Funcionales | 23 |
| Pruebas de Integración | 15 |
| Pruebas de Sistema | 3 |
| Pruebas de Aceptación | 2 |
| Pruebas de Seguridad | 3 |
| Total de Requisitos Funcionales | 17 (RF-01 a RF-17) |
| Requisitos Implementados | 14 (RF-01 a RF-12, RF-15, RF-17) |
| Requisitos en Desarrollo | 3 (RF-13, RF-14, RF-16) |
| Cobertura de Requisitos Implementados | 14/17 = 82.4 % |
| Cobertura Total Proyectada | 17/17 = 100 % |
| Casos de Prueba Aprobados | 20 |
| Casos de Prueba Pendientes de Ejecución | 3 (TC-020, TC-021, TC-023) |
| Técnicas de prueba utilizadas | Casos de Uso, Partición de Equivalencias, Valores Límite, Tabla de Decisiones, Transición de Estados, Cobertura de Sentencia, Cobertura de Decisión |

### 6.6.5 Detalle de Requisitos por Estado

#### Requisitos Implementados

| # | Requisito | Casos de Prueba | Estado |
|:--|:----------|:-----------------|:-------|
| RF-01 | Gestión de usuarios | TC-001, TC-004, TC-005, TC-006 | Aprobado |
| RF-02 | Gestión de roles y permisos | TC-002, TC-003, TC-007, TC-008 | Aprobado |
| RF-03 | Gestión de sectores económicos | TC-009, TC-010 | Aprobado |
| RF-04 | Gestión de empresas | TC-011, TC-012, TC-013 | Aprobado |
| RF-05 | Descarga automática de estados financieros | TC-014 | Aprobado |
| RF-06 | Procesamiento de documentos financieros | TC-015 | Aprobado |
| RF-07 | Transformación y limpieza de datos | TC-015 | Aprobado |
| RF-08 | Almacenamiento histórico de información financiera | TC-016 | Aprobado |
| RF-09 | Cálculo de indicadores financieros | TC-017 | Aprobado |
| RF-10 | Visualización de información financiera | TC-019 | Aprobado |
| RF-11 | Comparación entre empresas | TC-018 | Aprobado |
| RF-12 | Consulta histórica financiera | TC-016 | Aprobado |
| RF-15 | Dashboard financiero | TC-019 | Aprobado |
| RF-17 | Asistente financiero conversacional | TC-022 | Aprobado |

#### Requisitos en Desarrollo

| # | Requisito | Casos de Prueba | Estado |
|:--|:----------|:-----------------|:-------|
| RF-13 | Generación de reportes | TC-020 | Pendiente de ejecución |
| RF-14 | Predicción financiera mediante SVM | TC-021 | Pendiente de ejecución |
| RF-16 | Auditoría de operaciones | TC-023 | Pendiente de ejecución |

### 6.6.6 Lista de Requisitos Pendientes

Ninguno. Todos los requisitos funcionales (RF-01 a RF-17) cuentan con al menos un caso de prueba asociado. Los requisitos RF-13, RF-14 y RF-16 se encuentran en desarrollo y serán implementados dentro del cronograma del proyecto.
