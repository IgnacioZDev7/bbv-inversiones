import { useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
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

// Toolkit Financiero Consolidado
import FinancialAnalysis from '../../components/financials/FinancialAnalysis';
import RiskGauge from '../../components/financials/RiskGauge';
import SectorComparison from '../../components/financials/SectorComparison';

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
  
  const activo = extractFinancialValue(d, 'total_activo');
  const pasivo = extractFinancialValue(d, 'total_pasivo');
  const patrimonio = extractFinancialValue(d, 'total_patrimonio');
  const ac = extractFinancialValue(d, 'total_activo_corriente');
  const pc = extractFinancialValue(d, 'total_pasivo_corriente');
  const anc = extractFinancialValue(d, 'total_activo_no_corriente');

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
    endeudamiento: activo > 0 ? (pasivo / activo) : 0,
    capitalTrabajo: ac - pc,
  };
};

// ── Selector de empresa ────────────────────────────────────────
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

const Indicators: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<number | null>(
    searchParams.get('empresa') ? Number(searchParams.get('empresa')) : null
  );

  const { data: empresasData } = useApi<PaginatedResponse<Empresa>>(() => getEmpresas({ page_size: 200 }), []);
  const empresas = empresasData?.results ?? [];

  const fetchReportes = useCallback(() => {
    if (!selectedEmpresaId) return Promise.resolve({ count: 0, next: null, previous: null, results: [] });
    return getReportesByEmpresa(selectedEmpresaId, { page_size: 100 });
  }, [selectedEmpresaId]);

  const { data: reportesData, isLoading } = useApi<PaginatedResponse<ReporteFinanciero>>(fetchReportes, [fetchReportes]);

  const reportesProcesados = useMemo(() => 
    (reportesData?.results ?? []).filter(r => r.estado_procesamiento === 'PROCESADO'),
    [reportesData]
  );

  const chartData = useMemo(() => 
    reportesProcesados
        .map(toChartPoint)
        .sort((a, b) => a.gestion - b.gestion || (a.trimestre ?? 0) - (b.trimestre ?? 0)),
    [reportesProcesados]
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Panel de Análisis Avanzado</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Interpretación de solvencia y estructura de capital</p>
        </div>
        <EmpresaSelector empresas={empresas} selectedId={selectedEmpresaId} onSelect={handleEmpresaSelect} />
      </div>

      {!selectedEmpresaId && (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-16 text-center bg-gray-50 dark:bg-white/[0.02]">
          <p className="text-gray-500 dark:text-gray-400">Selecciona una entidad para visualizar el Toolkit Financiero.</p>
        </div>
      )}

      {selectedEmpresaId && !isLoading && reportesProcesados.length === 0 && (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-6 text-center dark:bg-amber-900/10 dark:border-amber-900/20">
          <p className="text-sm text-amber-700 dark:text-amber-400">No hay reportes de Balance General para {selectedEmpresa?.nombre}.</p>
        </div>
      )}

      {!isLoading && reportesProcesados.length > 0 && (
        <div className="animate-fade-in space-y-6">
          {/* Fila 1: Toolkit de Diagnóstico */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
                <FinancialAnalysis reportes={reportesProcesados} />
            </div>
            <div>
                <RiskGauge reportes={reportesProcesados} />
            </div>
          </div>

          {/* Fila 2: Gráficos de Balance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Estructura: Activo vs Pasivo (Bs)">
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

            <ChartCard title="Evolución del Patrimonio Neto (Bs)">
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
          </div>

          {/* Fila 3: Análisis Sectorial y composición */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {selectedEmpresaId && <SectorComparison companies={empresas} selectedCompanyId={selectedEmpresaId} />}
            <ChartCard title="Ratio de Endeudamiento (Apalancamiento)" subtitle="Valores < 0.6 sugieren independencia financiera.">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 1]} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => fmtDecimal(Number(v))} />
                  <Line type="monotone" dataKey="endeudamiento" name="Ratio" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>
      )}
    </div>
  );
};

export default Indicators;
