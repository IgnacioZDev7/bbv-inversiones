import React, { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { getReportes, getEmpresas, updateReporte, deleteReporte, ejecutarPipeline } from '../../services/apiServices';
import type { ReporteFinanciero, PaginatedResponse, Empresa } from '../../types/api';

// --- Formateador de Fecha ---
const formatDateTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// --- Badge de Estado ---
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    'PROCESADO': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
    'ERROR': 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
    'PENDIENTE': 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
    'DESCARGADO': 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
};

export default function ProcessAudit() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    empresa: '',
    gestion: '',
    estado_procesamiento: ''
  });
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // 1. Obtener empresas para el filtro
  const { data: companiesData } = useApi<PaginatedResponse<Empresa>>(
    () => getEmpresas({ page_size: 200 }), 
    []
  );

  // 2. Obtener reportes con filtros y paginación
  const { data, isLoading, refetch } = useApi<PaginatedResponse<ReporteFinanciero>>(
    () => getReportes({
      page,
      page_size: 10,
      empresa: filters.empresa ? Number(filters.empresa) : undefined,
      gestion: filters.gestion ? Number(filters.gestion) : undefined,
      estado_procesamiento: filters.estado_procesamiento || undefined,
    }),
    [page, filters]
  );

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1); // Resetear a la primera página al filtrar
  };

  const clearFilters = () => {
    setFilters({ empresa: '', gestion: '', estado_procesamiento: '' });
    setPage(1);
  };

  const showActionMsg = (msg: string) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(null), 3000);
  };

  const handleRetry = async (reporte: ReporteFinanciero) => {
    setActionLoading(reporte.id_reporte);
    try {
      await updateReporte(reporte.id_reporte, { estado_procesamiento: 'PENDIENTE' });
      showActionMsg(`Reporte #${reporte.id_reporte} marcado como pendiente para reintentar.`);
      refetch();
    } catch {
      showActionMsg('Error al reintentar el reporte.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReprocess = async (reporte: ReporteFinanciero) => {
    if (!window.confirm(`¿Reprocesar reporte de ${reporte.empresa_nombre} (${reporte.gestion})?`)) return;
    setActionLoading(reporte.id_reporte);
    try {
      await ejecutarPipeline(reporte.empresa, reporte.gestion, reporte.trimestre || 1);
      showActionMsg(`Pipeline ejecutado para ${reporte.empresa_nombre} (${reporte.gestion}).`);
      refetch();
    } catch {
      showActionMsg('Error al ejecutar el pipeline.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (reporte: ReporteFinanciero) => {
    if (!window.confirm(`¿Eliminar reporte #${reporte.id_reporte} de ${reporte.empresa_nombre}?`)) return;
    setActionLoading(reporte.id_reporte);
    try {
      await deleteReporte(reporte.id_reporte);
      showActionMsg(`Reporte #${reporte.id_reporte} eliminado.`);
      refetch();
    } catch {
      showActionMsg('Error al eliminar el reporte.');
    } finally {
      setActionLoading(null);
    }
  };

  const totalPages = data ? Math.ceil(data.count / 10) : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Auditoría de Procesos</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Historial completo de procesamiento de reportes financieros
        </p>
      </div>

      {/* Barra de Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Empresa</label>
          <select
            name="empresa"
            value={filters.empresa}
            onChange={handleFilterChange}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
          >
            <option value="">Todas las empresas</option>
            {companiesData?.results.map(emp => (
              <option key={emp.id_empresa} value={emp.id_empresa}>{emp.nombre}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Gestión (Año)</label>
          <input
            type="number"
            name="gestion"
            placeholder="Ej: 2024"
            value={filters.gestion}
            onChange={handleFilterChange}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Estado</label>
          <select
            name="estado_procesamiento"
            value={filters.estado_procesamiento}
            onChange={handleFilterChange}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
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
            className="w-full rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-bold text-gray-700 transition-all hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            Limpiar Filtros
          </button>
        </div>
      </div>

      {/* Mensaje de Acción */}
      {actionMsg && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400">
          {actionMsg}
        </div>
      )}

      {/* Tabla de Resultados */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-medium">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Empresa</th>
                <th className="px-6 py-4">Periodo</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Actualizado</th>
                <th className="px-6 py-4">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-4"><div className="h-4 w-full bg-gray-100 dark:bg-gray-700 rounded" /></td>
                  </tr>
                ))
              ) : data?.results.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">
                    No se encontraron reportes que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                data?.results.map((reporte) => (
                  <tr key={reporte.id_reporte} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    <td className="px-6 py-4 font-mono text-xs text-gray-400">#{reporte.id_reporte}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">{reporte.empresa_nombre}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600 dark:text-gray-300">{reporte.gestion}</span>
                      <span className="ml-2 text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-500">
                        T{reporte.trimestre || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={reporte.estado_procesamiento} />
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {formatDateTime(reporte.updated_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <a 
                          href={reporte.url_pdf} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-brand-500 hover:text-brand-600 text-xs font-bold underline"
                        >
                          Ver PDF
                        </a>
                        {reporte.estado_procesamiento === 'ERROR' && (
                          <button
                            onClick={() => handleRetry(reporte)}
                            disabled={actionLoading === reporte.id_reporte}
                            className="rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 disabled:opacity-50"
                          >
                            Reintentar
                          </button>
                        )}
                        <button
                          onClick={() => handleReprocess(reporte)}
                          disabled={actionLoading === reporte.id_reporte}
                          className="rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 disabled:opacity-50"
                        >
                          Reprocesar
                        </button>
                        <button
                          onClick={() => handleDelete(reporte)}
                          disabled={actionLoading === reporte.id_reporte}
                          className="rounded-xl bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 disabled:opacity-50"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {data && data.count > 0 && (
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/30 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Mostrando {data.results.length} de {data.count} reportes
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1 || isLoading}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-medium disabled:opacity-50 transition-all hover:bg-gray-50"
              >
                Anterior
              </button>
              <div className="flex items-center px-4 text-xs font-bold text-gray-600 dark:text-gray-400">
                Página {page} de {totalPages}
              </div>
              <button
                disabled={page >= totalPages || isLoading}
                onClick={() => setPage(p => p + 1)}
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
}
