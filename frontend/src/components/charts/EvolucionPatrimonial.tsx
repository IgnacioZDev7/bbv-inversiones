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

interface EvolucionPatrimonialProps {
  data: FinancialPoint[];
  companyName?: string;
}

export default function EvolucionPatrimonial({ data, companyName }: EvolucionPatrimonialProps) {
  const [range, setRange] = useState<RangeKey>('3y');

  const chartData = useMemo(() => {
    const filtered = filterByRange(data, range);
    return filtered.map((d) => ({
      label: d.label,
      patrimonio: d.patrimonio,
    }));
  }, [data, range]);

  if (chartData.length === 0) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:flex-wrap">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            Evolución Patrimonial
          </h3>
        </div>
        <EmptyState message="No hay datos patrimoniales para el período seleccionado." />
      </section>
    );
  }

  const firstValue = chartData[0]?.patrimonio ?? 0;
  const lastValue = chartData[chartData.length - 1]?.patrimonio ?? 0;
  const variation = firstValue > 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;
  const isPositive = variation >= 0;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:flex-wrap">
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            Evolución Patrimonial
          </h3>
          {companyName && (
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{companyName}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
              isPositive
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'
            }`}
          >
            <svg
              className={`h-3.5 w-3.5 ${isPositive ? '' : 'rotate-180'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
            </svg>
            {isPositive ? '+' : ''}
            {variation.toFixed(1)}%
          </span>
          <TimeRangeSelector value={range} onChange={setRange} />
        </div>
      </div>

      <div className="h-[300px] sm:h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="patrimonioGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(148, 163, 184, 0.22)"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatMoneyCompact}
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={<CustomTooltip formatter={(v) => formatMoneyCompact(v)} />}
              cursor={{ stroke: 'rgba(148, 163, 184, 0.3)', strokeDasharray: '4 4' }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
              iconType="line"
            />
            <Area
              type="linear"
              dataKey="patrimonio"
              name="Patrimonio"
              stroke="#2563eb"
              strokeWidth={3}
              fill="url(#patrimonioGradient)"
              dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}


