import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { FinancialPoint } from '../../utils/financialMetrics';
import { formatMoneyCompact, formatPercent, formatRatio } from '../../utils/financialMetrics';

type ChartMode = 'patrimonio' | 'balance' | 'liquidez' | 'endeudamiento' | 'capitalTrabajo';

interface FinancialChartCardProps {
  title: string;
  subtitle?: string;
  data: FinancialPoint[];
  mode: ChartMode;
}

const tooltipStyle = {
  backgroundColor: 'rgba(15, 23, 42, 0.94)',
  border: 'none',
  borderRadius: '12px',
  color: '#e2e8f0',
  fontSize: '12px',
};

/**
 * FinancialChartCard standardizes chart containers and Recharts primitives for
 * balance-based dashboards. The `mode` prop controls which financial series
 * are shown while preserving layout and responsive sizing.
 */
export default function FinancialChartCard({ title, subtitle, data, mode }: FinancialChartCardProps) {
  return (
    <section className="flex min-h-[340px] flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h3>
        {subtitle && <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">{subtitle}</p>}
      </div>
      <div className="min-h-0 flex-1">
        {data.length === 0 ? (
          <div className="grid h-full min-h-[240px] place-items-center rounded-xl border border-dashed border-gray-200 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
            No hay datos procesados para graficar.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {mode === 'balance' ? (
              <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.22)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={formatMoneyCompact} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatMoneyCompact(Number(value))} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Bar dataKey="activo" name="Activo" fill="#2563eb" radius={[5, 5, 0, 0]} />
                <Bar dataKey="pasivo" name="Pasivo" fill="#dc2626" radius={[5, 5, 0, 0]} />
              </BarChart>
            ) : mode === 'liquidez' ? (
              <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.22)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={formatRatio} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatRatio(Number(value))} />
                <Line type="monotone" dataKey="liquidez" name="Liquidez" stroke="#059669" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            ) : mode === 'endeudamiento' ? (
              <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.22)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(value) => formatPercent(Number(value))} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatPercent(Number(value))} />
                <Line type="monotone" dataKey="endeudamiento" name="Endeudamiento" stroke="#d97706" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            ) : (
              <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.22)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={formatMoneyCompact} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatMoneyCompact(Number(value))} />
                <Area
                  type="monotone"
                  dataKey={mode === 'capitalTrabajo' ? 'capitalTrabajo' : 'patrimonio'}
                  name={mode === 'capitalTrabajo' ? 'Capital de trabajo' : 'Patrimonio'}
                  stroke={mode === 'capitalTrabajo' ? '#d97706' : '#2563eb'}
                  fill={mode === 'capitalTrabajo' ? '#f59e0b33' : '#2563eb33'}
                  strokeWidth={3}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
