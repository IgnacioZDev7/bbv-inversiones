import { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { getReportes, getEmpresas } from '../../services/apiServices';
import type { ReporteFinanciero, PaginatedResponse, Empresa } from '../../types/api';

const formatDateTime = (dateStr: string) =>
  new Date(dateStr).toLocaleString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

export default function Logs() {
  const [page, setPage] = useState(1);
  const [empresaFilter, setEmpresaFilter] = useState('');

  const { data: companiesData } = useApi<PaginatedResponse<Empresa>>(
    () => getEmpresas({ page_size: 200 }),
    []
  );

  const { data, isLoading } = useApi<PaginatedResponse<ReporteFinanciero>>(
    () => getReportes({
      page,
      page_size: 20,
      estado_procesamiento: 'ERROR',
      empresa: empresaFilter ? Number(empresaFilter) : undefined,
    }),
    [page, empresaFilter]
  );

  const totalPages = data ? Math.ceil(data.count / 20) : 0;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">Auditoría</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">Logs del Sistema</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Registro de errores y fallos en el procesamiento de reportes.
        </p>
      </div>

      <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="w-full max-w-xs">
          <label className="mb-2 ml-1 block text-xs font-bold uppercase text-gray-400">Filtrar por empresa</label>
          <select
            value={empresaFilter}
            onChange={(e) => { setEmpresaFilter(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="">Todas las empresas</option>
            {companiesData?.results.map((emp) => (
              <option key={emp.id_empresa} value={emp.id_empresa}>{emp.nombre}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end pb-1">
          <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600 dark:bg-red-500/10 dark:text-red-400">
            {data?.count ?? 0} errores
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800 h-20" />
          ))
        ) : (data?.results ?? []).length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-xs text-gray-400 italic">No hay errores registrados.</p>
          </div>
        ) : (
          data?.results.map((r) => (
            <div
              key={r.id_reporte}
              className="rounded-2xl border border-red-100 bg-red-50/50 p-5 shadow-sm dark:border-red-900/30 dark:bg-red-500/5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    <span className="text-xs font-bold uppercase tracking-wide text-red-700 dark:text-red-400">
                      Error #{r.id_reporte}
                    </span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">{r.empresa_nombre}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-red-800 dark:text-red-300 break-words">
                    {r.mensaje_error || 'Sin mensaje de error'}
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                    <span>{formatDateTime(r.updated_at)}</span>
                    <span>·</span>
                    <span>Gestión {r.gestion}{r.trimestre ? ` T${r.trimestre}` : ''}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {data && data.count > 0 && (
        <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <span className="text-xs text-gray-500">
            {data.results.length} de {data.count} errores
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1 || isLoading}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium transition-all hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800"
            >
              Anterior
            </button>
            <span className="px-3 text-xs font-bold text-gray-600 dark:text-gray-400">
              Pág. {page} de {totalPages}
            </span>
            <button
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium transition-all hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
