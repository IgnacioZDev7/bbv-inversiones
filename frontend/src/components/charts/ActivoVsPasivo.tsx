import { useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import type { FinancialPoint } from '../../utils/financialMetrics';
import { formatMoneyCompact } from '../../utils/financialMetrics';
import CustomTooltip from './CustomTooltip';
import TimeRangeSelector, { filterByRange } from '../common/TimeRangeSelector';
import type { RangeKey } from '../common/TimeRangeSelector';
import EmptyState from '../common/EmptyState';

interface ActivoVsPasivoProps {
  data: FinancialPoint[];
  companyName?: string;
}

export default function ActivoVsPasivo({ data, companyName }: ActivoVsPasivoProps) {
  const [range, setRange] = useState<RangeKey>('3y');

  const chartData = useMemo(() => {
    const filtered = filterByRange(data, range);
    return filtered.map((d) => ({
      label: d.label,
      activo: d.activo,
      pasivo: d.pasivo,
      patrimonio: d.patrimonio,
    }));
  }, [data, range]);

  if (chartData.length === 0) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:flex-wrap">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
            Composición Financiera
          </h3>
        </div>
        <EmptyState message="No hay datos suficientes para el período seleccionado." />
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:flex-wrap">
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
            Composición Financiera
          </h3>
          {companyName && (
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 font-medium">{companyName}</p>
          )}
        </div>
        <TimeRangeSelector value={range} onChange={setRange} />
      </div>

      <div className="h-[300px] sm:h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="activoGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="pasivoGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#dc2626" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="patrimonioGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(148, 163, 184, 0.15)"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatMoneyCompact}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={<CustomTooltip formatter={(v) => formatMoneyCompact(v)} />}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 15, fontWeight: 600 }}
              iconType="circle"
            />
            <Area
              type="monotone"
              dataKey="patrimonio"
              name="Patrimonio Neto"
              stackId="1"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#patrimonioGrad)"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="pasivo"
              name="Pasivo Total"
              stackId="1"
              stroke="#dc2626"
              strokeWidth={2}
              fill="url(#pasivoGrad)"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="activo"
              name="Activo Total"
              stackId="1"
              stroke="#2563eb"
              strokeWidth={2}
              fill="url(#activoGrad)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
