import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { FinancialPoint } from '../../utils/financialMetrics';
import CustomTooltip from './CustomTooltip';

interface FinancialRatiosChartProps {
  data: FinancialPoint[];
}

/**
 * High-density financial ratios chart.
 * Combines Liquidity and Debt ratios in a single interactive view.
 */
export default function FinancialRatiosChart({ data }: FinancialRatiosChartProps) {
  const chartData = useMemo(() => {
    return data.map(d => ({
      label: d.label,
      liquidez: d.liquidez,
      endeudamiento: d.endeudamiento,
    }));
  }, [data]);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-6">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
          Ratios de Desempeño
        </h3>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 font-medium">
          Análisis multivariable de riesgo y eficiencia
        </p>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" vertical={false} />
            <XAxis 
              dataKey="label" 
              tick={{ fontSize: 10, fill: '#94a3b8' }} 
              axisLine={false} 
              tickLine={false} 
            />
            <YAxis 
              tick={{ fontSize: 10, fill: '#94a3b8' }} 
              axisLine={false} 
              tickLine={false} 
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              iconType="circle" 
              wrapperStyle={{ fontSize: 11, paddingTop: 20, fontWeight: 600 }} 
            />
            <Line
              type="monotone"
              dataKey="liquidez"
              name="Liquidez"
              stroke="#10b981"
              strokeWidth={2.5}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="endeudamiento"
              name="Endeudamiento"
              stroke="#f59e0b"
              strokeWidth={2.5}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
