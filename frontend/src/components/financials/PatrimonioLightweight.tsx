import { useEffect, useRef, useState, useMemo } from 'react';
import * as LightweightCharts from 'lightweight-charts';
import type { FinancialPoint } from '../../utils/financialMetrics';
import TimeRangeSelector, { filterByRange } from '../common/TimeRangeSelector';
import type { RangeKey } from '../common/TimeRangeSelector';
import EmptyState from '../common/EmptyState';

const { createChart, ColorType } = LightweightCharts;

interface PatrimonioLightweightProps {
  data: FinancialPoint[];
  companyName?: string;
  height?: number;
}

/**
 * Professional financial chart using Lightweight Charts (TradingView style).
 * Optimized for high-density financial data and interactive zooming.
 */
export default function PatrimonioLightweight({ 
  data, 
  companyName,
  height = 400 
}: PatrimonioLightweightProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);
  const [range, setRange] = useState<RangeKey>('all');

  const filteredData = useMemo(() => {
    return filterByRange(data, range).map(d => ({
      time: d.date, // Assumes date is in YYYY-MM-DD format from toFinancialPoint
      value: d.patrimonio
    })).sort((a, b) => a.time.localeCompare(b.time));
  }, [data, range]);

  useEffect(() => {
    if (!chartContainerRef.current || filteredData.length === 0) return;

    const isDark = document.documentElement.classList.contains('dark');

    const chart = createChart(chartContainerRef.current, {
      height: height,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: isDark ? '#94a3b8' : '#64748b',
        fontFamily: 'Inter, sans-serif',
      },
      grid: {
        vertLines: { color: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(226, 232, 240, 0.5)' },
        horzLines: { color: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(226, 232, 240, 0.5)' },
      },
      timeScale: {
        borderColor: isDark ? 'rgba(51, 65, 85, 1)' : 'rgba(203, 213, 225, 1)',
      },
      rightPriceScale: {
        borderColor: isDark ? 'rgba(51, 65, 85, 1)' : 'rgba(203, 213, 225, 1)',
      },
    });

    const series = chart.addAreaSeries({
      lineColor: '#2563eb',
      topColor: 'rgba(37, 99, 235, 0.3)',
      bottomColor: 'rgba(37, 99, 235, 0.05)',
      lineWidth: 2,
      priceFormat: {
        type: 'volume',
        precision: 0,
      },
    });

    series.setData(filteredData);
    chart.timeScale().fitContent();
    
    chartRef.current = chart;
    seriesRef.current = series;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [height, filteredData]);

  if (data.length === 0) {
    return <EmptyState message="No hay datos históricos disponibles." />;
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
            Evolución del Patrimonio
          </h3>
          {companyName && (
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 font-medium">Terminal Financiero · {companyName}</p>
          )}
        </div>
        <TimeRangeSelector value={range} onChange={setRange} />
      </div>

      <div ref={chartContainerRef} className="w-full" />
      
      <div className="mt-4 flex justify-end">
        <span className="text-[10px] font-medium text-gray-400 italic">
          Interactividad: Scroll para zoom · Click & Arrastre para pan
        </span>
      </div>
    </section>
  );
}
