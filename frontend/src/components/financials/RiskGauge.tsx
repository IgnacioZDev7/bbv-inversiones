import type { ReporteFinanciero } from '../../types/api';
import type { FinancialSnapshot } from '../../utils/financialMetrics';
import { buildFinancialSnapshot } from '../../utils/financialMetrics';

type RiskGaugeProps =
  | { snapshot: FinancialSnapshot; reportes?: never }
  | { snapshot?: never; reportes: ReporteFinanciero[] };

const riskConfig = {
  healthy: { color: '#059669', label: 'Riesgo bajo' },
  watch: { color: '#d97706', label: 'Riesgo medio' },
  risk: { color: '#dc2626', label: 'Riesgo alto' },
};

/**
 * RiskGauge renders a compact SVG gauge for risk interpretation. It receives
 * a FinancialSnapshot so the gauge stays consistent with the health score.
 */
export default function RiskGauge(props: RiskGaugeProps) {
  const snapshot = 'snapshot' in props && props.snapshot ? props.snapshot : buildFinancialSnapshot(props.reportes);
  const riskValue = 100 - snapshot.score;
  const config = riskConfig[snapshot.status];
  const circumference = 126;
  const progress = Math.max(0, Math.min(100, riskValue));

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Indice de riesgo
      </p>
      <div className="relative mx-auto mt-4 grid h-40 w-40 place-items-center">
        <svg viewBox="0 0 120 120" className="h-40 w-40 -rotate-90">
          <circle
            cx="60"
            cy="60"
            r="40"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            className="text-gray-100 dark:text-gray-800"
            strokeDasharray={circumference}
            strokeDashoffset={0}
            strokeLinecap="round"
            pathLength={100}
          />
          <circle
            cx="60"
            cy="60"
            r="40"
            fill="none"
            stroke={config.color}
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={100 - progress}
            strokeLinecap="round"
            pathLength={100}
          />
        </svg>
        <div className="absolute">
          <p className="text-3xl font-black text-gray-900 dark:text-white">{Math.round(riskValue)}</p>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">/100</p>
        </div>
      </div>
      <span
        className="mt-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-bold"
        style={{ backgroundColor: `${config.color}18`, color: config.color }}
      >
        {config.label}
      </span>
    </section>
  );
}
