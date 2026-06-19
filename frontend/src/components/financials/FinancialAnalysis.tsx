import type { ReporteFinanciero } from '../../types/api';
import { calculateFinancialHealthScore, classifyHealthScore, healthLabelMap } from '../../utils/financialMetrics';

interface FinancialAnalysisProps {
  reportes: ReporteFinanciero[];
}

const getVal = (r: ReporteFinanciero, key: string): number => {
  const d = r.datos_extraidos_json || {};
  const val = d[key];
  return typeof val === 'number' ? val : parseFloat(String(val || 0)) || 0;
};

export default function FinancialAnalysis({ reportes }: FinancialAnalysisProps) {
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
  const solvencia = pasivo > 0 ? activo / pasivo : 0;

  const healthScore = calculateFinancialHealthScore({
    liquidez: nLiquidez,
    endeudamiento: nEndeudamiento,
    crecimientoPatrimonial: varPatrimonio,
    solvencia,
  });
  const status = classifyHealthScore(healthScore);
  const labels = healthLabelMap[status];

  let statusColor = "text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/5 border-amber-200/50";
  if (status === 'excelente' || status === 'saludable') {
    statusColor = "text-emerald-700 bg-emerald-50/50 dark:text-emerald-400 dark:bg-emerald-500/5 border-emerald-200/50";
  } else if (status === 'riesgo') {
    statusColor = "text-red-700 bg-red-50/50 dark:text-red-400 dark:bg-red-500/5 border-red-200/50";
  }

  return (
    <div className={`h-full flex flex-col justify-center p-6 rounded-2xl border ${statusColor}`}>
      <div className="flex gap-4">
        <div className="flex-1">
          <h4 className="text-lg font-bold pb-2">Salud Financiera: {labels.status} ({healthScore}/100)</h4>
          <p className="text-sm font-medium opacity-90 leading-relaxed mb-4">
            Análisis automático basado en solvencia y liquidez estructural.
          </p>
          
          <div className="text-xs space-y-2 opacity-90 font-medium">
            <div className="flex items-center gap-2">
              <span className={nLiquidez >= 1.2 ? "text-emerald-500" : nLiquidez < 1.0 ? "text-red-500" : "text-yellow-500"}>●</span>
              Liquidez Corriente: {nLiquidez.toFixed(2)}
            </div>
            <div className="flex items-center gap-2">
              <span className={nEndeudamiento <= 0.6 ? "text-emerald-500" : nEndeudamiento > 0.8 ? "text-red-500" : "text-yellow-500"}>●</span>
              Ratio Endeudamiento: {(nEndeudamiento * 100).toFixed(1)}%
            </div>
            <div className="flex items-center gap-2">
              <span className={varPatrimonio >= 0 ? "text-emerald-500" : varPatrimonio < -0.1 ? "text-red-500" : "text-yellow-500"}>●</span>
              Tendencia Patrimonial: {(varPatrimonio * 100).toFixed(1)}%
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-current opacity-20 text-[10px] uppercase font-bold tracking-widest">
            Datos: {latest.gestion} {latest.trimestre ? `T${latest.trimestre}` : 'ANUAL'}
          </div>
        </div>
      </div>
    </div>
  );
}
