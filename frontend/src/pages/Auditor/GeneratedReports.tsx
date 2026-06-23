import { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { getReportes } from '../../services/apiServices';
import type { ReporteFinanciero, PaginatedResponse } from '../../types/api';
import { formatFechaInforme } from '../../utils/financialMetrics';

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

export default function GeneratedReports() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ desde: '', hasta: '', estado: '' });

  const { data, isLoading } = useApi<PaginatedResponse<ReporteFinanciero>>(
    () => getReportes({ page, page_size: 15, estado_procesamiento: filters.estado || undefined }),
    [page, filters.estado]
  );

  const allResults = data?.results ?? [];

  const filtered = allResults.filter((r) => {
    if (filters.desde && r.updated_at < filters.desde) return false;
    if (filters.hasta && r.updated_at > filters.hasta + 'T23:59:59') return false;
    return true;
  });

  const totalPages = data ? Math.ceil(data.count / 15) : 0;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">Auditoría</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">Reportes Generados</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Reportes financieros procesados y disponibles para revisión.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] md:grid-cols-4">
        <div>
          <label className="mb-2 ml-1 block text-xs font-bold uppercase text-gray-400">Desde</label>
          <input
            type="date"
            value={filters.desde}
            onChange={(e) => setFilters((p) => ({ ...p, desde: e.target.value }))}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900"
          />
        </div>
        <div>
          <label className="mb-2 ml-1 block text-xs font-bold uppercase text-gray-400">Hasta</label>
          <input
            type="date"
            value={filters.hasta}
            onChange={(e) => setFilters((p) => ({ ...p, hasta: e.target.value }))}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900"
          />
        </div>
        <div>
          <label className="mb-2 ml-1 block text-xs font-bold uppercase text-gray-400">Estado</label>
          <select
            value={filters.estado}
            onChange={(e) => setFilters((p) => ({ ...p, estado: e.target.value }))}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="">Todos</option>
            <option value="PROCESADO">Procesado</option>
            <option value="ERROR">Error</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="DESCARGADO">Descargado</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={() => setFilters({ desde: '', hasta: '', estado: '' })}
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
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Empresa</th>
                <th className="px-6 py-4">Periodo</th>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-4"><div className="h-4 w-full rounded bg-gray-100 dark:bg-gray-700" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-xs text-gray-400 italic">
                    No se encontraron reportes generados.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id_reporte} className="transition hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 font-mono text-xs text-gray-400">#{r.id_reporte}</td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900 dark:text-white">{r.empresa_nombre}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {r.gestion}
                      {r.trimestre ? <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500 dark:bg-gray-700">T{r.trimestre}</span> : ''}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">{formatFechaInforme(r)}</td>
                    <td className="px-6 py-4"><StatusBadge status={r.estado_procesamiento} /></td>
                    <td className="px-6 py-4">
                      {r.url_pdf ? (
                        <a
                          href={r.url_pdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-xl bg-brand-500 px-4 py-2 text-xs font-bold text-white hover:bg-brand-600"
                        >
                          Ver
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
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
              {filtered.length} de {data.count} reportes
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
