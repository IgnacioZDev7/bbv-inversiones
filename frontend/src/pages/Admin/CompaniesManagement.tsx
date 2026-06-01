import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useApi } from '../../hooks/useApi';
import { getEmpresas, getSectores } from '../../services/apiServices';
import type { Empresa, PaginatedResponse, SectorEmpresa } from '../../types/api';

// ── Badges de estado ────────────────────────────────────────────
const StatusBadge: React.FC<{ activa: boolean }> = ({ activa }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
      activa
        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
    }`}
  >
    <span className={`h-1.5 w-1.5 rounded-full ${activa ? 'bg-emerald-500' : 'bg-gray-400'}`} />
    {activa ? 'Activa' : 'Inactiva'}
  </span>
);

// ── Skeleton row ────────────────────────────────────────────────
const SkeletonRow: React.FC = () => (
  <tr>
    {[1, 2, 3, 4, 5].map((i) => (
      <td key={i} className="px-6 py-4">
        <div className="h-4 rounded bg-gray-100 dark:bg-gray-700 animate-pulse" />
      </td>
    ))}
  </tr>
);

// ── Companies Management ────────────────────────────────────────
const CompaniesManagement: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState<number | ''>('');
  const [page, setPage] = useState(1);

  // Debounce para la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Sectores para el filtro desplegable
  const { data: sectoresData } = useApi<PaginatedResponse<SectorEmpresa>>(
    () => getSectores(),
    []
  );

  // Empresas paginadas con filtros (usando backend search)
  const fetchEmpresas = useCallback(
    () =>
      getEmpresas({
        sector: sectorFilter !== '' ? sectorFilter : undefined,
        search: debouncedSearch || undefined,
        page,
        page_size: 15,
      }),
    [sectorFilter, debouncedSearch, page]
  );

  const { data, isLoading, error } = useApi<PaginatedResponse<Empresa>>(fetchEmpresas, [fetchEmpresas]);

  const empresas = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / 15);

  const handleSectorChange = (val: string) => {
    setSectorFilter(val === '' ? '' : Number(val));
    setPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Directorio de Empresas</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {isLoading ? 'Cargando registros…' : `${totalCount} entidad${totalCount !== 1 ? 'es' : ''} encontrada${totalCount !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="relative flex-1">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre, código o sigla…"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 py-2.5 pl-9 pr-4 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
          />
        </div>
        <select
          value={sectorFilter}
          onChange={(e) => handleSectorChange(e.target.value)}
          className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500/20 outline-none transition-all min-w-[200px]"
        >
          <option value="">Todos los sectores</option>
          {sectoresData?.results.map((s) => (
            <option key={s.id_sector} value={s.id_sector}>
              {s.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 p-4 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Tabla */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                {['Empresa', 'Código BBV', 'Sigla', 'Sector', 'Estado'].map((h) => (
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
              {isLoading
                ? Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)
                : empresas.length === 0
                ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-400 italic">
                      No se encontraron empresas con los criterios de búsqueda.
                    </td>
                  </tr>
                )
                : empresas.map((emp) => (
                  <tr
                    key={emp.id_empresa}
                    onClick={() => navigate(`/admin/companies/${emp.id_empresa}`)}
                    className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 dark:text-white">{emp.nombre}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-500 dark:text-gray-400">
                      {emp.codigo_bbv}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {emp.sigla ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300">
                        {emp.sector_nombre}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge activa={emp.activa} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700 px-6 py-4 bg-gray-50/50 dark:bg-gray-900/30">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Página {page} de {totalPages}
            </span>
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
    </div>
  );
};

export default CompaniesManagement;
