-- =============================================================
-- BBV INVERSIONES — DDL COMPLETO (MySQL 8.x)
-- Generado para diagrama ER en MySQL Workbench
-- =============================================================
-- Todas las tablas del proyecto (19) + Django/terceros (17)
-- Total: 36 tablas
-- =============================================================

CREATE DATABASE IF NOT EXISTS bbv_temp DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bbv_temp;

-- =============================================================
-- 1. TABLAS DEL PROYECTO
-- =============================================================

-- ---------------------------------------------------------
-- accounts — Gestión de usuarios
-- ---------------------------------------------------------

CREATE TABLE genero (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    nombre          VARCHAR(50) NOT NULL,
    descripcion     TEXT NULL,
    activo          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE usuario (
    id_usuario          BIGINT AUTO_INCREMENT PRIMARY KEY,
    password            VARCHAR(128) NOT NULL,
    last_login          DATETIME NULL,
    is_superuser        BOOLEAN NOT NULL DEFAULT FALSE,
    username            VARCHAR(150) NOT NULL,
    email               VARCHAR(254) NOT NULL,
    is_staff            BOOLEAN NOT NULL DEFAULT FALSE,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    date_joined         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    nombre              VARCHAR(100) NOT NULL DEFAULT '',
    apellido_paterno    VARCHAR(100) NULL,
    apellido_materno    VARCHAR(100) NULL,
    ci                  VARCHAR(30) NULL,
    fecha_nacimiento    DATE NULL,
    genero_id           INT NULL,
    celular             VARCHAR(30) NULL,
    foto_perfil         VARCHAR(100) NULL,
    oauth_google        BOOLEAN NOT NULL DEFAULT FALSE,
    activo              BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_usuario_username (username),
    UNIQUE KEY uq_usuario_email (email),
    UNIQUE KEY uq_usuario_ci (ci),
    KEY fk_usuario_genero (genero_id),
    CONSTRAINT fk_usuario_genero FOREIGN KEY (genero_id) REFERENCES genero(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE direccion (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id      BIGINT NOT NULL,
    zona            VARCHAR(150) NOT NULL,
    calle           VARCHAR(150) NOT NULL,
    numero          VARCHAR(50) NULL,
    referencia      TEXT NULL,
    principal       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY fk_direccion_usuario (usuario_id),
    CONSTRAINT fk_direccion_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE perfil_usuario (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id      BIGINT NOT NULL UNIQUE,
    biografia       TEXT NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY fk_perfil_usuario (usuario_id),
    CONSTRAINT fk_perfil_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE sesion_usuario (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id          BIGINT NOT NULL,
    token               VARCHAR(500) NOT NULL,
    ip                  VARCHAR(45) NULL,
    dispositivo         VARCHAR(255) NULL,
    fecha_inicio        DATETIME NOT NULL,
    fecha_expiracion    DATETIME NOT NULL,
    activa              BOOLEAN NOT NULL DEFAULT TRUE,
    KEY fk_sesion_usuario (usuario_id),
    CONSTRAINT fk_sesion_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- financials — Empresas, sectores y reportes
-- ---------------------------------------------------------

CREATE TABLE sector_empresa (
    id_sector       INT AUTO_INCREMENT PRIMARY KEY,
    nombre          VARCHAR(100) NOT NULL,
    descripcion     TEXT NULL,
    activo          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE empresa (
    id_empresa      INT AUTO_INCREMENT PRIMARY KEY,
    nombre          VARCHAR(255) NOT NULL,
    codigo_bbv      VARCHAR(50) NOT NULL,
    sigla           VARCHAR(20) NULL,
    sector_id       INT NOT NULL,
    descripcion     TEXT NULL,
    sitio_web       VARCHAR(200) NULL,
    activa          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_empresa_codigo (codigo_bbv),
    KEY fk_empresa_sector (sector_id),
    CONSTRAINT fk_empresa_sector FOREIGN KEY (sector_id) REFERENCES sector_empresa(id_sector) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE reporte_financiero (
    id_reporte              INT AUTO_INCREMENT PRIMARY KEY,
    empresa_id              INT NOT NULL,
    gestion                 INT NOT NULL,
    tipo_periodo            VARCHAR(20) NOT NULL,
    trimestre               INT NULL,
    fecha_publicacion       DATE NULL,
    fecha_descarga          DATETIME NULL,
    url_pdf                 VARCHAR(500) NOT NULL,
    nombre_archivo          VARCHAR(255) NULL,
    ruta_archivo            VARCHAR(500) NULL,
    hash_archivo            VARCHAR(255) NULL,
    tamano_archivo          BIGINT NULL,
    estado_procesamiento    VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE',
    mensaje_error           TEXT NULL,
    datos_extraidos_json    JSON NULL,
    created_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY fk_reporte_empresa (empresa_id),
    CONSTRAINT fk_reporte_empresa FOREIGN KEY (empresa_id) REFERENCES empresa(id_empresa) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- processing — Pipeline ETL
-- ---------------------------------------------------------

CREATE TABLE proceso_carga (
    id_proceso      INT AUTO_INCREMENT PRIMARY KEY,
    empresa_id      INT NULL,
    reporte_id      INT NULL,
    tipo_proceso    VARCHAR(50) NOT NULL,
    estado          VARCHAR(50) NOT NULL DEFAULT 'pendiente',
    fecha_inicio    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_fin       DATETIME NULL,
    detalle         TEXT NULL,
    mensaje_error   TEXT NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY fk_proceso_empresa (empresa_id),
    KEY fk_proceso_reporte (reporte_id),
    CONSTRAINT fk_proceso_empresa FOREIGN KEY (empresa_id) REFERENCES empresa(id_empresa) ON DELETE SET NULL,
    CONSTRAINT fk_proceso_reporte FOREIGN KEY (reporte_id) REFERENCES reporte_financiero(id_reporte) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- ingestion — Archivos procesados
-- ---------------------------------------------------------

CREATE TABLE archivo_procesado (
    id_archivo      INT AUTO_INCREMENT PRIMARY KEY,
    reporte_id      INT NOT NULL,
    nombre_archivo  VARCHAR(255) NOT NULL,
    ruta_archivo    VARCHAR(500) NOT NULL,
    hash_archivo    VARCHAR(255) NOT NULL,
    tipo_archivo    VARCHAR(50) NOT NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY fk_archivo_reporte (reporte_id),
    CONSTRAINT fk_archivo_reporte FOREIGN KEY (reporte_id) REFERENCES reporte_financiero(id_reporte) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- audit — Auditoría y configuración
-- ---------------------------------------------------------

CREATE TABLE bitacora_sistema (
    id_bitacora     INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id      BIGINT NULL,
    accion          VARCHAR(200) NOT NULL,
    modulo          VARCHAR(100) NOT NULL,
    detalle         TEXT NULL,
    ip              VARCHAR(100) NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY fk_bitacora_usuario (usuario_id),
    CONSTRAINT fk_bitacora_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE configuracion_sistema (
    id_configuracion    INT AUTO_INCREMENT PRIMARY KEY,
    clave               VARCHAR(100) NOT NULL,
    valor               TEXT NOT NULL,
    descripcion         TEXT NULL,
    updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_config_clave (clave)
) ENGINE=InnoDB;

CREATE TABLE tarea_programada (
    id_tarea        INT AUTO_INCREMENT PRIMARY KEY,
    nombre          VARCHAR(150) NOT NULL,
    descripcion     TEXT NULL,
    cron            VARCHAR(100) NOT NULL,
    activa          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE ejecucion_tarea (
    id_ejecucion    INT AUTO_INCREMENT PRIMARY KEY,
    tarea_id        INT NOT NULL,
    fecha_inicio    DATETIME NOT NULL,
    fecha_fin       DATETIME NULL,
    estado          VARCHAR(50) NOT NULL,
    resultado       TEXT NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY fk_ejecucion_tarea (tarea_id),
    CONSTRAINT fk_ejecucion_tarea FOREIGN KEY (tarea_id) REFERENCES tarea_programada(id_tarea) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- analytics — Indicadores financieros, IA
-- ---------------------------------------------------------

CREATE TABLE catalogo_indicador (
    id_catalogo_indicador   INT AUTO_INCREMENT PRIMARY KEY,
    nombre                  VARCHAR(150) NOT NULL,
    codigo                  VARCHAR(50) NOT NULL,
    descripcion             TEXT NULL,
    formula                 TEXT NULL,
    activo                  BOOLEAN NOT NULL DEFAULT TRUE,
    created_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_indicador_codigo (codigo)
) ENGINE=InnoDB;

CREATE TABLE indicador_financiero (
    id_indicador            INT AUTO_INCREMENT PRIMARY KEY,
    reporte_id              INT NOT NULL,
    score_financiero        DECIMAL(5,2) NULL,
    clasificacion_riesgo    VARCHAR(100) NULL,
    recomendacion           VARCHAR(200) NULL,
    resumen_interpretativo  TEXT NULL,
    fecha_calculo           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY fk_indicador_reporte (reporte_id),
    CONSTRAINT fk_indicador_reporte FOREIGN KEY (reporte_id) REFERENCES reporte_financiero(id_reporte) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE valor_indicador (
    id_valor                INT AUTO_INCREMENT PRIMARY KEY,
    indicador_id            INT NOT NULL,
    catalogo_indicador_id   INT NOT NULL,
    valor                   DECIMAL(18,6) NOT NULL,
    created_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY fk_valor_indicador (indicador_id),
    KEY fk_valor_catalogo (catalogo_indicador_id),
    CONSTRAINT fk_valor_indicador FOREIGN KEY (indicador_id) REFERENCES indicador_financiero(id_indicador) ON DELETE CASCADE,
    CONSTRAINT fk_valor_catalogo FOREIGN KEY (catalogo_indicador_id) REFERENCES catalogo_indicador(id_catalogo_indicador) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE simulacion_financiera (
    id_simulacion       INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id          BIGINT NOT NULL,
    nombre_simulacion   VARCHAR(200) NOT NULL,
    parametros          JSON NOT NULL,
    resultado           JSON NOT NULL,
    score_confianza     DECIMAL(5,2) NULL,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY fk_simulacion_usuario (usuario_id),
    CONSTRAINT fk_simulacion_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE recomendacion_ia (
    id_recomendacion    INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id          BIGINT NOT NULL,
    empresa_id          INT NOT NULL,
    recomendacion       VARCHAR(100) NOT NULL,
    justificacion       TEXT NOT NULL,
    score               DECIMAL(5,2) NOT NULL,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY fk_recomendacion_usuario (usuario_id),
    KEY fk_recomendacion_empresa (empresa_id),
    CONSTRAINT fk_recomendacion_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    CONSTRAINT fk_recomendacion_empresa FOREIGN KEY (empresa_id) REFERENCES empresa(id_empresa) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =============================================================
-- 2. TABLAS DEL FRAMEWORK DJANGO + TERCEROS
-- =============================================================

-- ---------------------------------------------------------
-- django — Content types (base para permisos)
-- ---------------------------------------------------------

CREATE TABLE django_content_type (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    app_label   VARCHAR(100) NOT NULL,
    model       VARCHAR(100) NOT NULL,
    UNIQUE KEY uq_django_ct (app_label, model)
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- auth — Permisos y grupos
-- ---------------------------------------------------------

CREATE TABLE auth_permission (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    content_type_id INT NOT NULL,
    codename        VARCHAR(100) NOT NULL,
    UNIQUE KEY uq_auth_perm (content_type_id, codename),
    KEY fk_perm_content_type (content_type_id),
    CONSTRAINT fk_perm_content_type FOREIGN KEY (content_type_id) REFERENCES django_content_type(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE auth_group (
    id      INT AUTO_INCREMENT PRIMARY KEY,
    name    VARCHAR(150) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE auth_group_permissions (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    group_id        INT NOT NULL,
    permission_id   INT NOT NULL,
    UNIQUE KEY uq_group_perm (group_id, permission_id),
    KEY fk_gp_group (group_id),
    KEY fk_gp_permission (permission_id),
    CONSTRAINT fk_gp_group FOREIGN KEY (group_id) REFERENCES auth_group(id) ON DELETE CASCADE,
    CONSTRAINT fk_gp_permission FOREIGN KEY (permission_id) REFERENCES auth_permission(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE usuario_groups (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id  BIGINT NOT NULL,
    group_id    INT NOT NULL,
    UNIQUE KEY uq_user_group (usuario_id, group_id),
    KEY fk_ug_user (usuario_id),
    KEY fk_ug_group (group_id),
    CONSTRAINT fk_ug_user FOREIGN KEY (usuario_id) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    CONSTRAINT fk_ug_group FOREIGN KEY (group_id) REFERENCES auth_group(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE usuario_user_permissions (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id      BIGINT NOT NULL,
    permission_id   INT NOT NULL,
    UNIQUE KEY uq_user_perm (usuario_id, permission_id),
    KEY fk_uperm_user (usuario_id),
    KEY fk_uperm_perm (permission_id),
    CONSTRAINT fk_uperm_user FOREIGN KEY (usuario_id) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    CONSTRAINT fk_uperm_perm FOREIGN KEY (permission_id) REFERENCES auth_permission(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- django — Admin log, sessions, sites, migrations
-- ---------------------------------------------------------

CREATE TABLE django_admin_log (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    action_time     DATETIME NOT NULL,
    object_id       TEXT NULL,
    object_repr     VARCHAR(200) NOT NULL,
    action_flag     SMALLINT UNSIGNED NOT NULL,
    change_message  TEXT NOT NULL,
    content_type_id INT NULL,
    user_id         BIGINT NOT NULL,
    KEY fk_adminlog_ct (content_type_id),
    KEY fk_adminlog_user (user_id),
    CONSTRAINT fk_adminlog_ct FOREIGN KEY (content_type_id) REFERENCES django_content_type(id) ON DELETE CASCADE,
    CONSTRAINT fk_adminlog_user FOREIGN KEY (user_id) REFERENCES usuario(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE django_session (
    session_key     VARCHAR(40) NOT NULL PRIMARY KEY,
    session_data    TEXT NOT NULL,
    expire_date     DATETIME NOT NULL,
    KEY uq_session_key (session_key),
    KEY idx_expire_date (expire_date)
) ENGINE=InnoDB;

CREATE TABLE django_site (
    id      INT AUTO_INCREMENT PRIMARY KEY,
    domain  VARCHAR(100) NOT NULL,
    name    VARCHAR(50) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE django_migrations (
    id      INT AUTO_INCREMENT PRIMARY KEY,
    app     VARCHAR(255) NOT NULL,
    name    VARCHAR(255) NOT NULL,
    applied DATETIME NOT NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- DRF — Authtoken
-- ---------------------------------------------------------

CREATE TABLE authtoken_token (
    key         VARCHAR(40) NOT NULL PRIMARY KEY,
    created     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id     BIGINT NOT NULL UNIQUE,
    CONSTRAINT fk_token_user FOREIGN KEY (user_id) REFERENCES usuario(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- allauth — Autenticación social (Google OAuth)
-- ---------------------------------------------------------

CREATE TABLE socialaccount_socialapp (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    provider    VARCHAR(30) NOT NULL,
    name        VARCHAR(40) NOT NULL,
    client_id   VARCHAR(191) NOT NULL,
    secret      VARCHAR(191) NOT NULL,
    key         VARCHAR(191) NOT NULL DEFAULT ''
) ENGINE=InnoDB;

CREATE TABLE socialaccount_socialapp_sites (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    socialapp_id   INT NOT NULL,
    site_id     INT NOT NULL,
    UNIQUE KEY uq_app_site (socialapp_id, site_id),
    KEY fk_sas_app (socialapp_id),
    KEY fk_sas_site (site_id),
    CONSTRAINT fk_sas_app FOREIGN KEY (socialapp_id) REFERENCES socialaccount_socialapp(id) ON DELETE CASCADE,
    CONSTRAINT fk_sas_site FOREIGN KEY (site_id) REFERENCES django_site(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE account_emailaddress (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    email           VARCHAR(254) NOT NULL,
    verified        BOOLEAN NOT NULL DEFAULT FALSE,
    primary_email   BOOLEAN NOT NULL DEFAULT FALSE,
    user_id         BIGINT NOT NULL,
    UNIQUE KEY uq_email (email),
    KEY fk_email_user (user_id),
    CONSTRAINT fk_email_user FOREIGN KEY (user_id) REFERENCES usuario(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE account_emailconfirmation (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    created             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sent                DATETIME NULL,
    key                 VARCHAR(64) NOT NULL UNIQUE,
    email_address_id    INT NOT NULL,
    KEY fk_emailconf_addr (email_address_id),
    CONSTRAINT fk_emailconf_addr FOREIGN KEY (email_address_id) REFERENCES account_emailaddress(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE socialaccount_socialaccount (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    provider    VARCHAR(30) NOT NULL,
    uid         VARCHAR(191) NOT NULL,
    last_login  DATETIME NOT NULL,
    date_joined DATETIME NOT NULL,
    user_id     BIGINT NOT NULL,
    UNIQUE KEY uq_social_provider_uid (provider, uid),
    KEY fk_social_user (user_id),
    CONSTRAINT fk_social_user FOREIGN KEY (user_id) REFERENCES usuario(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE socialaccount_socialtoken (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    token           TEXT NOT NULL,
    token_secret    TEXT NOT NULL,
    expires_at      DATETIME NULL,
    account_id      INT NOT NULL,
    app_id          INT NOT NULL,
    KEY fk_st_account (account_id),
    KEY fk_st_app (app_id),
    CONSTRAINT fk_st_account FOREIGN KEY (account_id) REFERENCES socialaccount_socialaccount(id) ON DELETE CASCADE,
    CONSTRAINT fk_st_app FOREIGN KEY (app_id) REFERENCES socialaccount_socialapp(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =============================================================
-- FIN DEL SCRIPT
-- =============================================================
-- Total: 36 tablas (19 proyecto + 17 Django/terceros)
-- =============================================================
