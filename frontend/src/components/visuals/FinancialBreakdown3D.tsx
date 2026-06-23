import Bar3DChart, { type Bar3DDatum } from './Bar3DChart';

interface FinancialBreakdown3DProps {
  crecimientoPatrimonial: number;
  solvencia: number;
}

export default function FinancialBreakdown3D({ crecimientoPatrimonial, solvencia }: FinancialBreakdown3DProps) {
  const crecScore = Math.min(100, Math.max(0, (crecimientoPatrimonial + 0.15) / 0.25 * 100));
  const solvScore = Math.min(100, Math.max(0, (solvencia / 2.0) * 100));

  const data: Bar3DDatum[] = [
    {
      name: 'Crecimiento Patrimonial',
      value: crecimientoPatrimonial,
      heightValue: crecScore,
      displayValue: `${(crecimientoPatrimonial * 100).toFixed(1)}%`,
      color: '#8b5cf6',
    },
    {
      name: 'Solvencia',
      value: solvencia,
      heightValue: solvScore,
      displayValue: solvencia.toFixed(2),
      color: '#10b981',
    },
  ];

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
          Desglose 3D
        </h3>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 font-medium">
          Crecimiento patrimonial y solvencia
        </p>
      </div>

      <Bar3DChart data={data} maxValue={100} height={360} />

      <div className="mt-3 flex items-center justify-between text-[10px] font-medium text-gray-400">
        <span>Score ponderado: 20 pts crecimiento · 10 pts solvencia</span>
        <span>Click + arrastra para rotar · Scroll para zoom</span>
      </div>
    </section>
  );
}
