import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import PageMeta from '../../components/common/PageMeta';
import { getEmpresaById, getReportesByEmpresa } from '../../services/apiServices';
import type { Empresa, ReporteFinanciero } from '../../types/api';
import { toFinancialPoint, formatMoneyCompact, formatPercent } from '../../utils/financialMetrics';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import HistoricalFinancialChart from '../../components/charts/HistoricalFinancialChart';
import ActivoVsPasivo from '../../components/charts/ActivoVsPasivo';
import FinancialRatiosChart from '../../components/charts/FinancialRatiosChart';

interface Metric {
  activos: number;
  pasivos: number;
  patrimonio: number;
  liquidez_corriente: number;
  endeudamiento: number;
}

const mapReporteToMetric = (r: ReporteFinanciero): Metric => {
  const d = r.datos_extraidos_json || {};
  const activo = Number(d.total_activo || 0);
  const pasivo = Number(d.total_pasivo || 0);
  return {
    activos: activo,
    pasivos: pasivo,
    patrimonio: Number(d.total_patrimonio || 0),
    liquidez_corriente: Number(d.total_pasivo_corriente) > 0
      ? Number(d.total_activo_corriente) / Number(d.total_pasivo_corriente)
      : 0,
    endeudamiento: activo > 0 ? pasivo / activo : 0,
  };
};

function MiniKpi({ label, value, trend, color }: { label: string; value: string; trend?: string; color: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 rounded-lg border border-gray-100 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800/50">
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</p>
        <p className={`text-sm font-black leading-tight ${color}`}>{value}</p>
      </div>
      {trend && <span className="shrink-0 text-[9px] font-medium text-gray-400 dark:text-gray-500">{trend}</span>}
    </div>
  );
}

export default function CompanyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const empresaId = Number(id);

  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [reports, setReports] = useState<ReporteFinanciero[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!empresaId) return;
    setLoading(true);
    setError(null);
    Promise.all([
      getEmpresaById(empresaId),
      getReportesByEmpresa(empresaId, { page_size: 50, estado_procesamiento: 'PROCESADO' }),
    ])
      .then(([emp, reportData]) => {
        setEmpresa(emp);
        setReports(reportData.results);
      })
      .catch(() => setError('Error al conectar con la terminal financiera.'))
      .finally(() => setLoading(false));
  }, [empresaId]);

  const { current, previous, points } = useMemo(() => {
    const sorted = [...reports].sort(
      (a, b) => b.gestion - a.gestion || (b.trimestre || 0) - (a.trimestre || 0),
    );
    const chronPoints = [...reports]
      .sort((a, b) => a.gestion - b.gestion || (a.trimestre || 0) - (b.trimestre || 0))
      .map(toFinancialPoint);
    return {
      current: sorted.length > 0 ? mapReporteToMetric(sorted[0]) : null,
      previous: sorted.length > 1 ? mapReporteToMetric(sorted[1]) : null,
      points: chronPoints,
    };
  }, [reports]);

  const trendPatrimonio = useMemo(() => {
    if (!current || !previous || previous.patrimonio === 0) return 0;
    return (current.patrimonio - previous.patrimonio) / previous.patrimonio;
  }, [current, previous]);

  if (error) {
    return (
      <div className="p-8">
        <ErrorState title="Error de Terminal" message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title={`${empresa?.nombre ?? 'Entidad'} | BBV Inversiones`}
        description="Terminal de Análisis Financiero"
      />

      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Header compacto */}
        <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="hidden h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 dark:bg-brand-500/20 sm:flex">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                  {loading
                    ? <div className="h-6 w-48 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                    : empresa?.nombre}
                </h2>
                {!loading && (
                  <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                    AA+
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs font-bold text-gray-400 uppercase tracking-widest">
                {empresa?.codigo_bbv} · {empresa?.sector_nombre}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(-1)}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              CERRAR TERMINAL
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
            ))}
          </div>
        ) : !current ? (
          <EmptyState
            title="Sin Datos Operativos"
            message="No se han encontrado balances procesados para esta entidad en los últimos periodos."
          />
        ) : (
          <div className="animate-fade-in space-y-6">
            {/* KPIs densos estilo Yahoo Finance */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <MiniKpi
                label="Patrimonio"
                value={`Bs ${formatMoneyCompact(current.patrimonio)}`}
                trend={
                  trendPatrimonio !== 0
                    ? `${trendPatrimonio > 0 ? '+' : ''}${(trendPatrimonio * 100).toFixed(1)}%`
                    : 'Estable'
                }
                color={trendPatrimonio >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}
              />
              <MiniKpi
                label="Activo"
                value={`Bs ${formatMoneyCompact(current.activos)}`}
                color="text-blue-600 dark:text-blue-400"
              />
              <MiniKpi
                label="Liquidez"
                value={current.liquidez_corriente.toFixed(2)}
                trend={current.liquidez_corriente >= 1.2 ? 'Saludable' : 'Riesgo'}
                color={current.liquidez_corriente >= 1.2 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}
              />
              <MiniKpi
                label="Endeudamiento"
                value={formatPercent(current.endeudamiento)}
                trend={current.endeudamiento <= 0.6 ? 'Independiente' : 'Apalancado'}
                color={current.endeudamiento <= 0.6 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}
              />
            </div>

            {/* Gráfico principal histórico */}
            <ErrorBoundary componentName="HistoricalFinancialChart">
              <HistoricalFinancialChart reports={reports} companyName={empresa?.nombre} />
            </ErrorBoundary>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ErrorBoundary componentName="ComposicionFinanciera">
                <ActivoVsPasivo data={points} />
              </ErrorBoundary>
              <ErrorBoundary componentName="FinancialRatios">
                <FinancialRatiosChart data={points} />
              </ErrorBoundary>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
