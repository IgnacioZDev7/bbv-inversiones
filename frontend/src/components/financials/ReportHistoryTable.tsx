import { useMemo, useState } from 'react';
import type { ReporteFinanciero } from '../../types/api';
import { formatFechaInforme } from '../../utils/financialMetrics';

interface ReportHistoryTableProps {
  reports: ReporteFinanciero[];
  pageSize?: number;
}

export default function ReportHistoryTable({ reports, pageSize = 8 }: ReportHistoryTableProps) {
  const [page, setPage] = useState(1);
  const [gestionFilter, setGestionFilter] = useState('');
  const [trimestreFilter, setTrimestreFilter] = useState('');

  const gestionOptions = useMemo(
    () => Array.from(new Set(reports.map((r) => r.gestion))).sort((a, b) => b - a),
    [reports],
  );

  const filtered = useMemo(() => {
    return [...reports]
      .filter((r) => (gestionFilter ? r.gestion === Number(gestionFilter) : true))
      .filter((r) => (trimestreFilter ? r.trimestre === Number(trimestreFilter) : true))
      .sort((a, b) => b.gestion - a.gestion || (b.trimestre ?? 0) - (a.trimestre ?? 0));
  }, [reports, gestionFilter, trimestreFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleFilterChange = (setter: (v: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={gestionFilter}
          onChange={(e) => handleFilterChange(setGestionFilter)(e.target.value)}
          className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-brand-500/20"
        >
          <option value="">Todos los años</option>
          {gestionOptions.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <select
          value={trimestreFilter}
          onChange={(e) => handleFilterChange(setTrimestreFilter)(e.target.value)}
          className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-brand-500/20"
        >
          <option value="">Todos los trimestres</option>
          <option value={1}>T1</option>
          <option value={2}>T2</option>
          <option value={3}>T3</option>
          <option value={4}>T4</option>
        </select>
        <span className="text-xs text-gray-400">{filtered.length} registro{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            <tr>
              <th className="px-3 py-2">Gestión</th>
              <th className="px-3 py-2">Periodo</th>
              <th className="px-3 py-2">Fecha del informe</th>
              <th className="px-3 py-2 text-right">Documento</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {pageItems.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-xs italic text-gray-400">
                  No hay reportes que coincidan con el filtro.
                </td>
              </tr>
            ) : (
              pageItems.map((r) => (
                <tr key={r.id_reporte}>
                  <td className="px-3 py-3 font-bold text-gray-900 dark:text-white">{r.gestion}</td>
                  <td className="px-3 py-3 text-gray-500 dark:text-gray-400">
                    {r.trimestre ? `T${r.trimestre}` : 'Anual'}
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-400">{formatFechaInforme(r)}</td>
                  <td className="px-3 py-3 text-right">
                    {r.url_pdf ? (
                      <a
                        href={r.url_pdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-600 transition-all"
                      >
                        Ver PDF
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

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Página {page} de {totalPages}</span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-xs font-bold text-gray-700 dark:text-gray-200 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              ← Anterior
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-xs font-bold text-gray-700 dark:text-gray-200 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
