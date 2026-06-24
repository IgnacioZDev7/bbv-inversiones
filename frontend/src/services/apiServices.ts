// ============================================================
// src/services/apiServices.ts
// Capa de acceso a la API. Todos los componentes deben pasar
// por aquí — nunca importar apiClient directamente en UI.
// ============================================================

import apiClient from '../api/client';
import type {
  PaginatedResponse,
  Empresa,
  SectorEmpresa,
  ReporteFinanciero,
  Usuario,
  EmpresaParams,
  ReporteParams,
  DashboardKPIs,
  ChatRequest,
  ChatResponse,
  BiometricVerifyResponse,
  DocumentValidationResponse,
  LivenessCheckResponse,
  PoseVerificationResponse,
  SimulationParams,
  SimulationResult,
} from '../types/api';

// ──────────────────────────────────────────────────────────────
// EMPRESAS
// ──────────────────────────────────────────────────────────────

export const getEmpresas = (params?: EmpresaParams) =>
  apiClient
    .get<PaginatedResponse<Empresa>>('/empresas/', { params })
    .then((r) => r.data);

export const getAllEmpresas = async (params?: Omit<EmpresaParams, 'page'>): Promise<Empresa[]> => {
  const results: Empresa[] = [];
  let page = 1;
  let hasMore = true;
  while (hasMore) {
    const res = await getEmpresas({ ...params, page });
    results.push(...res.results);
    hasMore = res.next !== null;
    page++;
  }
  return results;
};

export const getEmpresaById = (id: number) =>
  apiClient
    .get<Empresa>(`/empresas/${id}/`)
    .then((r) => r.data);

// ──────────────────────────────────────────────────────────────
// SECTORES
// ──────────────────────────────────────────────────────────────

export const getSectores = (params?: { page?: number }) =>
  apiClient
    .get<PaginatedResponse<SectorEmpresa>>('/sectores/', { params })
    .then((r) => r.data);

export const getAllSectores = async (): Promise<SectorEmpresa[]> => {
  const results: SectorEmpresa[] = [];
  let page = 1;
  let hasMore = true;
  while (hasMore) {
    const res = await getSectores({ page });
    results.push(...res.results);
    hasMore = res.next !== null;
    page++;
  }
  return results;
};

// ──────────────────────────────────────────────────────────────
// REPORTES FINANCIEROS
// Regla de arquitectura: siempre filtrar por empresa en dashboards financieros.
// Para el Dashboard Administrativo, se permite obtener los últimos registros
// con un límite estricto (page_size).
// ──────────────────────────────────────────────────────────────

export const getReportes = (params?: ReporteParams) =>
  apiClient
    .get<PaginatedResponse<ReporteFinanciero>>('/reportes/', { params })
    .then((r) => r.data);

export const getReportesByEmpresa = (empresaId: number, params?: Omit<ReporteParams, 'empresa'>) =>
  getReportes({ empresa: empresaId, ...params });

export const getLatestReportes = (limit: number = 5) =>
  getReportes({ page_size: limit });

export const getAllReportes = async (params?: Omit<ReporteParams, 'page'>): Promise<ReporteFinanciero[]> => {
  const results: ReporteFinanciero[] = [];
  let page = 1;
  let hasMore = true;
  while (hasMore) {
    const res = await getReportes({ ...params, page });
    results.push(...res.results);
    hasMore = res.next !== null;
    page++;
  }
  return results;
};

// ──────────────────────────────────────────────────────────────
// USUARIOS
// ──────────────────────────────────────────────────────────────

export const getUsuarios = (params?: { page?: number }) =>
  apiClient
    .get<PaginatedResponse<Usuario>>('/usuarios/', { params })
    .then((r) => r.data);

export const getCurrentUser = () =>
  apiClient
    .get<Usuario>('/accounts/me/')
    .then((r) => r.data);

export const getAllUsuarios = async (): Promise<Usuario[]> => {
  const results: Usuario[] = [];
  let page = 1;
  let hasMore = true;
  while (hasMore) {
    const res = await getUsuarios({ page });
    results.push(...res.results);
    hasMore = res.next !== null;
    page++;
  }
  return results;
};

// ──────────────────────────────────────────────────────────────
// ADMIN CRUD — Usuarios, Empresas, Sectores, Reportes
// ──────────────────────────────────────────────────────────────

export const createUsuario = (data: Partial<Usuario>) =>
  apiClient.post<Usuario>('/usuarios/', data).then((r) => r.data);

export const updateUsuario = (id: number, data: Partial<Usuario>) =>
  apiClient.patch<Usuario>(`/usuarios/${id}/`, data).then((r) => r.data);

export const deleteUsuario = (id: number) =>
  apiClient.delete(`/usuarios/${id}/`).then((r) => r.data);

export const cambiarGrupoUsuario = (id: number, nombreGrupo: string) =>
  apiClient.post(`/usuarios/${id}/cambiar-grupo/`, { nombre_grupo: nombreGrupo }).then((r) => r.data);

export const createEmpresa = (data: Partial<Empresa>) =>
  apiClient.post<Empresa>('/empresas/', data).then((r) => r.data);

export const updateEmpresa = (id: number, data: Partial<Empresa>) =>
  apiClient.patch<Empresa>(`/empresas/${id}/`, data).then((r) => r.data);

export const deleteEmpresa = (id: number) =>
  apiClient.delete(`/empresas/${id}/`).then((r) => r.data);

export const createSector = (data: Partial<SectorEmpresa>) =>
  apiClient.post<SectorEmpresa>('/sectores/', data).then((r) => r.data);

export const updateSector = (id: number, data: Partial<SectorEmpresa>) =>
  apiClient.patch<SectorEmpresa>(`/sectores/${id}/`, data).then((r) => r.data);

export const deleteSector = (id: number) =>
  apiClient.delete(`/sectores/${id}/`).then((r) => r.data);

export const updateReporte = (id: number, data: Partial<ReporteFinanciero>) =>
  apiClient.patch<ReporteFinanciero>(`/reportes/${id}/`, data).then((r) => r.data);

export const deleteReporte = (id: number) =>
  apiClient.delete(`/reportes/${id}/`).then((r) => r.data);

// ──────────────────────────────────────────────────────────────
// CHAT
// ──────────────────────────────────────────────────────────────

export const sendChatMessage = (data: ChatRequest) =>
  apiClient
    .post<ChatResponse>('/chat/', data)
    .then((r) => r.data);

// ──────────────────────────────────────────────────────────────
// PIPELINE
// ──────────────────────────────────────────────────────────────

export const ejecutarPipeline = (empresaId: number, gestion: number, trimestre: number) =>
  apiClient
    .post(`/empresas/${empresaId}/actualizar-reportes/`, { gestion, trimestre })
    .then((r) => r.data);

// ──────────────────────────────────────────────────────────────
// PERFIL — Completar/actualizar perfil del usuario autenticado
// ──────────────────────────────────────────────────────────────

export interface CompleteProfilePayload {
  nombre?: string;
  apellido_paterno?: string;
  apellido_materno?: string;
  email?: string;
  ci?: string;
  celular?: string;
  fecha_nacimiento?: string;
}

export const completarPerfil = (data: CompleteProfilePayload) =>
  apiClient
    .patch<Usuario>('/usuarios/me/completar_perfil/', data)
    .then((r) => r.data);

export const cambiarPassword = (password: string) =>
  apiClient
    .patch<Usuario>('/usuarios/me/', { password })
    .then((r) => r.data);

// ──────────────────────────────────────────────────────────────
// KPIs del Dashboard General
// Usa Promise.all para paralelizar — cada endpoint retorna `count`
// porque la paginación global está activa (PAGE_SIZE=10).
// ──────────────────────────────────────────────────────────────

export const getDashboardKPIs = async (): Promise<DashboardKPIs> => {
  const [empresas, sectores, reportes, usuarios] = await Promise.all([
    apiClient.get<PaginatedResponse<Empresa>>('/empresas/', { params: { page_size: 1 } }),
    apiClient.get<PaginatedResponse<SectorEmpresa>>('/sectores/', { params: { page_size: 1 } }),
    // ⚠ ÚNICA excepción permitida de /reportes/ sin filtro de empresa:
    // es un conteo agregado para el KPI, no para graficar.
    apiClient.get<PaginatedResponse<ReporteFinanciero>>('/reportes/', { params: { page_size: 1 } }),
    apiClient.get<PaginatedResponse<Usuario>>('/usuarios/', { params: { page_size: 1 } }),
  ]);

  return {
    total_empresas: empresas.data.count,
    total_sectores: sectores.data.count,
    total_reportes: reportes.data.count,
    total_usuarios: usuarios.data.count,
  };
};

// ──────────────────────────────────────────────────────────────
// BIOMETRICS — Verificación facial y liveness
// ──────────────────────────────────────────────────────────────

export const verifyBiometricIdentity = (carnetImage: File, selfieImage: File) => {
  const formData = new FormData();
  formData.append('carnet_image', carnetImage);
  formData.append('selfie_image', selfieImage);
  return apiClient
    .post<BiometricVerifyResponse>('/biometrics/verify/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
};

export const validateDocument = (carnetImage: File) => {
  const formData = new FormData();
  formData.append('carnet_image', carnetImage);
  return apiClient
    .post<DocumentValidationResponse>('/biometrics/validate-document/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
};

export const verifyPoses = (frontImage: File, leftImage: File, rightImage: File) => {
  const formData = new FormData();
  formData.append('image_front', frontImage);
  formData.append('image_left', leftImage);
  formData.append('image_right', rightImage);
  return apiClient
    .post<PoseVerificationResponse>('/biometrics/verify-poses/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
};

export const checkLiveness = (selfieImage: File) => {
  const formData = new FormData();
  formData.append('selfie_image', selfieImage);
  return apiClient
    .post<LivenessCheckResponse>('/biometrics/liveness/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
};

// ──────────────────────────────────────────────────────────────
// DASHBOARD — Datos agregados para dashboards del frontend
// ──────────────────────────────────────────────────────────────

export interface DashboardData {
  total_empresas: number;
  total_sectores: number;
  total_reportes: number;
  total_usuarios: number;
  empresas_procesadas: number;
  reportes_procesados: number;
  reportes_con_error: number;
  reportes_pendientes: number;
  ultimos_reportes: Array<{
    empresa_nombre: string;
    gestion: number;
    trimestre: number | null;
    estado_procesamiento: string;
    updated_at: string;
  }>;
  empresas_por_sector: Array<{ sector_nombre: string; count: number }>;
  reportes_por_estado: Array<{ estado: string; count: number }>;
  ultimos_usuarios: Array<{
    nombre: string;
    email: string;
    group_names: string[];
    activo: boolean;
    created_at: string;
  }>;
  actividad_7_dias: Array<{
    fecha: string;
    dia_semana: string;
    procesados: number;
    errores: number;
  }>;
}

export const getDashboardData = () =>
  apiClient.get<DashboardData>('/dashboard/').then((r) => r.data);

// ──────────────────────────────────────────────────────────────
// SIMULADOR FINANCIERO
// ──────────────────────────────────────────────────────────────

export const simulateInvestment = (params: SimulationParams) =>
  apiClient
    .post<SimulationResult>('/simulator/execute/', params)
    .then((r) => r.data);
