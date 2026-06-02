import type { ReporteFinanciero } from '../../types/api';

interface FinancialAnalysisProps {
  reportes: ReporteFinanciero[];
}

/**
 * Extrae valores numéricos de datos_extraidos_json de forma segura.
 */
const getVal = (r: ReporteFinanciero, key: string): number => {
  const d = r.datos_extraidos_json || {};
  const val = d[key];
  return typeof val === 'number' ? val : parseFloat(String(val || 0)) || 0;
};

export default function FinancialAnalysis({ reportes }: FinancialAnalysisProps) {
  if (!reportes || reportes.length === 0) return null;

  // Ordenar cronológicamente descendente (más reciente primero)
  const sorted = [...reportes].sort((a, b) => {
    if (a.gestion !== b.gestion) return b.gestion - a.gestion;
    return (b.trimestre || 0) - (a.trimestre || 0);
  });

  const latest = sorted[0];
  const previous = sorted.length > 1 ? sorted[1] : null;

  // Datos Reales (Balance)
  const activo = getVal(latest, 'total_activo');
  const pasivo = getVal(latest, 'total_pasivo');
  const patrimonio = getVal(latest, 'total_patrimonio');
  const ac = getVal(latest, 'total_activo_corriente');
  const pc = getVal(latest, 'total_pasivo_corriente');

  const patPrev = previous ? getVal(previous, 'total_patrimonio') : 0;

  // Cálculos Derivados
  const nLiquidez = pc > 0 ? ac / pc : 0;
  const nEndeudamiento = activo > 0 ? pasivo / activo : 0;
  const varPatrimonio = patPrev !== 0 ? (patrimonio - patPrev) / patPrev : 0;

  // Lógica de Clasificación
  let status = "Moderado";
  let statusColor = "text-yellow-700 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-500/5 border-yellow-200/50";
  let isRiesgoso = (nLiquidez < 1.0 || nEndeudamiento > 0.8 || varPatrimonio < -0.10);
  let isSaludable = (nLiquidez >= 1.2 && nEndeudamiento <= 0.6 && varPatrimonio >= 0);

  if (isSaludable && !isRiesgoso) {
    status = "Saludable";
    statusColor = "text-emerald-700 bg-emerald-50/50 dark:text-emerald-400 dark:bg-emerald-500/5 border-emerald-200/50";
  } else if (isRiesgoso) {
    status = "Riesgoso";
    statusColor = "text-red-700 bg-red-50/50 dark:text-red-400 dark:bg-red-500/5 border-red-200/50";
  }

  return (
    <div className={`h-full flex flex-col justify-center p-6 rounded-2xl border ${statusColor}`}>
      <div className="flex gap-4">
        <div className="flex-1">
          <h4 className="text-lg font-bold pb-2">Diagnóstico de Balance: {status}</h4>
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
