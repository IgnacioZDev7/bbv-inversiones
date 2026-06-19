import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useApi } from '../../hooks/useApi';
import { getAllEmpresas, getAllReportes } from '../../services/apiServices';
import type { Empresa, ReporteFinanciero } from '../../types/api';
import { buildFinancialSnapshot } from '../../utils/financialMetrics';

function scoreToStars(score: number) {
  if (score >= 80) return '★★★★★';
  if (score >= 60) return '★★★★';
  if (score >= 40) return '★★★';
  if (score >= 20) return '★★';
  return '★';
}

function scoreLabel(score: number) {
  if (score >= 80) return { text: 'Compra fuerte', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' };
  if (score >= 60) return { text: 'Compra', badge: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-300' };
  if (score >= 40) return { text: 'Mantener', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300' };
  if (score >= 20) return { text: 'Vender', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300' };
  return { text: 'Vender fuerte', badge: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300' };
}

interface Recommendation {
  empresa: Empresa;
  score: number;
  label: { text: string; badge: string };
  justificacion: string;
}

export default function Recommendations() {
  const navigate = useNavigate();

  const { data: empresas, isLoading: empLoading } = useApi<Empresa[]>(() => getAllEmpresas(), []);
  const { data: reportes, isLoading: repLoading } = useApi<ReporteFinanciero[]>(
    () => getAllReportes(),
    []
  );

  const recommendations = useMemo<Recommendation[]>(() => {
    if (!empresas || !reportes) return [];

    const empresaReports = new Map<number, ReporteFinanciero[]>();
    reportes.forEach((r) => {
      const list = empresaReports.get(r.empresa) ?? [];
      list.push(r);
      empresaReports.set(r.empresa, list);
    });

    const list: Recommendation[] = [];

    empresaReports.forEach((reps, empId) => {
      const empresa = empresas.find((e) => e.id_empresa === empId);
      if (!empresa) return;

      const snapshot = buildFinancialSnapshot(reps);
      if (!snapshot.latest) return;

      const score = snapshot.score;
      const label = scoreLabel(score);

      let justificacion = '';
      if (snapshot.liquidez < 1) {
        justificacion = 'Liquidez insuficiente para cubrir obligaciones de corto plazo.';
      } else if (snapshot.endeudamiento > 0.7) {
        justificacion = 'Alto nivel de endeudamiento respecto al activo total.';
      } else if (snapshot.variacionPatrimonio < -0.1) {
        justificacion = 'Reducción patrimonial significativa en el último período.';
      } else if (snapshot.liquidez > 2 && snapshot.endeudamiento < 0.4) {
        justificacion = 'Sólida posición financiera con baja deuda y alta liquidez.';
      } else if (snapshot.score >= 60) {
        justificacion = 'Indicadores financieros estables con tendencia positiva.';
      } else {
        justificacion = 'Monitorear evolución de indicadores en próximos períodos.';
      }

      list.push({ empresa, score, label, justificacion });
    });

    return list.sort((a, b) => b.score - a.score);
  }, [empresas, reportes]);

  const loading = empLoading || repLoading;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">Inversionista</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">Recomendaciones</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
          Recomendaciones generadas a partir del análisis de indicadores financieros de cada empresa.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800 h-32" />
          ))}
        </div>
      ) : recommendations.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-xs text-gray-400 italic">
            No hay suficientes datos financieros para generar recomendaciones. 
            Los reportes deben estar procesados para calcular los indicadores.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {recommendations.map((rec) => (
            <button
              key={rec.empresa.id_empresa}
              onClick={() => navigate(`/company/${rec.empresa.id_empresa}`)}
              className="rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-white/[0.03]"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{rec.empresa.nombre}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{rec.empresa.codigo_bbv}</p>
                </div>
                <span className={`ml-3 rounded-full px-3 py-1 text-xs font-bold ${rec.label.badge}`}>
                  {rec.label.text}
                </span>
              </div>
              <div className="mt-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm tracking-wide text-amber-500">{scoreToStars(rec.score)}</span>
                  <span className="text-xs font-bold text-gray-500">{rec.score}/100</span>
                </div>
                <p className="mt-2 text-xs leading-5 text-gray-600 dark:text-gray-400">
                  {rec.justificacion}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
