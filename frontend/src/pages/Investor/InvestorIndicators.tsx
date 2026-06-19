import { useMemo, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { getAllEmpresas, getReportesByEmpresa } from '../../services/apiServices';
import type { Empresa, ReporteFinanciero } from '../../types/api';
import { buildFinancialSnapshot, formatMoneyCompact, formatRatio } from '../../utils/financialMetrics';
import CompanySelector from '../../components/financials/CompanySelector';
import FinancialHealthBanner from '../../components/financials/FinancialHealthBanner';
import RiskGauge from '../../components/financials/RiskGauge';

export default function InvestorIndicators() {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: empresas, isLoading: empLoading } = useApi<Empresa[]>(() => getAllEmpresas(), []);

  const { data: reportes, isLoading: repLoading } = useApi<ReporteFinanciero[]>(
    () => selectedId ? getReportesByEmpresa(selectedId, { page_size: 50 }).then(r => r.results) : Promise.resolve([]),
    [selectedId]
  );

  const snapshot = useMemo(
    () => reportes ? buildFinancialSnapshot(reportes) : null,
    [reportes]
  );

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">Inversionista</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">Indicadores Financieros</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
          Análisis detallado de liquidez, endeudamiento, patrimonio y capital de trabajo.
        </p>
      </div>

      <div className="max-w-sm">
        <CompanySelector
          companies={empresas ?? []}
          selectedCompanyId={selectedId}
          onChange={setSelectedId}
          isLoading={empLoading}
        />
      </div>

      {!selectedId ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-xs text-gray-400 italic">Selecciona una empresa para ver sus indicadores.</p>
        </div>
      ) : repLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800 h-28" />
          ))}
        </div>
      ) : !snapshot || !snapshot.latest ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-xs text-gray-400 italic">No hay datos financieros disponibles para esta empresa.</p>
        </div>
      ) : (
        <>
          <FinancialHealthBanner
            liquidez={snapshot.liquidez}
            endeudamiento={snapshot.endeudamiento}
            trendPatrimonio={snapshot.variacionPatrimonio}
            solvencia={snapshot.solvencia}
            companyId={selectedId}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Liquidez</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{formatRatio(snapshot.liquidez)}</p>
              <p className="mt-0.5 text-xs text-gray-400">Activo corriente / Pasivo corriente</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Endeudamiento</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{(snapshot.endeudamiento * 100).toFixed(1)}%</p>
              <p className="mt-0.5 text-xs text-gray-400">Pasivo / Activo</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Patrimonio</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{formatMoneyCompact(snapshot.patrimonio)}</p>
              <p className="mt-0.5 text-xs text-gray-400">Total patrimonio neto</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Capital de Trabajo</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{formatMoneyCompact(snapshot.capitalTrabajo)}</p>
              <p className="mt-0.5 text-xs text-gray-400">AC - PC</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
              <p className="text-sm font-bold text-gray-900 dark:text-white mb-4">Tendencia patrimonial</p>
              {snapshot.points.length === 0 ? (
                <p className="text-xs text-gray-400 italic">Sin datos históricos.</p>
              ) : (
                <div className="space-y-3">
                  {[...snapshot.points].reverse().map((p) => (
                    <div key={p.label} className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0 dark:border-gray-700">
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{p.label}</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{formatMoneyCompact(p.patrimonio)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <RiskGauge snapshot={snapshot} />
          </div>
        </>
      )}
    </div>
  );
}
