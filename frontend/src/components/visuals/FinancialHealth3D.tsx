import Bar3DChart, { type Bar3DDatum } from './Bar3DChart';
import { formatPercent } from '../../utils/financialMetrics';

interface FinancialHealth3DProps {
  score: number;
  liquidez: number;
  endeudamiento: number;
}

function getHealthState(score: number): { color: string; label: string } {
  if (score >= 70) return { color: '#10b981', label: 'SALUDABLE' };
  if (score >= 40) return { color: '#f59e0b', label: 'OBSERVACIÓN' };
  return { color: '#ef4444', label: 'RIESGO' };
}

export default function FinancialHealth3D({ score, liquidez, endeudamiento }: FinancialHealth3DProps) {
  const { color, label } = getHealthState(score);

  // Liquidez y endeudamiento se normalizan a una escala 0-100 comparable con el score,
  // usando benchmarks razonables (liquidez >= 2 = óptima, endeudamiento >= 100% = crítico).
  const liquidezScore = Math.max(0, Math.min(100, (liquidez / 2) * 100));
  const endeudamientoScore = Math.max(0, Math.min(100, 100 - endeudamiento * 100));

  const data: Bar3DDatum[] = [
    {
      name: 'Score de Salud',
      value: score,
      displayValue: `${score}/100`,
      color,
      highlight: true,
      badge: label,
    },
    {
      name: 'Liquidez',
      value: liquidez,
      heightValue: liquidezScore,
      displayValue: liquidez.toFixed(2),
      color: '#0ea5e9',
    },
    {
      name: 'Endeudamiento',
      value: endeudamiento,
      heightValue: endeudamientoScore,
      displayValue: formatPercent(endeudamiento),
      color: '#f59e0b',
    },
  ];

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
          Salud Financiera 3D
        </h3>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 font-medium">
          Explorador 3D interactivo · Score, liquidez y endeudamiento
        </p>
      </div>

      <Bar3DChart data={data} maxValue={100} height={360} />

      <div className="mt-3 flex items-center justify-between text-[10px] font-medium text-gray-400">
        <span>Score: {score}/100 · {label}</span>
        <span>Click + arrastra para rotar · Scroll para zoom</span>
      </div>
    </section>
  );
}
