import type { FinancialSnapshot } from '../../utils/financialMetrics';
import { formatPercent, formatRatio } from '../../utils/financialMetrics';

interface FinancialHealthScoreProps {
  snapshot: FinancialSnapshot;
  audience?: 'analyst' | 'investor';
}

const statusStyles: Record<string, { ring: string; text: string; bar: string; bg: string }> = {
  excelente: {
    ring: 'ring-emerald-200 dark:ring-emerald-500/30',
    text: 'text-emerald-700 dark:text-emerald-300',
    bar: 'bg-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
  },
  saludable: {
    ring: 'ring-emerald-200 dark:ring-emerald-500/30',
    text: 'text-emerald-700 dark:text-emerald-300',
    bar: 'bg-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
  },
  observacion: {
    ring: 'ring-amber-200 dark:ring-amber-500/30',
    text: 'text-amber-700 dark:text-amber-300',
    bar: 'bg-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-500/10',
  },
  riesgo: {
    ring: 'ring-red-200 dark:ring-red-500/30',
    text: 'text-red-700 dark:text-red-300',
    bar: 'bg-red-500',
    bg: 'bg-red-50 dark:bg-red-500/10',
  },
};

/**
 * FinancialHealthScore summarizes liquidity, leverage and equity trend into
 * one explainable score. It accepts a precomputed snapshot to keep API logic
 * outside presentation components.
 */
export default function FinancialHealthScore({
  snapshot,
  audience = 'analyst',
}: FinancialHealthScoreProps) {
  const styles = statusStyles[snapshot.status];
  const copy =
    audience === 'investor'
      ? 'Lectura simplificada de salud financiera basada en balances procesados.'
      : 'Score tecnico derivado de liquidez, endeudamiento y variacion patrimonial.';

  return (
    <section className={`rounded-2xl p-5 ring-1 ${styles.bg} ${styles.ring}`}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Salud financiera
          </p>
          <div className="mt-2 flex items-end gap-2">
            <span className={`text-5xl font-black leading-none ${styles.text}`}>{snapshot.score}</span>
            <span className="pb-1 text-sm font-semibold text-gray-500 dark:text-gray-400">/100</span>
          </div>
          <p className={`mt-2 text-sm font-bold ${styles.text}`}>{snapshot.statusLabel}</p>
        </div>

        <div className="min-w-0 flex-1 sm:max-w-md">
          <p className="text-sm leading-6 text-gray-600 dark:text-gray-300">{copy}</p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/70 dark:bg-gray-900/50">
            <div className={`h-full rounded-full ${styles.bar}`} style={{ width: `${snapshot.score}%` }} />
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
        <div>
          <span className="block text-xs text-gray-500 dark:text-gray-400">Liquidez</span>
          <strong className="text-gray-900 dark:text-white">{formatRatio(snapshot.liquidez)}</strong>
        </div>
        <div>
          <span className="block text-xs text-gray-500 dark:text-gray-400">Endeudamiento</span>
          <strong className="text-gray-900 dark:text-white">{formatPercent(snapshot.endeudamiento)}</strong>
        </div>
        <div>
          <span className="block text-xs text-gray-500 dark:text-gray-400">Tendencia patrimonial</span>
          <strong className="text-gray-900 dark:text-white">{formatPercent(snapshot.variacionPatrimonio)}</strong>
        </div>
      </div>
    </section>
  );
}
