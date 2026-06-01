import { useState, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { useApi } from '../../hooks/useApi';
import { getEmpresas, getReportesByEmpresa } from '../../services/apiServices';
import type { Empresa, PaginatedResponse, ReporteFinanciero } from '../../types/api';

// ── Formateadores ───────────────────────────────────────────────
const fmtBS = (v: number) =>
  new Intl.NumberFormat('es-BO', { notation: 'compact', maximumFractionDigits: 1 }).format(v);

const fmtDecimal = (v: number) => v.toFixed(2);

const tooltipStyle = {
  backgroundColor: 'rgba(15,23,42,0.9)',
  border: 'none',
  borderRadius: '8px',
  color: '#e2e8f0',
  fontSize: '12px',
};

// ── Extraer datos numéricos del JSON del reporte ────────────────
const extractFinancialValue = (datos: Record<string, unknown> | null, key: string): number => {
  if (!datos) return 0;
  const val = datos[key];
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return parseFloat(val) || 0;
  return 0;
};

const toChartPoint = (r: ReporteFinanciero) => {
  const label = r.trimestre ? `${r.gestion} T${r.trimestre}` : `${r.gestion}`;
  const d = r.datos_extraidos_json as Record<string, unknown> | null;
  
  // Claves reales del backend (Balance)
  const activo = extractFinancialValue(d, 'total_activo');
  const pasivo = extractFinancialValue(d, 'total_pasivo');
  const patrimonio = extractFinancialValue(d, 'total_patrimonio');
  const ac = extractFinancialValue(d, 'total_activo_corriente');
  const pc = extractFinancialValue(d, 'total_pasivo_corriente');
  const anc = extractFinancialValue(d, 'total_activo_no_corriente');
  const pnc = extractFinancialValue(d, 'total_pasivo_no_corriente');

  // Indicadores Derivados
  const endeudamiento = activo > 0 ? (pasivo / activo) : 0;
  const capitalTrabajo = ac - pc;

  // Claves para el futuro (Estado de Resultados)
  const ingresos = extractFinancialValue(d, 'ingresos_totales');
  const utilidad = extractFinancialValue(d, 'utilidad_neta');

  return {
    label,
    gestion: r.gestion,
    trimestre: r.trimestre,
    activo,
    pasivo,
    patrimonio,
    ac,
    pc,
    anc,
    pnc,
    endeudamiento,
    capitalTrabajo,
    // Preparado para futuro
    ingresos,
    utilidad,
  };
};

// ── Selector de empresa (dropdown) ─────────────────────────────
const EmpresaSelector: React.FC<{
  empresas: Empresa[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}> = ({ empresas, selectedId, onSelect }) => (
  <select
    value={selectedId ?? ''}
    onChange={(e) => onSelect(Number(e.target.value))}
    className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[260px]"
  >
    <option value="" disabled>Selecciona una empresa…</option>
    {empresas.map((e) => (
      <option key={e.id_empresa} value={e.id_empresa}>
        {e.nombre} ({e.codigo_bbv})
      </option>
    ))}
  </select>
);

// ── Componente gráfico genérico ─────────────────────────────────
const ChartCard: React.FC<{ title: string; children: React.ReactNode; subtitle?: string }> = ({ title, subtitle, children }) => (
  <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-6 flex flex-col h-[320px]">
    <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</h3>
        {subtitle && <p className="text-[10px] text-gray-400 mt-0.5 italic">{subtitle}</p>}
    </div>
    <div className="flex-1 w-full">
        {children}
    </div>
  </div>
);

// ── Dashboard Financiero ────────────────────────────────────────
const Indicators: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<number | null>(
    searchParams.get('empresa') ? Number(searchParams.get('empresa')) : null
  );

  // Lista de empresas para el selector
  const { data: empresasData } = useApi<PaginatedResponse<Empresa>>(
    () => getEmpresas({ page_size: 200 }),
    []
  );
  const empresas = empresasData?.results ?? [];

  // Reportes de la empresa seleccionada — FLUJO OBLIGATORIO
  const fetchReportes = useCallback(() => {
    if (!selectedEmpresaId) return Promise.resolve({ count: 0, next: null, previous: null, results: [] });
    return getReportesByEmpresa(selectedEmpresaId, { page_size: 100 });
  }, [selectedEmpresaId]);

  const { data: reportesData, isLoading, error } = useApi<PaginatedResponse<ReporteFinanciero>>(
    fetchReportes,
    [fetchReportes]
  );

  const chartData = useMemo(
    () =>
      (reportesData?.results ?? [])
        .filter((r) => r.estado_procesamiento === 'PROCESADO' && r.datos_extraidos_json)
        .map(toChartPoint)
        .sort((a, b) => a.gestion - b.gestion || (a.trimestre ?? 0) - (b.trimestre ?? 0)),
    [reportesData]
  );

  const selectedEmpresa = empresas.find((e) => e.id_empresa === selectedEmpresaId);

  const handleEmpresaSelect = (id: number) => {
    setSelectedEmpresaId(id);
    setSearchParams({ empresa: String(id) });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Análisis de Indicadores</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Visualización de estados financieros históricos (Balance General)
          </p>
        </div>
        <EmpresaSelector
          empresas={empresas}
          selectedId={selectedEmpresaId}
          onSelect={handleEmpresaSelect}
        />
      </div>

      {!selectedEmpresaId && (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-16 text-center bg-gray-50 dark:bg-white/[0.02]">
          <svg className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Selecciona una entidad para comenzar el análisis financiero.</p>
        </div>
      )}

      {selectedEmpresaId && !isLoading && chartData.length === 0 && (
        <div className="rounded-2xl border border-amber-100 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-6 text-center">
          <p className="text-sm text-amber-700 dark:text-amber-400">
            {selectedEmpresa?.nombre} no cuenta con reportes de Balance General procesados disponibles.
          </p>
          <Link
            to={`/admin/companies/${selectedEmpresaId}`}
            className="mt-2 inline-block text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Ver estado de los reportes →
          </Link>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 p-4 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {isLoading && selectedEmpresaId && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-6 h-72 animate-pulse">
              <div className="h-4 w-40 rounded bg-gray-100 dark:bg-gray-700 mb-4" />
              <div className="h-full rounded bg-gray-100 dark:bg-gray-700" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && chartData.length > 0 && (
        <>
          <div className="flex items-center gap-3 px-1">
            <span className="h-2 w-2 rounded-full bg-blue-500"></span>
            <span className="font-bold text-gray-900 dark:text-white">{selectedEmpresa?.nombre}</span>
            <span className="text-xs text-gray-400">|</span>
            <span className="text-xs font-mono text-gray-500">{selectedEmpresa?.codigo_bbv}</span>
            <span className="text-xs text-gray-400">|</span>
            <span className="text-xs text-gray-500">{chartData.length} períodos (Balance)</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Activo vs Pasivo (Balance Real) */}
            <ChartCard title="Balance: Activos vs Pasivos (Bs)" subtitle="Total de activos comparado con obligaciones totales.">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={fmtBS} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => fmtBS(Number(v))} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  <Bar dataKey="activo" name="Activo" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="pasivo" name="Pasivo" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* 2. Patrimonio Neto (Solvencia) */}
            <ChartCard title="Evolución del Patrimonio Neto (Bs)" subtitle="Recursos propios de la entidad a través del tiempo.">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPat" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={fmtBS} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => fmtBS(Number(v))} />
                  <Area type="monotone" dataKey="patrimonio" name="Patrimonio" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorPat)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* 3. Composición del Activo (Corriente vs No Corriente) */}
            <ChartCard title="Estructura del Activo (Bs)" subtitle="Distribución entre activos líquidos (corrientes) e inversiones fijas.">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={fmtBS} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => fmtBS(Number(v))} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  <Bar dataKey="ac" name="A. Corriente" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} barSize={25} />
                  <Bar dataKey="anc" name="A. No Corriente" stackId="a" fill="#059669" radius={[4, 4, 0, 0]} barSize={25} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* 4. Ratio de Endeudamiento (Calculado) */}
            <ChartCard title="Ratio de Endeudamiento (Apalancamiento)" subtitle="Relación Pasivo / Activo. Valores bajos indican mayor independencia financiera.">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 1]} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => fmtDecimal(Number(v))} />
                  <Line type="monotone" dataKey="endeudamiento" name="Ratio Endeudamiento" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* 5. Capital de Trabajo (Calculado) */}
            <ChartCard title="Capital de Trabajo (Bs)" subtitle="Activo Corriente - Pasivo Corriente. Mide la liquidez operativa inmediata.">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCap" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={fmtBS} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => fmtBS(Number(v))} />
                  <Area type="step" dataKey="capitalTrabajo" name="Cap. Trabajo" stroke="#f59e0b" fillOpacity={1} fill="url(#colorCap)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* FUTURO: Indicadores de Estado de Resultados (Habilitar cuando el pipeline procese ER)
            <ChartCard title="Eficiencia Operativa" subtitle="Ingresos vs Utilidad. No disponible en reportes de solo Balance.">
              <div className="flex items-center justify-center h-full text-xs text-gray-400 bg-gray-50/50 dark:bg-white/[0.01] rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                 Habilitado tras procesamiento de Estado de Resultados
              </div>
            </ChartCard>
            */}
          </div>
        </>
      )}
    </div>
  );
};

export default Indicators;
