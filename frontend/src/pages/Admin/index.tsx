import React, { useMemo } from 'react';
import { useNavigate, Link } from 'react-router';
import { useApi } from '../../hooks/useApi';
import { getDashboardKPIs, getEmpresas, getLatestReportes } from '../../services/apiServices';
import type { DashboardKPIs, Empresa, ReporteFinanciero, PaginatedResponse } from '../../types/api';

// ── Íconos SVG inline ──────────────────────────────────────────
const IconBuilding = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);
const IconTag = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);
const IconDocument = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);
const IconUsers = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

// ── KPI Card ───────────────────────────────────────────────────
interface KpiCardProps {
  title: string;
  value: number | null;
  icon: React.ReactNode;
  color: string;       
  isLoading: boolean;
  onClick?: () => void;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon, color, isLoading, onClick }) => (
  <div
    onClick={onClick}
    className={`relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-6 shadow-sm transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''}`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        {isLoading ? (
          <div className="mt-2 h-9 w-20 rounded-lg bg-gray-100 dark:bg-gray-700 animate-pulse" />
        ) : (
          <p className="mt-1 text-4xl font-bold text-gray-900 dark:text-white">
            {value?.toLocaleString('es-BO') ?? '—'}
          </p>
        )}
      </div>
      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${color} text-white shadow-lg`}>
        {icon}
      </div>
    </div>
    <div className={`absolute bottom-0 left-0 h-1 w-full ${color} opacity-60`} />
  </div>
);

// ── Dashboard General ──────────────────────────────────────────
const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  
  // 1. KPIs
  const { data: kpis, isLoading: kpiLoading } = useApi<DashboardKPIs>(getDashboardKPIs, []);

  // 2. Últimas empresas
  const { data: latestEmpresas, isLoading: empLoading } = useApi<PaginatedResponse<Empresa>>(
    () => getEmpresas({ page_size: 5 }),
    []
  );

  // 3. Últimos reportes
  const { data: latestReportes, isLoading: repLoading } = useApi<PaginatedResponse<ReporteFinanciero>>(
    () => getLatestReportes(5),
    []
  );

  const cards = useMemo(() => [
    {
      title: 'Empresas Registradas',
      value: kpis?.total_empresas ?? null,
      icon: <IconBuilding />,
      color: 'bg-blue-600',
      onClick: () => navigate('/admin/companies'),
    },
    {
      title: 'Sectores',
      value: kpis?.total_sectores ?? null,
      icon: <IconTag />,
      color: 'bg-violet-600',
      onClick: () => navigate('/admin/sectors'),
    },
    {
      title: 'Reportes Financieros',
      value: kpis?.total_reportes ?? null,
      icon: <IconDocument />,
      color: 'bg-emerald-600',
    },
    {
      title: 'Usuarios',
      value: kpis?.total_usuarios ?? null,
      icon: <IconUsers />,
      color: 'bg-amber-500',
      onClick: () => navigate('/admin/users'),
    },
  ], [kpis, navigate]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Panel de Administración</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Control centralizado de BBV Inversiones
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {cards.map((card) => (
          <KpiCard key={card.title} {...card} isLoading={kpiLoading} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tabla Últimas Empresas */}
        <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Últimas Empresas</h2>
            <Link to="/admin/companies" className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-medium">
                <tr>
                  <th className="px-6 py-3">Nombre</th>
                  <th className="px-6 py-3">Código</th>
                  <th className="px-6 py-3 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {empLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-100 dark:bg-gray-700 rounded" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-16 bg-gray-100 dark:bg-gray-700 rounded" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-12 bg-gray-100 dark:bg-gray-700 rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : latestEmpresas?.results.length === 0 ? (
                    <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-400 italic">No hay empresas registradas</td></tr>
                ) : (
                  latestEmpresas?.results.map((emp) => (
                    <tr 
                      key={emp.id_empresa} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition"
                      onClick={() => navigate(`/admin/companies/${emp.id_empresa}`)}
                    >
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{emp.nombre}</td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400 font-mono text-xs">{emp.codigo_bbv}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`inline-block w-2 h-2 rounded-full ${emp.activa ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabla Últimos Reportes */}
        <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Últimos Reportes</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-medium">
                <tr>
                  <th className="px-6 py-3">Empresa</th>
                  <th className="px-6 py-3">Gestión</th>
                  <th className="px-6 py-3 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {repLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-100 dark:bg-gray-700 rounded" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-16 bg-gray-100 dark:bg-gray-700 rounded" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-100 dark:bg-gray-700 rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : latestReportes?.results.length === 0 ? (
                    <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-400 italic">No hay reportes procesados</td></tr>
                ) : (
                  latestReportes?.results.map((rep) => (
                    <tr key={rep.id_reporte} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white truncate max-w-[180px]">
                        {rep.empresa_nombre}
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                        {rep.gestion} {rep.trimestre ? `T${rep.trimestre}` : ''}
                      </td>
                      <td className="px-6 py-4 text-right text-xs font-bold">
                        <span className={
                          rep.estado_procesamiento === 'PROCESADO' ? 'text-emerald-500' :
                          rep.estado_procesamiento === 'ERROR' ? 'text-red-500' :
                          'text-amber-500'
                        }>
                          {rep.estado_procesamiento}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick access */}
      <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
          Acceso Rápido
        </h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate('/admin/companies')}
            className="px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition"
          >
            Ver Empresas →
          </button>
          <button
            onClick={() => navigate('/admin/users')}
            className="px-4 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-sm font-medium hover:bg-amber-100 dark:hover:bg-amber-900/50 transition"
          >
            Gestionar Usuarios →
          </button>
          <button
            onClick={() => navigate('/admin/audit')}
            className="px-4 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm font-medium hover:bg-emerald-100 dark:hover:bg-blue-900/50 transition"
          >
            Auditoría de Procesos →
          </button>
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
