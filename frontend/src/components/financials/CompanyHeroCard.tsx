import Sparkline from '../common/Sparkline';
import ChevronFlow from '../common/ChevronFlow';
import SpotlightCard from '../common/SpotlightCard';
import RippleButton from '../common/RippleButton';
import { formatMoneyCompact } from '../../utils/financialMetrics';

interface CompanyHeroCardProps {
  codigoBbv?: string;
  patrimonio: number;
  trend: number;
  sparklineData: number[];
  onViewHistory?: () => void;
  onCompareSector?: () => void;
}

export default function CompanyHeroCard({
  codigoBbv,
  patrimonio,
  trend,
  sparklineData,
  onViewHistory,
  onCompareSector,
}: CompanyHeroCardProps) {
  const isPositive = trend >= 0;

  return (
    <SpotlightCard className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div>
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">Patrimonio Neto</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500">Último periodo reportado{codigoBbv ? ` · ${codigoBbv}` : ''}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-3xl font-black text-gray-900 dark:text-white">Bs {formatMoneyCompact(patrimonio)}</p>
            {trend !== 0 && (
              <p className={`mt-1 flex items-center gap-1.5 text-xs font-bold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                <ChevronFlow direction={isPositive ? 'up' : 'down'} color={isPositive ? '#10b981' : '#ef4444'} size={12} />
                {Math.abs(trend * 100).toFixed(1)}% que el periodo anterior
              </p>
            )}
          </div>
          <Sparkline data={sparklineData} color={isPositive ? '#10b981' : '#ef4444'} height={48} width={110} />
        </div>
      </div>

      <div className="mt-5 flex gap-2 border-t border-gray-100 pt-4 dark:border-gray-700">
        <RippleButton
          onClick={onViewHistory}
          className="flex-1 rounded-xl bg-brand-500 px-3 py-2.5 text-xs font-bold text-white hover:bg-brand-600 transition-all"
        >
          Ver Histórico
        </RippleButton>
        <RippleButton
          onClick={onCompareSector}
          className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-all"
        >
          Comparar Sector
        </RippleButton>
      </div>
    </SpotlightCard>
  );
}
