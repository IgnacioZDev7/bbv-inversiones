import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useApi } from '../../hooks/useApi';
import { getAllEmpresas, getReportes } from '../../services/apiServices';
import type { Empresa, ReporteFinanciero, PaginatedResponse } from '../../types/api';

const SkeletonRow: React.FC = () => (
  <tr>
    {[1, 2, 3, 4, 5].map((i) => (
      <td key={i} className="px-6 py-4">
        <div className="h-4 rounded bg-gray-100 dark:bg-gray-700 animate-pulse" />
      </td>
    ))}
  </tr>
);

const AnalystCompanies: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');

  const { data: empresas, isLoading: empLoading, error: empError } = useApi<Empresa[]>(
    () => getAllEmpresas(),
    []
  );

  const { data: reportesList, isLoading: repLoading } = useApi<PaginatedResponse<ReporteFinanciero>>(
    () => getReportes({ page_size: 500 }),
    []
  );

  const allEmpresas = empresas ?? [];
  const allReportes = reportesList?.results ?? [];

  const empresasConReportes = useMemo(() => {
    const set = new Set<number>();
    allReportes.forEach((r) => set.add(r.empresa));
    return set;
  }, [allReportes]);

  const sectores = useMemo(() => {
    const set = new Set<string>();
    allEmpresas.forEach((e) => e.sector_nombre && set.add(e.sector_nombre));
    return Array.from(set).sort();
  }, [allEmpresas]);

  const filtered = useMemo(() => {
    let result = allEmpresas;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.nombre.toLowerCase().includes(q) ||
          e.codigo_bbv.toLowerCase().includes(q)
      );
    }
    if (sectorFilter) {
      result = result.filter((e) => e.sector_nombre === sectorFilter);
    }
    return result;
  }, [allEmpresas, search, sectorFilter]);

  const loading = empLoading || repLoading;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400">Analista</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">Empresas</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {loading ? 'Cargando\u2026' : `${filtered.length} entidad${filtered.length !== 1 ? 'es' : ''} encontrada${filtered.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="relative flex-1">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre o c&oacute;digo BBV\u2026"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 py-2.5 pl-9 pr-4 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
          />
        </div>
        <select
          value={sectorFilter}
          onChange={(e) => setSectorFilter(e.target.value)}
          className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500/20 outline-none transition-all min-w-[180px]"
        >
          <option value="">Todos los sectores</option>
          {sectores.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {empError && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 p-4 text-sm text-red-700 dark:text-red-400">
          {empError}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                {['Empresa', 'C&oacute;digo BBV', 'Sector', 'Reportes', 'Estado'].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading
                ? Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)
                : filtered.length === 0
                ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-400 italic">
                      No se encontraron empresas con los criterios de b&uacute;squeda.
                    </td>
                  </tr>
                )
                : filtered.map((emp) => (
                  <tr
                    key={emp.id_empresa}
                    onClick={() => navigate(`/company/${emp.id_empresa}`)}
                    className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 dark:text-white">{emp.nombre}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-500 dark:text-gray-400">
                      {emp.codigo_bbv}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300">
                        {emp.sector_nombre}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {empresasConReportes.has(emp.id_empresa) ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Con reportes
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">Sin reportes</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          emp.activa
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${emp.activa ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                        {emp.activa ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalystCompanies;
