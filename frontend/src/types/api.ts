// ============================================================
// src/types/api.ts
// Tipos TypeScript mapeados directamente de los modelos Django
// ============================================================

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface SectorEmpresa {
  id_sector: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Empresa {
  id_empresa: number;
  nombre: string;
  codigo_bbv: string;
  sigla: string | null;
  sector: number;
  sector_nombre: string; // ReadOnlyField del serializer
  descripcion: string | null;
  sitio_web: string | null;
  activa: boolean;
  created_at: string;
  updated_at: string;
}

export type EstadoProcesamiento = 'PENDIENTE' | 'DESCARGADO' | 'PROCESADO' | 'ERROR';
export type TipoPeriodo = 'TRIMESTRAL' | 'ANUAL';

export interface ReporteFinanciero {
  id_reporte: number;
  empresa: number;
  empresa_nombre: string; // ReadOnlyField del serializer
  gestion: number;
  tipo_periodo: TipoPeriodo;
  trimestre: number | null;
  fecha_publicacion: string | null;
  fecha_descarga: string | null;
  url_pdf: string;
  nombre_archivo: string | null;
  ruta_archivo: string | null;
  hash_archivo: string | null;
  tamano_archivo: number | null;
  estado_procesamiento: EstadoProcesamiento;
  mensaje_error: string | null;
  datos_extraidos_json: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface Usuario {
  id_usuario: number;
  username: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  email: string;
  ci: string | null;
  fecha_nacimiento: string | null;
  celular: string | null;
  activo: boolean;
  groups: number[];
  group_names: string[];
  created_at: string;
  updated_at: string;
}

// Parámetros de consulta tipados para el frontend
export interface EmpresaParams {
  sector?: number;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface ReporteParams {
  empresa?: number;
  gestion?: number;
  trimestre?: number;
  estado_procesamiento?: string;
  page?: number;
  page_size?: number;
}

export interface DashboardKPIs {
  total_empresas: number;
  total_sectores: number;
  total_reportes: number;
  total_usuarios: number;
}
