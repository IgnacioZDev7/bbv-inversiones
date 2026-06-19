import { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { calculateFinancialHealthScore, classifyHealthScore, healthLabelMap } from '../../utils/financialMetrics';

interface Metric {
  id: number;
  reporte: number;
  gestion: number;
  trimestre: number;
  activos: string | null;
  pasivos: string | null;
  patrimonio: string | null;
  liquidez_corriente: string | null;
  endeudamiento: string | null;
}

interface RiskGaugeProps {
  metrics: Metric[];
}

export default function RiskGauge({ metrics }: RiskGaugeProps) {
  const [animateScore, setAnimateScore] = useState(0);

  if (!metrics || metrics.length === 0) return null;

  const sortedMetrics = [...metrics].sort((a, b) => {
    if (a.gestion !== b.gestion) return b.gestion - a.gestion;
    return b.trimestre - a.trimestre;
  });

  const latest = sortedMetrics[0];
  const previous = sortedMetrics.length > 1 ? sortedMetrics[1] : null;

  const nLiquidez = Number(latest.liquidez_corriente || 0);
  const nEndeudamiento = Number(latest.endeudamiento || 0);
  const nPatrimonioAct = Number(latest.patrimonio || 0);
  const nPatrimonioPrev = Number(previous?.patrimonio || 0);
  const varPatrimonio = (nPatrimonioPrev !== 0) ? ((nPatrimonioAct - nPatrimonioPrev) / nPatrimonioPrev) : 0;
  const nActivos = Number(latest.activos || 0);
  const nPasivos = Number(latest.pasivos || 0);
  const solvencia = nPasivos > 0 ? nActivos / nPasivos : 0;

  const healthScore = calculateFinancialHealthScore({
    liquidez: nLiquidez,
    endeudamiento: nEndeudamiento,
    crecimientoPatrimonial: varPatrimonio,
    solvencia,
  });
  const status = classifyHealthScore(healthScore);
  const labels = healthLabelMap[status];

  // Score representa el nivel de riesgo (inverso del health score)
  const riskScore = 100 - healthScore;
  let color = '#10b981';
  if (status === 'observacion') color = '#f59e0b';
  else if (status === 'riesgo') color = '#ef4444';

  useEffect(() => {
    setAnimateScore(0);
    const timer = setTimeout(() => {
      setAnimateScore(riskScore);
    }, 150);
    return () => clearTimeout(timer);
  }, [riskScore]);

  const options: ApexOptions = {
    chart: {
      type: 'radialBar',
      fontFamily: 'Inter, sans-serif',
      animations: {
        enabled: true,
        speed: 800,
        dynamicAnimation: {
          enabled: true,
          speed: 800
        }
      },
      dropShadow: {
        enabled: true,
        top: 3,
        left: 0,
        blur: 4,
        opacity: 0.15
      }
    },
    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 90,
        hollow: {
          margin: 15,
          size: '65%',
        },
        track: {
          background: '#e5e7eb',
          strokeWidth: '100%',
          margin: 0, // margin is in pixels
          dropShadow: {
            enabled: true,
            top: 0,
            left: 0,
            blur: 3,
            opacity: 0.1
          }
        },
        dataLabels: {
          show: true,
          name: {
            show: false,
          },
          value: {
            offsetY: 12,
            color: color,
            fontSize: '36px',
            fontWeight: 700,
            show: true,
            formatter: function (val) {
              return val + "%";
            }
          }
        }
      }
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        type: 'horizontal',
        shadeIntensity: 0.5,
        gradientToColors: [color],
        inverseColors: true,
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 100]
      }
    },
    stroke: {
      lineCap: 'round'
    },
    colors: [color],
    labels: ['Nivel de Riesgo'],
  };

  return (
    <div className="h-full flex flex-col justify-center rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-brand-500/10">
      <div className="text-center mb-0">
        <h3 className="text-sm font-bold text-gray-800 dark:text-white/90 uppercase tracking-wide">
          Índice de Riesgo
        </h3>
      </div>
      <div className="flex justify-center items-center mt-[-5px] h-[180px]">
        <ReactApexChart options={options} series={[animateScore]} type="radialBar" height={240} />
      </div>
      <div className="text-center mt-2">
        <span 
          className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-sm font-medium" 
          style={{ backgroundColor: `${color}15`, color: color }}
        >
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></span>
          {labels.risk}
        </span>
      </div>
    </div>
  );
}
