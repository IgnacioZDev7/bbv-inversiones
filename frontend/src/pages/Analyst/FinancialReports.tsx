import { useState, useCallback } from 'react';
import { useApi } from '../../hooks/useApi';
import { getReportes, getAllEmpresas } from '../../services/apiServices';
import type { ReporteFinanciero, PaginatedResponse, Empresa } from '../../types/api';
import { formatFechaInforme } from '../../utils/financialMetrics';

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    PROCESADO: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
    ERROR: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
    PENDIENTE: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
    DESCARGADO: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
};

const SkeletonRow: React.FC = () => (
  <tr>
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <td key={i} className="px-6 py-4">
        <div className="h-4 rounded bg-gray-100 dark:bg-gray-700 animate-pulse" />
      </td>
    ))}
  </tr>
);

const FinancialReports: React.FC = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    empresa: '',
    gestion: '',
    estado_procesamiento: '',
  });

  const { data: empresasData } = useApi<Empresa[]>(() => getAllEmpresas(), []);

  const empresas = empresasData ?? [];

  const fetchReportes = useCallback(
    () =>
      getReportes({
        page,
        page_size: 10,
        empresa: filters.empresa ? Number(filters.empresa) : undefined,
        gestion: filters.gestion ? Number(filters.gestion) : undefined,
        estado_procesamiento: filters.estado_procesamiento || undefined,
      }),
    [page, filters]
  );

  const { data, isLoading, error } = useApi<PaginatedResponse<ReporteFinanciero>>(fetchReportes, [fetchReportes]);

  const reportes = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / 10);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ empresa: '', gestion: '', estado_procesamiento: '' });
    setPage(1);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400">Analista</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">Reportes Financieros</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {isLoading ? 'Cargando\u2026' : `${totalCount} reporte${totalCount !== 1 ? 's' : ''} encontrado${totalCount !== 1 ? 's' : ''}`}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Empresa</label>
          <select
            name="empresa"
            value={filters.empresa}
            onChange={handleFilterChange}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
          >
            <option value="">Todas las empresas</option>
            {empresas.map((emp) => (
              <option key={emp.id_empresa} value={emp.id_empresa}>{emp.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Gesti&oacute;n (A&ntilde;o)</label>
          <input
            type="number"
            name="gestion"
            placeholder="Ej: 2024"
            value={filters.gestion}
            onChange={handleFilterChange}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Estado</label>
          <select
            name="estado_procesamiento"
            value={filters.estado_procesamiento}
            onChange={handleFilterChange}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
          >
            <option value="">Todos los estados</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="DESCARGADO">Descargado</option>
            <option value="PROCESADO">Procesado</option>
            <option value="ERROR">Error</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={clearFilters}
            className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-bold transition-all"
          >
            Limpiar Filtros
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 p-4 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-medium">
              <tr>
                <th className="px-6 py-4">Empresa</th>
                <th className="px-6 py-4">Gesti&oacute;n</th>
                <th className="px-6 py-4">Trimestre</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Fecha del Informe</th>
                <th className="px-6 py-4 text-right">Documento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {isLoading
                ? Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)
                : reportes.length === 0
                ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-400 italic">
                      No se encontraron reportes que coincidan con los filtros.
                    </td>
                  </tr>
                )
                : reportes.map((r) => (
                  <tr key={r.id_reporte} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">{r.empresa_nombre}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{r.gestion}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-500">
                        T{r.trimestre || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={r.estado_procesamiento} />
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {formatFechaInforme(r)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {r.url_pdf ? (
                        <a
                          href={r.url_pdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-xl bg-brand-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-600 transition-all"
                        >
                          Ver PDF
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {!isLoading && totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/30 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Mostrando {reportes.length} de {totalCount} reportes
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1 || isLoading}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-medium disabled:opacity-50 transition-all hover:bg-gray-50"
              >
                Anterior
              </button>
              <div className="flex items-center px-4 text-xs font-bold text-gray-600 dark:text-gray-400">
                P&aacute;gina {page} de {totalPages}
              </div>
              <button
                disabled={page >= totalPages || isLoading}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-medium disabled:opacity-50 transition-all hover:bg-gray-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialReports;
