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

// ──────────────────────────────────────────────────────────────
// USUARIOS
// ──────────────────────────────────────────────────────────────

export const getUsuarios = (params?: { page?: number }) =>
  apiClient
    .get<PaginatedResponse<Usuario>>('/usuarios/', { params })
    .then((r) => r.data);

// ──────────────────────────────────────────────────────────────
// PIPELINE
// ──────────────────────────────────────────────────────────────

export const ejecutarPipeline = (empresaId: number, gestion: number, trimestre: number) =>
  apiClient
    .post(`/empresas/${empresaId}/actualizar-reportes/`, { gestion, trimestre })
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
