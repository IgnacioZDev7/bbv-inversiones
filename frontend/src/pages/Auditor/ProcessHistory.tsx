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
  });

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    PROCESADO: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
    ERROR: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
    PENDIENTE: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
    DESCARGADO: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
};

export default function ProcessHistory() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ empresa: '', estado: '', gestion: '' });

  const { data: companiesData } = useApi<PaginatedResponse<Empresa>>(
    () => getEmpresas({ page_size: 200 }),
    []
  );

  const { data, isLoading } = useApi<PaginatedResponse<ReporteFinanciero>>(
    () => getReportes({
      page,
      page_size: 15,
      empresa: filters.empresa ? Number(filters.empresa) : undefined,
      estado_procesamiento: filters.estado || undefined,
      gestion: filters.gestion ? Number(filters.gestion) : undefined,
    }),
    [page, filters]
  );

  const handleFilter = (name: string, value: string) => {
    setFilters((p) => ({ ...p, [name]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ empresa: '', estado: '', gestion: '' });
    setPage(1);
  };

  const totalPages = data ? Math.ceil(data.count / 15) : 0;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">Auditoría</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">Historial de Procesos</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Timeline completo de procesamiento de reportes financieros.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] md:grid-cols-4">
        <div>
          <label className="mb-2 ml-1 block text-xs font-bold uppercase text-gray-400">Empresa</label>
          <select
            value={filters.empresa}
            onChange={(e) => handleFilter('empresa', e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="">Todas</option>
            {companiesData?.results.map((emp) => (
              <option key={emp.id_empresa} value={emp.id_empresa}>{emp.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-2 ml-1 block text-xs font-bold uppercase text-gray-400">Estado</label>
          <select
            value={filters.estado}
            onChange={(e) => handleFilter('estado', e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="">Todos</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="DESCARGADO">Descargado</option>
            <option value="PROCESADO">Procesado</option>
            <option value="ERROR">Error</option>
          </select>
        </div>
        <div>
          <label className="mb-2 ml-1 block text-xs font-bold uppercase text-gray-400">Gestión</label>
          <input
            type="number"
            placeholder="Ej: 2024"
            value={filters.gestion}
            onChange={(e) => handleFilter('gestion', e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={clearFilters}
            className="w-full rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-bold text-gray-700 transition-all hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wide text-gray-500 dark:bg-gray-900/50 dark:text-gray-400">
              <tr>
                <th className="px-6 py-4">Empresa</th>
                <th className="px-6 py-4">Periodo</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Fecha procesamiento</th>
                <th className="px-6 py-4">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-4"><div className="h-4 w-full rounded bg-gray-100 dark:bg-gray-700" /></td>
                  </tr>
                ))
              ) : (data?.results ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-xs text-gray-400 italic">
                    No se encontraron procesos con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                data?.results.map((r) => (
                  <tr key={r.id_reporte} className="transition hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900 dark:text-white">{r.empresa_nombre}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {r.gestion}
                      {r.trimestre ? <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500 dark:bg-gray-700">T{r.trimestre}</span> : ''}
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={r.estado_procesamiento} /></td>
                    <td className="px-6 py-4 text-xs text-gray-500">{formatDateTime(r.updated_at)}</td>
                    <td className="px-6 py-4 text-xs text-red-600 max-w-[200px] truncate">
                      {r.estado_procesamiento === 'ERROR' ? r.mensaje_error : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data && data.count > 0 && (
          <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-900/30">
            <span className="text-xs text-gray-500">
              {data.results.length} de {data.count} reportes
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
    </div>
  );
}
