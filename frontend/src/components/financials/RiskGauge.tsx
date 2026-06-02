import { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import type { ReporteFinanciero } from '../../types/api';

interface RiskGaugeProps {
  reportes: ReporteFinanciero[];
}

const getVal = (r: ReporteFinanciero, key: string): number => {
  const d = r.datos_extraidos_json || {};
  const val = d[key];
  return typeof val === 'number' ? val : parseFloat(String(val || 0)) || 0;
};

export default function RiskGauge({ reportes }: RiskGaugeProps) {
  const [animateScore, setAnimateScore] = useState(0);

  if (!reportes || reportes.length === 0) return null;

  const sorted = [...reportes].sort((a, b) => {
    if (a.gestion !== b.gestion) return b.gestion - a.gestion;
    return (b.trimestre || 0) - (a.trimestre || 0);
  });

  const latest = sorted[0];
  const previous = sorted.length > 1 ? sorted[1] : null;

  const activo = getVal(latest, 'total_activo');
  const pasivo = getVal(latest, 'total_pasivo');
  const patrimonio = getVal(latest, 'total_patrimonio');
  const ac = getVal(latest, 'total_activo_corriente');
  const pc = getVal(latest, 'total_pasivo_corriente');
  const patPrev = previous ? getVal(previous, 'total_patrimonio') : 0;

  const nLiquidez = pc > 0 ? ac / pc : 0;
  const nEndeudamiento = activo > 0 ? pasivo / activo : 0;
  const varPatrimonio = patPrev !== 0 ? (patrimonio - patPrev) / patPrev : 0;

  let isSaludable = (nLiquidez >= 1.2 && nEndeudamiento <= 0.6 && varPatrimonio >= 0);
  let isRiesgoso = (nLiquidez < 1.0 || nEndeudamiento > 0.8 || varPatrimonio < -0.10);

  let score = 50;
  let color = '#f59e0b';
  let statusText = 'Riesgo Medio';

  if (isSaludable && !isRiesgoso) {
    score = 15;
    color = '#10b981';
    statusText = 'Riesgo Bajo';
  } else if (isRiesgoso) {
    score = 85;
    color = '#ef4444';
    statusText = 'Riesgo Alto';
  }

  useEffect(() => {
    setAnimateScore(0);
    const timer = setTimeout(() => setAnimateScore(score), 150);
    return () => clearTimeout(timer);
  }, [score]);

  const options: ApexOptions = {
    chart: { type: 'radialBar', fontFamily: 'Inter, sans-serif', animations: { enabled: true, speed: 800 } },
    plotOptions: {
      radialBar: {
        startAngle: -90, endAngle: 90,
        hollow: { margin: 15, size: '65%' },
        track: { background: '#e5e7eb', strokeWidth: '100%', margin: 0 },
        dataLabels: {
          show: true,
          name: { show: false },
          value: { offsetY: 12, color: color, fontSize: '30px', fontWeight: 700, show: true, formatter: (val) => val + "%" }
        }
      }
    },
    fill: { type: 'solid', colors: [color] },
    stroke: { lineCap: 'round' },
    labels: ['Riesgo'],
  };

  return (
    <div className="h-full flex flex-col justify-center rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <h3 className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Índice de Riesgo</h3>
      <div className="flex justify-center items-center h-[160px]">
        <ReactApexChart options={options} series={[animateScore]} type="radialBar" height={220} />
      </div>
      <div className="text-center mt-2">
        <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-bold" style={{ backgroundColor: `${color}15`, color: color }}>
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></span>
          {statusText}
        </span>
      </div>
    </div>
  );
}
