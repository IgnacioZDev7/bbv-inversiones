import { useMemo, useState, useRef, useEffect, memo, useCallback } from 'react';
import {
  Area,
  Line,
  Bar,
  ComposedChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Brush,
} from 'recharts';
import type { ReporteFinanciero } from '../../types/api';
import { formatMoneyCompact } from '../../utils/financialMetrics';
import TimeRangeSelector, { filterByRange } from '../common/TimeRangeSelector';
import type { RangeKey } from '../common/TimeRangeSelector';
import { useTheme } from '../../context/ThemeContext';

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
  liquidez_corriente: number | null;
  endeudamiento: number | null;
}

interface SeriesMeta {
  key: keyof InternalPoint;
  label: string;
  color: string;
  group: 'balance' | 'indicators';
}

type ChartMode = 'mountain' | 'line' | 'bar';

const CHART_MODES: { key: ChartMode; label: string }[] = [
  { key: 'mountain', label: 'Mountain' },
  { key: 'line', label: 'Line' },
  { key: 'bar', label: 'Bar' },
];

const ALL_SERIES: SeriesMeta[] = [
  { key: 'total_activo', label: 'Activo Total', color: '#2563eb', group: 'balance' },
  { key: 'total_pasivo', label: 'Pasivo Total', color: '#dc2626', group: 'balance' },
  { key: 'total_patrimonio', label: 'Patrimonio Neto', color: '#10b981', group: 'balance' },
  { key: 'activo_corriente', label: 'Activo Corriente', color: '#06b6d4', group: 'balance' },
  { key: 'pasivo_corriente', label: 'Pasivo Corriente', color: '#f97316', group: 'balance' },
  { key: 'liquidez_corriente', label: 'Liquidez', color: '#f59e0b', group: 'indicators' },
  { key: 'endeudamiento', label: 'Endeudamiento', color: '#e11d48', group: 'indicators' },
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
      liquidez_corriente: pc > 0 ? ac / pc : null,
      endeudamiento: activo > 0 ? pasivo / activo : null,
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

interface CrosshairProps {
  points?: Array<{ x: number; y: number }>;
  width?: number;
  height?: number;
}

function CrosshairCursor({ points, width, height }: CrosshairProps) {
  if (!points || points.length === 0 || !width || !height) return null;
  const { x, y } = points[0];
  return (
    <g>
      <line x1={x} y1={0} x2={x} y2={height} stroke="rgba(148,163,184,0.5)" strokeWidth={1} strokeDasharray="4 4" />
      <line x1={0} y1={y} x2={width} y2={y} stroke="rgba(148,163,184,0.5)" strokeWidth={1} strokeDasharray="4 4" />
    </g>
  );
}

function HistoricalFinancialChart({ reports, companyName }: HistoricalFinancialChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const brushColors = isDark
    ? { track: '#1e293b', accent: '#60a5fa' }
    : { track: '#f1f5f9', accent: '#465fff' };

  const [range, setRange] = useState<RangeKey>('all');
  const [visible, setVisible] = useState<Set<string>>(DEFAULT_VISIBLE);
  const [chartMode, setChartMode] = useState<ChartMode>('mountain');
  const [zoomRange, setZoomRange] = useState<[number, number] | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

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

  // Reinicia la ventana de zoom cada vez que cambia el rango/los datos filtrados.
  useEffect(() => {
    setZoomRange(chartData.length > 0 ? [0, chartData.length - 1] : null);
  }, [chartData]);

  const hasData = chartData.length > 0;
  const hasVisibleSeries = availableSeries.some((s) => visible.has(s.key));

  // Refs con el valor más reciente: evitan que el listener de wheel (que se
  // adjunta una sola vez) quede con datos "viejos" por los closures de React.
  const zoomRangeRef = useRef(zoomRange);
  const hoverIndexRef = useRef(hoverIndex);
  const dataLengthRef = useRef(chartData.length);
  zoomRangeRef.current = zoomRange;
  hoverIndexRef.current = hoverIndex;
  dataLengthRef.current = chartData.length;

  // Zoom con scroll-wheel: la rueda del mouse achica/agranda la ventana visible,
  // anclada en el punto que esté bajo el crosshair (o el centro si no hay hover).
  // El listener se adjunta una sola vez (no se recrea en cada movimiento del mouse)
  // y lee los valores actuales desde los refs en cada evento.
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      const currentZoom = zoomRangeRef.current;
      const length = dataLengthRef.current;
      if (!currentZoom || length < 2) return;
      e.preventDefault();

      const [start, end] = currentZoom;
      const span = end - start;
      const minSpan = Math.min(2, length - 1);
      const maxSpan = length - 1;
      const zoomFactor = e.deltaY > 0 ? 1.15 : 0.87;
      let newSpan = Math.round(span * zoomFactor);
      newSpan = Math.max(minSpan, Math.min(maxSpan, newSpan));
      if (newSpan === span) return;

      const anchor = hoverIndexRef.current ?? Math.round((start + end) / 2);
      const ratio = span === 0 ? 0.5 : (anchor - start) / span;
      let newStart = Math.round(anchor - newSpan * ratio);
      let newEnd = newStart + newSpan;

      if (newStart < 0) {
        newStart = 0;
        newEnd = newSpan;
      }
      if (newEnd > maxSpan) {
        newEnd = maxSpan;
        newStart = newEnd - newSpan;
      }

      setZoomRange([newStart, newEnd]);
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [hasData, hasVisibleSeries]);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:flex-wrap">
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
            Análisis Financiero Histórico
          </h3>
          {companyName && (
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 font-medium">
              {companyName}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 p-0.5 dark:border-gray-700">
            {CHART_MODES.map((m) => (
              <button
                key={m.key}
                onClick={() => setChartMode(m.key)}
                className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide transition-all ${
                  chartMode === m.key
                    ? 'bg-brand-500 text-white'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <TimeRangeSelector value={range} onChange={setRange} />
        </div>
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
        <div ref={wrapperRef} className="h-[380px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
              onMouseMove={(state) => {
                const idx = state?.activeTooltipIndex;
                setHoverIndex(typeof idx === 'number' ? idx : null);
              }}
              onMouseLeave={() => setHoverIndex(null)}
            >
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
              <Tooltip content={<ChartTooltipBody />} cursor={<CrosshairCursor />} />
              {zoomRange && (
                <Brush
                  dataKey="label"
                  height={24}
                  stroke={brushColors.accent}
                  fill={brushColors.track}
                  travellerWidth={8}
                  startIndex={zoomRange[0]}
                  endIndex={zoomRange[1]}
                  onChange={(r) => {
                    if (r.startIndex != null && r.endIndex != null) {
                      setZoomRange([r.startIndex, r.endIndex]);
                    }
                  }}
                />
              )}
              {availableSeries
                .filter((s) => visible.has(s.key))
                .map((s) => {
                  const isRatio = s.group === 'indicators';
                  const yAxisId = isRatio ? 'right' : 'left';

                  if (chartMode === 'line') {
                    return (
                      <Line
                        key={s.key}
                        type="linear"
                        dataKey={s.key}
                        name={s.label}
                        stroke={s.color}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 3, strokeWidth: 1, stroke: '#fff', fill: s.color }}
                        yAxisId={yAxisId}
                        connectNulls={false}
                      />
                    );
                  }

                  if (chartMode === 'bar') {
                    return (
                      <Bar
                        key={s.key}
                        dataKey={s.key}
                        name={s.label}
                        fill={s.color}
                        yAxisId={yAxisId}
                        radius={[2, 2, 0, 0]}
                      />
                    );
                  }

                  return (
                    <Area
                      key={s.key}
                      type="linear"
                      dataKey={s.key}
                      name={s.label}
                      stroke={s.color}
                      strokeWidth={2}
                      fill={`url(#grad_${s.key})`}
                      dot={false}
                      activeDot={{ r: 3, strokeWidth: 1, stroke: '#fff', fill: s.color }}
                      yAxisId={yAxisId}
                      connectNulls={false}
                    />
                  );
                })}
            </ComposedChart>
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
        <span>Scroll para hacer zoom · arrastra el slider inferior para desplazar.</span>
        <span>Activa/desactiva series con los chips superiores.</span>
      </div>
    </section>
  );
}

export default memo(HistoricalFinancialChart);
