import { useMemo } from 'react';
import { Link } from 'react-router';
import { useApi } from '../../hooks/useApi';
import { getDashboardData } from '../../services/apiServices';
import type { DashboardData } from '../../services/apiServices';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, AreaChart, Area, Cell,
} from 'recharts';
import SpotlightCard from '../../components/common/SpotlightCard';
import GradientText from '../../components/common/GradientText';

const IconUsers = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);
const IconBuilding = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);
const IconLayers = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);
const IconDatabase = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
  </svg>
);
const IconCheck = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const IconError = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const stateColors: Record<string, string> = {
  PROCESADO: '#10b981',
  PENDIENTE: '#f59e0b',
  DESCARGADO: '#6366f1',
  ERROR: '#ef4444',
};
const stateLabels: Record<string, string> = {
  PROCESADO: 'Procesado',
  PENDIENTE: 'Pendiente',
  DESCARGADO: 'Descargado',
  ERROR: 'Error',
};

const AdminDashboard: React.FC = () => {

  const { data: dashboardData } = useApi<DashboardData>(getDashboardData, []);

  const usersList = dashboardData?.ultimos_usuarios ?? [];
  const latestReports = dashboardData?.ultimos_reportes ?? [];

  const stateDistribution = useMemo(() =>
    (dashboardData?.reportes_por_estado ?? []).map((item) => ({
      name: stateLabels[item.estado] || item.estado,
      value: item.count,
      color: stateColors[item.estado] || '#6b7280',
      raw: item.estado,
    })),
  [dashboardData]);

  const processedInSample = dashboardData?.reportes_procesados ?? 0;
  const errorsInSample = dashboardData?.reportes_con_error ?? 0;

  const kpisList = useMemo(() => [
    { title: 'Usuarios Registrados', value: dashboardData?.total_usuarios, icon: <IconUsers />, color: 'bg-blue-600' },
    { title: 'Empresas Activas', value: dashboardData?.total_empresas, icon: <IconBuilding />, color: 'bg-violet-600' },
    { title: 'Sectores', value: dashboardData?.total_sectores, icon: <IconLayers />, color: 'bg-amber-500' },
    { title: 'Reportes en Sistema', value: dashboardData?.total_reportes, icon: <IconDatabase />, color: 'bg-emerald-600' },
    { title: 'Procesados', value: processedInSample, icon: <IconCheck />, color: 'bg-green-600' },
    { title: 'Con Error', value: errorsInSample, icon: <IconError />, color: 'bg-red-600' },
  ], [dashboardData, processedInSample, errorsInSample]);

  const systemActivity = useMemo(() => [
    { name: 'Lun', processed: 4, errors: 0 },
    { name: 'Mar', processed: 7, errors: 1 },
    { name: 'Mie', processed: 5, errors: 0 },
    { name: 'Jue', processed: 12, errors: 2 },
    { name: 'Vie', processed: 8, errors: 0 },
    { name: 'Sab', processed: 2, errors: 0 },
    { name: 'Dom', processed: 1, errors: 0 },
  ], []);

  const totalReportCount = (dashboardData?.reportes_por_estado ?? []).reduce((s, i) => s + i.count, 0) || 1;

  const loading = !dashboardData;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight">
          <GradientText>Consola de Operaciones</GradientText>
        </h1>
        <p className="text-sm text-gray-500 font-medium mt-1">Métricas de rendimiento y gestión de infraestructura</p>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {kpisList.map((k, idx) => (
          <SpotlightCard
            key={idx}
            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm flex items-center justify-between"
          >
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{k.title}</p>
              <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                {loading ? '...' : k.value?.toLocaleString()}
              </p>
            </div>
            <div className={`h-11 w-11 rounded-xl ${k.color} text-white flex items-center justify-center shadow-lg shadow-current/20`}>
              {k.icon}
            </div>
          </SpotlightCard>
        ))}
      </div>

      {/* ── Row 1: Pipeline + State Distribution ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Activity */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-8">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-8">Flujo de Procesamiento (7 días)</h2>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={systemActivity}>
                <defs>
                  <linearGradient id="colorProc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorErr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="processed" name="Procesados" stroke="#10b981" fillOpacity={1} fill="url(#colorProc)" strokeWidth={3} />
                <Area type="monotone" dataKey="errors" name="Errores" stroke="#ef4444" fillOpacity={1} fill="url(#colorErr)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* State Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-8">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Distribución de Estados</h2>
          <p className="text-[10px] text-gray-400 font-medium mb-6">Basado en {totalReportCount} reportes</p>
          <div className="h-48 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stateDistribution} layout="vertical" barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip formatter={(v) => [`${v} reportes`, 'Cantidad']} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                  {stateDistribution.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Mini legend */}
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-50 dark:border-gray-700">
            {stateDistribution.map((d) => (
              <div key={d.raw} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-[10px] font-bold text-gray-500 uppercase">{d.name}</span>
                <span className="text-[10px] font-bold text-gray-900 dark:text-white">{((d.value / totalReportCount) * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 2: Recent Activity Tables ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usuarios Recientes */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Usuarios Recientes</h2>
            <Link to="/admin/users" className="text-[10px] font-bold text-brand-500 underline uppercase tracking-widest">Gestionar</Link>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {usersList.map((u, idx) => (
              <div key={idx} className="px-8 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-lg bg-gray-100 dark:bg-gray-900 flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-gray-300 shrink-0">
                    {(u.nombre || '?').slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{u.nombre}</p>
                    <p className="text-[10px] text-gray-400 font-medium truncate">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[9px] font-black text-gray-400 uppercase">{u.group_names?.[0] || '—'}</span>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${u.activo ? 'text-emerald-600 bg-emerald-500/10' : 'text-gray-400 bg-gray-100 dark:bg-gray-800'}`}>
                    {u.activo ? 'ACTIVO' : 'INACTIVO'}
                  </span>
                </div>
              </div>
            ))}
            {usersList.length === 0 && (
              <div className="px-8 py-8 text-center text-sm text-gray-400 font-medium">No hay usuarios registrados</div>
            )}
          </div>
        </div>

        {/* Últimos Reportes */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Últimos Reportes</h2>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{latestReports.length} registros</span>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {latestReports.map((r, idx) => (
              <div key={idx} className="px-8 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{r.empresa_nombre}</p>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">
                    Gestión {r.gestion} · T{r.trimestre ?? '—'}
                  </p>
                </div>
                <span
                  className={`ml-3 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                    r.estado_procesamiento === 'PROCESADO'
                      ? 'text-emerald-600 bg-emerald-500/10'
                      : r.estado_procesamiento === 'ERROR'
                        ? 'text-red-600 bg-red-500/10'
                        : r.estado_procesamiento === 'DESCARGADO'
                          ? 'text-indigo-600 bg-indigo-500/10'
                          : 'text-amber-600 bg-amber-500/10'
                  }`}
                >
                  {r.estado_procesamiento}
                </span>
              </div>
            ))}
            {latestReports.length === 0 && (
              <div className="px-8 py-8 text-center text-sm text-gray-400 font-medium">No hay reportes disponibles</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export { AdminDashboard };
export { default as UsersManagement } from './UsersManagement';
export { default as CompaniesManagement } from './CompaniesManagement';
export { default as CompanyDetail } from './CompanyDetail';
export { default as SectorsManagement } from './SectorsManagement';
export { default as ProcessAudit } from './ProcessAudit';
