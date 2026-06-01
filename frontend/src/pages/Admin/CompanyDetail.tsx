import React, { useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { useApi } from '../../hooks/useApi';
import { getEmpresaById, getReportesByEmpresa, getEmpresas } from '../../services/apiServices';
import type { Empresa, ReporteFinanciero, PaginatedResponse } from '../../types/api';

// ── Estado badge ────────────────────────────────────────────────
const EstadoBadge: React.FC<{ estado: string }> = ({ estado }) => {
  const styles: Record<string, string> = {
    PROCESADO: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    PENDIENTE: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    DESCARGADO: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    ERROR: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${styles[estado] ?? 'bg-gray-100 text-gray-600'}`}>
      {estado}
    </span>
  );
};

// ── Info Row ────────────────────────────────────────────────────
const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex items-start gap-4 py-4 border-b border-gray-100 dark:border-gray-700 last:border-0">
    <span className="w-40 shrink-0 text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</span>
    <span className="text-sm text-gray-900 dark:text-white font-medium">{value ?? '—'}</span>
  </div>
);

// ── Company Detail ──────────────────────────────────────────────
const CompanyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const empresaId = Number(id);
  const [page, setPage] = useState(1);

  // 1. Datos de la empresa
  const { data: empresa, isLoading: empLoading, error: empError } = useApi<Empresa>(
    () => getEmpresaById(empresaId),
    [empresaId]
  );

  // 2. Historial de reportes
  const fetchReportes = useCallback(
    () => getReportesByEmpresa(empresaId, { page, page_size: 10 }),
    [empresaId, page]
  );

  const { data: reportesData, isLoading: repLoading } = useApi<PaginatedResponse<ReporteFinanciero>>(
    fetchReportes,
    [fetchReportes]
  );

  // 3. Lista para navegación rápida (Quick Selector)
  const { data: allCompanies } = useApi<PaginatedResponse<Empresa>>(
    () => getEmpresas({ page_size: 100 }), 
    []
  );

  const reportes = reportesData?.results ?? [];
  const totalReportes = reportesData?.count ?? 0;
  const totalPages = Math.ceil(totalReportes / 10);

  const handleCompanyChange = (newId: string) => {
    navigate(`/admin/companies/${newId}`);
    setPage(1);
  };

  if (empError) {
    return (
      <div className="p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 text-red-500 mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Error al cargar la empresa</h2>
        <p className="text-gray-500 mb-6">{empError}</p>
        <Link to="/admin/companies" className="px-6 py-2.5 bg-brand-500 text-white rounded-xl font-bold text-sm">Volver al listado</Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
            <nav className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                <Link to="/admin/companies" className="hover:text-brand-500 transition">Directorio</Link>
                <span>/</span>
                <span className="text-brand-500">Detalle</span>
            </nav>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                {empLoading ? <div className="h-9 w-64 bg-gray-100 dark:bg-gray-700 animate-pulse rounded-lg" /> : empresa?.nombre}
                {empresa && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-md border ${empresa.activa ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5' : 'border-gray-500/20 text-gray-500 bg-gray-500/5'}`}>
                        {empresa.activa ? 'ACTIVA' : 'INACTIVA'}
                    </span>
                )}
            </h1>
        </div>

        <div className="flex items-center gap-4">
            <div className="relative">
                <label className="absolute -top-2 left-3 px-1 bg-white dark:bg-gray-900 text-[9px] font-black text-gray-400 uppercase tracking-tighter">Cambiar Empresa</label>
                <select 
                    value={id} 
                    onChange={(e) => handleCompanyChange(e.target.value)}
                    className="appearance-none rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pl-4 pr-10 py-3 text-sm font-bold text-gray-700 dark:text-gray-200 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all cursor-pointer"
                >
                    {allCompanies?.results.map(c => (
                        <option key={c.id_empresa} value={c.id_empresa}>{c.nombre}</option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
            </div>
            {empresa && (
                <button 
                    onClick={() => navigate(`/analyst/indicators?empresa=${empresa.id_empresa}`)}
                    className="px-6 py-3 bg-brand-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-brand-500/20 hover:bg-brand-600 active:scale-95 transition-all"
                >
                    Analizar Gráficos
                </button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Info Card */}
        <div className="lg:col-span-1 space-y-6">
            <div className="rounded-3xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 shadow-sm">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Información General</h3>
                <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                    {empLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="py-4 animate-pulse"><div className="h-4 w-full bg-gray-100 dark:bg-gray-700 rounded" /></div>
                        ))
                    ) : empresa ? (
                        <>
                            <InfoRow label="Código BBV" value={<span className="font-mono text-brand-500 bg-brand-500/5 px-2 py-0.5 rounded">{empresa.codigo_bbv}</span>} />
                            <InfoRow label="Sigla" value={empresa.sigla} />
                            <InfoRow label="Sector" value={<span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-xs">{empresa.sector_nombre}</span>} />
                            <InfoRow label="Sitio Web" value={
                                empresa.sitio_web ? (
                                    <a href={empresa.sitio_web} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate block max-w-[150px]">
                                        {empresa.sitio_web.replace('https://', '').replace('http://', '')}
                                    </a>
                                ) : null
                            } />
                            <div className="py-6">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Descripción</label>
                                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed italic">
                                    {empresa.descripcion || 'Sin descripción registrada.'}
                                </p>
                            </div>
                        </>
                    ) : null}
                </div>
            </div>
        </div>

        {/* Report History */}
        <div className="lg:col-span-2 space-y-6">
            <div className="rounded-3xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Historial de Reportes</h3>
                    <span className="text-[10px] font-bold text-gray-400">{totalReportes} registros encontrados</span>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <tr>
                                <th className="px-8 py-4">Gestión</th>
                                <th className="px-8 py-4 text-center">Periodo</th>
                                <th className="px-8 py-4">Estado</th>
                                <th className="px-8 py-4">Actualizado</th>
                                <th className="px-8 py-4 text-right">Archivo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                            {repLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse"><td colSpan={5} className="px-8 py-5"><div className="h-4 w-full bg-gray-100 dark:bg-gray-700 rounded" /></td></tr>
                                ))
                            ) : reportes.length === 0 ? (
                                <tr><td colSpan={5} className="px-8 py-20 text-center text-gray-400 italic">No hay reportes financieros registrados para esta empresa.</td></tr>
                            ) : (
                                reportes.map((r) => (
                                    <tr key={r.id_reporte} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-all">
                                        <td className="px-8 py-5 font-bold text-gray-900 dark:text-white">{r.gestion}</td>
                                        <td className="px-8 py-5 text-center">
                                            <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-[10px] font-bold text-gray-500">
                                                {r.trimestre ? `T${r.trimestre}` : 'ANUAL'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5"><EstadoBadge estado={r.estado_procesamiento} /></td>
                                        <td className="px-8 py-5 text-xs text-gray-500">
                                            {r.updated_at ? new Date(r.updated_at).toLocaleDateString('es-BO') : '—'}
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            {r.url_pdf ? (
                                                <a href={r.url_pdf} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-brand-500 hover:text-brand-600 font-bold text-xs underline decoration-2 underline-offset-4">
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                                    PDF
                                                </a>
                                            ) : '—'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!repLoading && totalPages > 1 && (
                    <div className="px-8 py-5 bg-gray-50/50 dark:bg-gray-900/30 border-t border-gray-50 dark:border-gray-700 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-gray-400">Página {page} de {totalPages}</span>
                        <div className="flex gap-2">
                            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[10px] font-black uppercase tracking-widest disabled:opacity-30 hover:shadow-md transition-all">Anterior</button>
                            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[10px] font-black uppercase tracking-widest disabled:opacity-30 hover:shadow-md transition-all">Siguiente</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDetail;
