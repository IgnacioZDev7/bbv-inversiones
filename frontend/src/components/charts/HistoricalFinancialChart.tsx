import { useMemo, useState, memo, useCallback } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Brush,
} from 'recharts';
import type { ReporteFinanciero } from '../../types/api';
import { formatMoneyCompact, formatPercent } from '../../utils/financialMetrics';
import TimeRangeSelector, { filterByRange } from '../common/TimeRangeSelector';
import type { RangeKey } from '../common/TimeRangeSelector';
import CustomTooltip from './CustomTooltip';

interface HistoricalFinancialChartProps {
  reports: ReporteFinanciero[];
  companyName?: string;
}

interface InternalPoint {
  label: string;
  gestion: number;
  trimestre: number | null;
  total_activo: number | null;
  total_pasivo: number | null;
  total_patrimonio: number | null;
  activo_corriente: number | null;
  pasivo_corriente: number | null;
  ingresos_totales: number | null;
  utilidad_neta: number | null;
  liquidez_corriente: number | null;
  endeudamiento: number | null;
  roa: number | null;
  roe: number | null;
}

interface SeriesMeta {
  key: keyof InternalPoint;
  label: string;
  color: string;
  group: 'balance' | 'results' | 'indicators';
}

const ALL_SERIES: SeriesMeta[] = [
  { key: 'total_activo', label: 'Activo Total', color: '#2563eb', group: 'balance' },
  { key: 'total_pasivo', label: 'Pasivo Total', color: '#dc2626', group: 'balance' },
  { key: 'total_patrimonio', label: 'Patrimonio Neto', color: '#10b981', group: 'balance' },
  { key: 'activo_corriente', label: 'Activo Corriente', color: '#06b6d4', group: 'balance' },
  { key: 'pasivo_corriente', label: 'Pasivo Corriente', color: '#f97316', group: 'balance' },
  { key: 'ingresos_totales', label: 'Ingresos Totales', color: '#22c55e', group: 'results' },
  { key: 'utilidad_neta', label: 'Utilidad Neta', color: '#8b5cf6', group: 'results' },
  { key: 'liquidez_corriente', label: 'Liquidez', color: '#f59e0b', group: 'indicators' },
  { key: 'endeudamiento', label: 'Endeudamiento', color: '#e11d48', group: 'indicators' },
  { key: 'roa', label: 'ROA', color: '#6366f1', group: 'indicators' },
  { key: 'roe', label: 'ROE', color: '#ec4899', group: 'indicators' },
];

function buildPoints(reports: ReporteFinanciero[]): InternalPoint[] {
  const processed = reports.filter(
    (r) => r.estado_procesamiento === 'PROCESADO' && r.datos_extraidos_json,
  );
  const sorted = [...processed].sort(
    (a, b) => a.gestion - b.gestion || (a.trimestre ?? 0) - (b.trimestre ?? 0),
  );
  return sorted.map((r) => {
    const d = r.datos_extraidos_json!;
    const activo = Number(d.total_activo ?? 0);
    const pasivo = Number(d.total_pasivo ?? 0);
    const ac = Number(d.total_activo_corriente ?? 0);
    const pc = Number(d.total_pasivo_corriente ?? 0);
    return {
      label: r.trimestre ? `${r.gestion} T${r.trimestre}` : `${r.gestion}`,
      gestion: r.gestion,
      trimestre: r.trimestre,
      total_activo: activo || null,
      total_pasivo: pasivo || null,
      total_patrimonio: Number(d.total_patrimonio ?? 0) || null,
      activo_corriente: ac || null,
      pasivo_corriente: pc || null,
      ingresos_totales: Number(d.ingresos_totales ?? null) || null,
      utilidad_neta: Number(d.utilidad_neta ?? null) || null,
      liquidez_corriente: pc > 0 ? ac / pc : null,
      endeudamiento: activo > 0 ? pasivo / activo : null,
      roa: Number(d.roa ?? null) || null,
      roe: Number(d.roe ?? null) || null,
    };
  });
}

function findAvailableSeries(points: InternalPoint[]): SeriesMeta[] {
  return ALL_SERIES.filter((s) => points.some((p) => p[s.key] !== null && p[s.key] !== undefined));
}

const DEFAULT_VISIBLE = new Set([
  'total_activo',
  'total_pasivo',
  'total_patrimonio',
]);

function formatChartValue(value: number): string {
  if (Math.abs(value) >= 1_000_000) return formatMoneyCompact(value);
  if (Math.abs(value) >= 1) return value.toFixed(2);
  return value.toFixed(3);
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number;
    color?: string;
    dataKey?: string;
  }>;
  label?: string;
}

function ChartTooltipBody({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="min-w-[200px] rounded-xl border border-gray-200/50 bg-white/95 p-3 shadow-lg backdrop-blur-sm dark:border-gray-700/50 dark:bg-gray-900/95">
      <p className="mb-2 text-xs font-semibold text-gray-600 dark:text-gray-400">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry, idx) => (
          <div key={idx} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: entry.color }} />
              <span className="text-xs text-gray-700 dark:text-gray-300">{entry.name}</span>
            </div>
            <span className="text-xs font-semibold text-gray-900 dark:text-white tabular-nums">
              {entry.value !== undefined && entry.value !== null ? formatChartValue(entry.value) : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HistoricalFinancialChart({ reports, companyName }: HistoricalFinancialChartProps) {
  const [range, setRange] = useState<RangeKey>('all');
  const [visible, setVisible] = useState<Set<string>>(DEFAULT_VISIBLE);

  const toggleSeries = useCallback((key: string) => {
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const allPoints = useMemo(() => buildPoints(reports), [reports]);

  const filteredPoints = useMemo(
    () => filterByRange(allPoints, range),
    [allPoints, range],
  );

  const availableSeries = useMemo(() => findAvailableSeries(allPoints), [allPoints]);

  const chartData = useMemo(() => filteredPoints, [filteredPoints]);

  const hasData = chartData.length > 0;
  const hasVisibleSeries = availableSeries.some((s) => visible.has(s.key));

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:flex-wrap">
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
            An\u00e1lisis Financiero Hist\u00f3rico
          </h3>
          {companyName && (
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 font-medium">
              {companyName}
            </p>
          )}
        </div>
        <TimeRangeSelector value={range} onChange={setRange} />
      </div>

      {/* Chip selector */}
      {availableSeries.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {availableSeries.map((s) => {
            const active = visible.has(s.key);
            return (
              <button
                key={s.key}
                onClick={() => toggleSeries(s.key)}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all ${
                  active
                    ? 'text-white shadow-sm'
                    : 'border border-gray-200 bg-gray-50 text-gray-400 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500'
                }`}
                style={active ? { backgroundColor: s.color } : undefined}
              >
                {active && (
                  <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {s.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Chart */}
      {hasData && hasVisibleSeries ? (
        <div className="h-[380px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <defs>
                {availableSeries.map((s) => (
                  <linearGradient key={s.key} id={`grad_${s.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={s.color} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={s.color} stopOpacity={0.01} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis
                yAxisId="left"
                tickFormatter={formatMoneyCompact}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                domain={[0, 'auto']}
              />
              <Tooltip content={<ChartTooltipBody />} cursor={{ stroke: 'rgba(148,163,184,0.3)', strokeDasharray: '4 4' }} />
              <Brush
                dataKey="label"
                height={24}
                stroke="#94a3b8"
                fill="#f8fafc"
                className="dark:fill-gray-800"
                travellerWidth={8}
              />
              {availableSeries
                .filter((s) => visible.has(s.key))
                .map((s) => {
                  const isRatio = s.group === 'indicators';
                  return (
                    <Area
                      key={s.key}
                      type="monotone"
                      dataKey={s.key}
                      name={s.label}
                      stroke={s.color}
                      strokeWidth={2}
                      fill={`url(#grad_${s.key})`}
                      dot={false}
                      activeDot={{ r: 3, strokeWidth: 1, stroke: '#fff', fill: s.color }}
                      yAxisId={isRatio ? 'right' : 'left'}
                      connectNulls={false}
                    />
                  );
                })}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex h-[200px] items-center justify-center rounded-xl border border-dashed border-gray-200 text-sm text-gray-400 dark:border-gray-700">
          {!hasData
            ? 'No hay datos financieros disponibles para este período.'
            : 'Selecciona al menos una serie para visualizar.'}
        </div>
      )}

      {/* Legend / helper */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-medium text-gray-400">
        <span>Usa el slider inferior para zoom temporal.</span>
        <span>Activa/desactiva series con los chips superiores.</span>
      </div>
    </section>
  );
}

export default memo(HistoricalFinancialChart);
