import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useApi } from '../../hooks/useApi';
import { getAllEmpresas, getAllReportes } from '../../services/apiServices';
import type { Empresa, ReporteFinanciero } from '../../types/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartTooltip,
} from 'recharts';

const WATCHLIST_STORAGE_KEY = 'bbv-investor-watchlist';

const readWatchlist = (): number[] => {
  try {
    const raw = localStorage.getItem(WATCHLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => Number.isFinite(v)) : [];
  } catch {
    return [];
  }
};

export default function InvestorDashboard() {
  const navigate = useNavigate();
  const [watchlistIds, setWatchlistIds] = useState<number[]>(readWatchlist);

  const { data: empresas, isLoading: empLoading } = useApi<Empresa[]>(() => getAllEmpresas(), []);
  const { data: reportes, isLoading: repLoading } = useApi<ReporteFinanciero[]>(() => getAllReportes({ page_size: 100 }), []);

  const processedReports = useMemo(() => (reportes ?? []).filter((r) => r.estado_procesamiento === 'PROCESADO'), [reportes]);

  // Watchlist companies
  const watchlistCompanies = useMemo(
    () => (empresas ?? []).filter((c) => watchlistIds.includes(c.id_empresa)),
    [empresas, watchlistIds],
  );

  // Empresas con reportes procesados = "recomendadas"
  const companiesWithReports = useMemo(() => {
    const ids = new Set(processedReports.map((r) => r.empresa));
    return (empresas ?? []).filter((c) => ids.has(c.id_empresa));
  }, [empresas, processedReports]);

  const removeFromWatchlist = (id: number) => {
    const next = watchlistIds.filter((w) => w !== id);
    setWatchlistIds(next);
    localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(next));
  };

  // Últimos reportes globales
  const latestReports = useMemo(
    () => [...processedReports].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    ).slice(0, 5),
    [processedReports],
  );

  // Resumen de mercado: empresas con reportes por sector
  const marketData = useMemo(() => {
    const map: Record<string, number> = {};
    companiesWithReports.forEach((c) => {
      const sector = c.sector_nombre || 'Otros';
      map[sector] = (map[sector] || 0) + 1;
    });
    return Object.entries(map).map(([sector, count]) => ({ sector, count }));
  }, [companiesWithReports]);

  const loading = empLoading || repLoading;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">Inversionista</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">Dashboard de inversión</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
          Resumen del mercado y empresas en seguimiento. Selecciona una empresa para ver su análisis detallado.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">En seguimiento</p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{watchlistCompanies.length}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Empresas con datos</p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{companiesWithReports.length}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Reportes disponibles</p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{processedReports.length}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_1fr]">
        {/* Watchlist */}
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-700">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Watchlist</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Empresas que sigues</p>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {watchlistCompanies.length === 0 ? (
              <div className="px-5 py-8 text-center text-xs text-gray-400 italic">
                No tienes empresas en seguimiento. Explora empresas y agrégalas a tu watchlist.
              </div>
            ) : (
              watchlistCompanies.map((c) => (
                <div key={c.id_empresa} className="flex items-center justify-between px-5 py-3">
                  <button
                    onClick={() => navigate(`/company/${c.id_empresa}`)}
                    className="text-left hover:text-brand-500 transition-colors"
                  >
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{c.nombre}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{c.codigo_bbv} · {c.sector_nombre}</p>
                  </button>
                  <button
                    onClick={() => removeFromWatchlist(c.id_empresa)}
                    className="text-xs text-red-500 hover:text-red-700 transition-colors"
                  >
                    Quitar
                  </button>
                </div>
              ))
            )}
          </div>
          <div className="border-t border-gray-100 px-5 py-3 dark:border-gray-700">
            <button
              onClick={() => navigate('/investor/companies')}
              className="w-full rounded-lg bg-gray-50 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              Explorar empresas
            </button>
          </div>
        </section>

        <div className="space-y-6">
          {/* Empresas recomendadas */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <h2 className="mb-3 text-sm font-bold text-gray-900 dark:text-white">Empresas recomendadas</h2>
            {companiesWithReports.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No hay empresas con datos financieros disponibles.</p>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {companiesWithReports.slice(0, 6).map((c) => (
                  <button
                    key={c.id_empresa}
                    onClick={() => navigate(`/company/${c.id_empresa}`)}
                    className="rounded-xl border border-gray-100 p-3 text-left transition hover:border-brand-200 hover:bg-brand-50/30 dark:border-gray-700 dark:hover:border-brand-500/30 dark:hover:bg-brand-500/5"
                  >
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{c.nombre}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{c.codigo_bbv}</p>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Gráfico resumen de mercado */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <h2 className="mb-4 text-sm font-bold text-gray-900 dark:text-white">Resumen de mercado por sector</h2>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={marketData} margin={{ top: 4, right: 4, left: -12, bottom: 0 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="sector" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
                  <RechartTooltip />
                  <Bar dataKey="count" name="Empresas" fill="#2563eb" radius={[0, 4, 4, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Últimos reportes */}
          <section className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-700">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Últimos reportes</h2>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {latestReports.length === 0 ? (
                <div className="px-5 py-8 text-center text-xs text-gray-400 italic">No hay reportes disponibles.</div>
              ) : (
                latestReports.map((r) => (
                  <div key={r.id_reporte} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{r.empresa_nombre}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{r.gestion}{r.trimestre ? ` T${r.trimestre}` : ''}</p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                      {r.estado_procesamiento}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
