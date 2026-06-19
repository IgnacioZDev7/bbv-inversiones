import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useApi } from '../../hooks/useApi';
import { getAllEmpresas, getAllSectores, getReportes } from '../../services/apiServices';
import type { Empresa, SectorEmpresa, ReporteFinanciero } from '../../types/api';

const WATCHLIST_KEY = 'bbv-investor-watchlist';

const readWatchlist = (): number[] => {
  try {
    const raw = localStorage.getItem(WATCHLIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => Number.isFinite(v)) : [];
  } catch {
    return [];
  }
};

export default function InvestorCompanies() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');
  const [watchlistIds, setWatchlistIds] = useState<number[]>(readWatchlist);

  const { data: empresas, isLoading: empLoading } = useApi<Empresa[]>(() => getAllEmpresas(), []);
  const { data: sectores } = useApi<SectorEmpresa[]>(() => getAllSectores(), []);
  const { data: reportes } = useApi<ReporteFinanciero[]>(() => getReportes({ page_size: 200 }).then((r) => r.results), []);

  const empresasConReportes = useMemo(() => new Set((reportes ?? []).map((r) => r.empresa)), [reportes]);

  const filtered = useMemo(() => {
    let list = empresas ?? [];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) => c.nombre.toLowerCase().includes(q) || c.codigo_bbv.toLowerCase().includes(q),
      );
    }
    if (sectorFilter) {
      list = list.filter((c) => c.sector === Number(sectorFilter));
    }
    return list;
  }, [empresas, search, sectorFilter]);

  const toggleWatchlist = (id: number) => {
    const next = watchlistIds.includes(id)
      ? watchlistIds.filter((w) => w !== id)
      : [...watchlistIds, id];
    setWatchlistIds(next);
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(next));
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">Inversionista</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">Empresas</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
          Explora empresas listadas, filtra por sector y agrega a tu watchlist para seguimiento.
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Buscar por nombre o código BBV..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
          />
        </div>
        <div className="w-full sm:w-64">
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
          >
            <option value="">Todos los sectores</option>
            {sectores?.map((s) => (
              <option key={s.id_sector} value={s.id_sector}>{s.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {empLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800 h-28" />
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-xs text-gray-400 italic">No se encontraron empresas.</p>
          </div>
        ) : (
          filtered.map((c) => {
            const hasReports = empresasConReportes.has(c.id_empresa);
            const inWatchlist = watchlistIds.includes(c.id_empresa);
            return (
              <div
                key={c.id_empresa}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-white/[0.03]"
              >
                <div className="flex items-start justify-between">
                  <button
                    onClick={() => navigate(`/company/${c.id_empresa}`)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{c.nombre}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {c.codigo_bbv}{c.sigla ? ` · ${c.sigla}` : ''}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{c.sector_nombre}</p>
                  </button>
                  <button
                    onClick={() => toggleWatchlist(c.id_empresa)}
                    className={`ml-3 shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                      inWatchlist
                        ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400'
                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400'
                    }`}
                  >
                    {inWatchlist ? 'Siguiendo' : 'Seguir'}
                  </button>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  {hasReports && (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                      Con datos
                    </span>
                  )}
                  {!c.activa && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                      Inactiva
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
