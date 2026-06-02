import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useApi } from '../../hooks/useApi';
import { getAllEmpresas, getAllReportes } from '../../services/apiServices';
import type { Empresa, ReporteFinanciero } from '../../types/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip,
} from 'recharts';

const IconBuilding = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);
const IconDocument = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);
const IconChart = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);
const IconClock = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  isLoading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, isLoading }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{title}</p>
        {isLoading ? (
          <div className="mt-2 h-7 w-16 rounded-md bg-gray-100 dark:bg-gray-700 animate-pulse" />
        ) : (
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        )}
      </div>
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color} text-white`}>
        {icon}
      </div>
    </div>
  </div>
);

export default function AnalystDashboard() {
  const navigate = useNavigate();

  const { data: empresas, isLoading: empLoading } = useApi<Empresa[]>(() => getAllEmpresas(), []);
  const { data: reportes, isLoading: repLoading } = useApi<ReporteFinanciero[]>(() => getAllReportes({ page_size: 100 }), []);

  const processedReports = useMemo(() => (reportes ?? []).filter((r) => r.estado_procesamiento === 'PROCESADO'), [reportes]);
  const erroredReports = useMemo(() => (reportes ?? []).filter((r) => r.estado_procesamiento === 'ERROR'), [reportes]);
  const lastUpdate = useMemo(() => {
    if (!reportes || reportes.length === 0) return '—';
    const dates = reportes.map((r) => r.updated_at).filter(Boolean) as string[];
    if (dates.length === 0) return '—';
    const max = dates.sort().reverse()[0];
    return new Date(max).toLocaleDateString('es-BO', { year: 'numeric', month: 'short', day: 'numeric' });
  }, [reportes]);

  // Reportes procesados por mes
  const reportesPorMes = useMemo(() => {
    const months: Record<string, number> = {};
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months[key] = 0;
    }
    processedReports.forEach((r) => {
      const date = r.created_at ? new Date(r.created_at) : null;
      if (date) {
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (months[key] !== undefined) months[key]++;
      }
    });
    return Object.entries(months).map(([label, cantidad]) => ({ label, cantidad }));
  }, [processedReports]);

  const loading = empLoading || repLoading;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400">Analista</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">Dashboard de análisis</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
          Visión general del estado de procesamiento y acceso rápido a empresas.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Empresas disponibles" value={empresas?.length ?? 0} icon={<IconBuilding />} color="bg-blue-600" isLoading={loading} />
        <StatCard title="Reportes procesados" value={processedReports.length} icon={<IconDocument />} color="bg-emerald-600" isLoading={loading} />
        <StatCard title="Indicadores calculados" value={`${processedReports.length > 0 ? Math.min(processedReports.length * 5, 50) : 0}`} icon={<IconChart />} color="bg-violet-600" isLoading={loading} />
        <StatCard title="Última actualización" value={lastUpdate} icon={<IconClock />} color="bg-amber-500" isLoading={loading} />
      </div>

      {/* Quick actions */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="mb-4 text-sm font-bold text-gray-900 dark:text-white">Acciones rápidas</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate('/analyst/companies')}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            <IconBuilding />
            Analizar empresa
          </button>
          <button
            onClick={() => navigate('/analyst/reports')}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
          >
            <IconDocument />
            Procesar reporte
          </button>
          <button
            onClick={() => navigate('/analyst/pipeline')}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-violet-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Ejecutar pipeline
          </button>
        </div>
      </section>

      {/* Chart */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="mb-4 text-sm font-bold text-gray-900 dark:text-white">Evolución de reportes procesados</h2>
        <div className="h-[250px] sm:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={reportesPorMes} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="cantidad" name="Reportes" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Resumen */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-800 dark:bg-emerald-500/10">
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Reportes OK</p>
          <p className="mt-1 text-3xl font-black text-emerald-800 dark:text-emerald-200">{processedReports.length}</p>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-800 dark:bg-red-500/10">
          <p className="text-xs font-bold uppercase tracking-wide text-red-700 dark:text-red-300">Reportes con error</p>
          <p className="mt-1 text-3xl font-black text-red-800 dark:text-red-200">{erroredReports.length}</p>
        </div>
      </div>
    </div>
  );
}
