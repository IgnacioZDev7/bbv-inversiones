import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useApi } from '../../hooks/useApi';
import { getReportes } from '../../services/apiServices';
import type { ReporteFinanciero, PaginatedResponse } from '../../types/api';
import { DocsIcon, AlertIcon, CheckCircleIcon, TimeIcon } from '../../icons';
import SpotlightCard from '../../components/common/SpotlightCard';
import GradientText from '../../components/common/GradientText';

const statusBadge = (status: string) => {
  const styles: Record<string, string> = {
    PROCESADO: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
    ERROR: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
    PENDIENTE: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
    DESCARGADO: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
};

export default function AuditorDashboard() {
  const navigate = useNavigate();
  const { data, isLoading } = useApi<PaginatedResponse<ReporteFinanciero>>(
    () => getReportes({ page_size: 100 }),
    []
  );

  const allReports = data?.results ?? [];

  const stats = useMemo(() => {
    const total = allReports.length;
    const errors = allReports.filter((r) => r.estado_procesamiento === 'ERROR').length;
    const processed = allReports.filter((r) => r.estado_procesamiento === 'PROCESADO').length;
    const successRate = total > 0 ? Math.round((processed / total) * 100) : 0;
    const today = new Date().toISOString().slice(0, 10);
    const todayCount = allReports.filter((r) => r.updated_at?.startsWith(today)).length;
    return { total, errors, successRate, todayCount };
  }, [allReports]);

  const latestReports = useMemo(
    () => [...allReports].slice(0, 10),
    [allReports]
  );

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">Auditoría</p>
        <h1 className="mt-1 text-2xl font-bold">
          <GradientText colors={['#10b981', '#34d399', '#10b981']}>Dashboard de Auditor</GradientText>
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
          Monitoreo de procesos, detección de errores y control de calidad de reportes financieros.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800 h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SpotlightCard className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
              <DocsIcon className="size-6 text-gray-700 dark:text-white/90" />
            </div>
            <p className="mt-5 text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Total reportes auditados</p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          </SpotlightCard>
          <SpotlightCard className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 dark:bg-red-500/10">
              <AlertIcon className="size-6 text-red-500" />
            </div>
            <p className="mt-5 text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Errores detectados</p>
            <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">{stats.errors}</p>
          </SpotlightCard>
          <SpotlightCard className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
              <CheckCircleIcon className="size-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="mt-5 text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Tasa de éxito</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.successRate}%</p>
          </SpotlightCard>
          <SpotlightCard className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/10">
              <TimeIcon className="size-6 text-brand-500" />
            </div>
            <p className="mt-5 text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Procesos hoy</p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{stats.todayCount}</p>
          </SpotlightCard>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_280px]">
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-700">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Actividad reciente</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Últimos 10 reportes</p>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse px-5 py-4">
                  <div className="h-4 w-48 rounded bg-gray-100 dark:bg-gray-700" />
                </div>
              ))
            ) : latestReports.length === 0 ? (
              <div className="px-5 py-8 text-center text-xs text-gray-400 italic">
                No hay actividad registrada.
              </div>
            ) : (
              latestReports.map((r) => (
                <div key={r.id_reporte} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{r.empresa_nombre}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Gestión {r.gestion} · T{r.trimestre ?? '—'}
                    </p>
                  </div>
                  {statusBadge(r.estado_procesamiento)}
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Acceso rápido</h2>
          <div className="space-y-2">
            {[
              { label: 'Historial de procesos', path: '/auditor/process-history' },
              { label: 'Reportes generados', path: '/auditor/generated-reports' },
              { label: 'Logs del sistema', path: '/auditor/logs' },
            ].map((link) => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className="w-full rounded-xl bg-gray-50 px-4 py-2.5 text-left text-xs font-bold text-gray-700 transition hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {link.label}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
