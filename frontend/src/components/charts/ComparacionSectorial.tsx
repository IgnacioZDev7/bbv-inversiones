import { useMemo, useState, useEffect } from 'react';
import type { Empresa } from '../../types/api';
import { getReportesByEmpresa } from '../../services/apiServices';
import SkeletonLoader from '../common/SkeletonLoader';
import ErrorState from '../common/ErrorState';
import EmptyState from '../common/EmptyState';
import { formatPercent, getHealthScoreBreakdown } from '../../utils/financialMetrics';
import Bar3DChart from '../visuals/Bar3DChart';
import SectorRadarChart from './SectorRadarChart';

interface CompanyMetrics {
  endeudamiento: number;
  liquidez: number;
  solvencia: number;
  crecimiento: number;
}

interface ComparacionSectorialProps {
  companies: Empresa[];
  currentCompanyId: number;
  currentSector?: number;
  currentEndeudamiento: number;
  currentLiquidez: number;
  currentCrecimiento?: number;
  currentSolvencia?: number;
}

interface MetricDef {
  key: keyof CompanyMetrics;
  title: string;
  color: string;
  lowerIsBetter: boolean;
  formatter: (v: number) => string;
}

const METRICS: MetricDef[] = [
  { key: 'endeudamiento', title: 'Endeudamiento', color: '#d97706', lowerIsBetter: true, formatter: formatPercent },
  { key: 'liquidez', title: 'Liquidez', color: '#059669', lowerIsBetter: false, formatter: (v) => v.toFixed(2) },
];

export default function ComparacionSectorial({
  companies,
  currentCompanyId,
  currentSector,
  currentEndeudamiento,
  currentLiquidez,
  currentCrecimiento = 0,
  currentSolvencia = 0,
}: ComparacionSectorialProps) {
  const [companyReports, setCompanyReports] = useState<Record<number, CompanyMetrics>>({});
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const currentCompany = useMemo(
    () => companies.find((c) => c.id_empresa === currentCompanyId),
    [companies, currentCompanyId],
  );

  const sectorValue = currentSector ?? (currentCompany?.sector as number | undefined);

  const sectorCompanies = useMemo(() => {
    if (sectorValue == null) return [];
    const filtered = companies.filter((c) => {
      const match =
        c.sector === sectorValue ||
        String(c.sector) === String(sectorValue) ||
        c.id_empresa === currentCompanyId;
      return match && c.id_empresa !== currentCompanyId;
    });
    return filtered;
  }, [companies, sectorValue, currentCompanyId]);

  const sectorData = useMemo(() => sectorCompanies.slice(0, 6), [sectorCompanies]);

  useEffect(() => {
    if (sectorData.length === 0) { setLoading(false); return; }
    const fetchSectorData = async () => {
      setLoading(true);
      setFetchError(false);
      const results: Record<number, CompanyMetrics> = {};
      await Promise.all(
        sectorData.map(async (company) => {
          try {
            const res = await getReportesByEmpresa(company.id_empresa, {
              page_size: 2,
              estado_procesamiento: 'PROCESADO',
            });
            const reports = Array.isArray(res) ? res : res.results;
            const sorted = [...(reports ?? [])].sort(
              (a, b) => b.gestion - a.gestion || (b.trimestre ?? 0) - (a.trimestre ?? 0),
            );
            const report = sorted[0];
            const previous = sorted[1];
            if (report?.datos_extraidos_json) {
              const d = report.datos_extraidos_json;
              const activo = Number(d.total_activo || 0);
              const pasivo = Number(d.total_pasivo || 0);
              const ac = Number(d.total_activo_corriente || 0);
              const pc = Number(d.total_pasivo_corriente || 0);
              const patrimonio = Number(d.total_patrimonio || 0);
              const previousPatrimonio = previous?.datos_extraidos_json
                ? Number(previous.datos_extraidos_json.total_patrimonio || 0)
                : 0;
              results[company.id_empresa] = {
                endeudamiento: activo > 0 ? pasivo / activo : 0,
                liquidez: pc > 0 ? ac / pc : 0,
                solvencia: pasivo > 0 ? activo / pasivo : 0,
                crecimiento: previousPatrimonio !== 0 ? (patrimonio - previousPatrimonio) / previousPatrimonio : 0,
              };
            }
          } catch {
            // silent
          }
        }),
      );
      setCompanyReports(results);
      setLoading(false);
    };
    fetchSectorData();
  }, [sectorData]);

  const currentValues: Record<string, number | null> = {
    endeudamiento: currentEndeudamiento,
    liquidez: currentLiquidez,
  };

  const radarData = useMemo(() => {
    const peers = Object.values(companyReports);
    if (peers.length === 0) return null;

    const sectorAvg: CompanyMetrics = {
      endeudamiento: peers.reduce((s, p) => s + p.endeudamiento, 0) / peers.length,
      liquidez: peers.reduce((s, p) => s + p.liquidez, 0) / peers.length,
      solvencia: peers.reduce((s, p) => s + p.solvencia, 0) / peers.length,
      crecimiento: peers.reduce((s, p) => s + p.crecimiento, 0) / peers.length,
    };

    const empresaBreakdown = getHealthScoreBreakdown({
      liquidez: currentLiquidez,
      endeudamiento: currentEndeudamiento,
      crecimientoPatrimonial: currentCrecimiento,
      solvencia: currentSolvencia,
    });
    const sectorBreakdown = getHealthScoreBreakdown({
      liquidez: sectorAvg.liquidez,
      endeudamiento: sectorAvg.endeudamiento,
      crecimientoPatrimonial: sectorAvg.crecimiento,
      solvencia: sectorAvg.solvencia,
    });

    const toPct = (b: { score: number; max: number }) => Math.round((b.score / b.max) * 100);

    return [
      { axis: 'Liquidez', empresa: toPct(empresaBreakdown.liquidez), sector: toPct(sectorBreakdown.liquidez) },
      { axis: 'Endeudamiento', empresa: toPct(empresaBreakdown.endeudamiento), sector: toPct(sectorBreakdown.endeudamiento) },
      { axis: 'Crecimiento', empresa: toPct(empresaBreakdown.crecimiento), sector: toPct(sectorBreakdown.crecimiento) },
      { axis: 'Solvencia', empresa: toPct(empresaBreakdown.solvencia), sector: toPct(sectorBreakdown.solvencia) },
    ];
  }, [companyReports, currentLiquidez, currentEndeudamiento, currentCrecimiento, currentSolvencia]);

  if (sectorData.length === 0) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="mb-4 text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
          Comparación Sectorial
        </h3>
        <EmptyState message="No hay otras empresas en el mismo sector para comparar." />
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
          Comparación Sectorial
        </h3>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          {currentCompany?.sector_nombre || 'Mismo sector'}
        </p>
      </div>

      {fetchError && !loading && <div className="mb-4"><ErrorState message="Error al cargar datos del sector." /></div>}

      {!loading && radarData && (
        <div className="mb-6 border-b border-gray-100 pb-6 dark:border-gray-700">
          <SectorRadarChart data={radarData} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {METRICS.map((metric) => (
          <SectorBarChart
            key={metric.key}
            title={metric.title}
            dataKey={metric.key}
            companies={sectorData}
            companyReports={companyReports}
            currentValue={currentValues[metric.key]}
            formatter={metric.formatter}
            barColor={metric.color}
            lowerIsBetter={metric.lowerIsBetter}
            loading={loading}
          />
        ))}
      </div>
    </section>
  );
}

interface SectorBarChartProps {
  title: string;
  dataKey: string;
  companies: Empresa[];
  companyReports: Record<number, CompanyMetrics>;
  currentValue: number | null;
  formatter: (v: number) => string;
  barColor: string;
  lowerIsBetter: boolean;
  loading: boolean;
}

function SectorBarChart({
  title,
  dataKey,
  companies,
  companyReports,
  currentValue,
  formatter,
  barColor,
  lowerIsBetter,
  loading,
}: SectorBarChartProps) {
  const chartData = useMemo(() => {
    const rows = companies
      .filter((c) => {
        const v = companyReports[c.id_empresa]?.[dataKey as keyof CompanyMetrics];
        return v != null;
      })
      .map((c) => ({
        name: c.codigo_bbv || c.nombre.slice(0, 12),
        value: companyReports[c.id_empresa][dataKey as keyof CompanyMetrics] as number,
      }))
      .sort((a, b) =>
        lowerIsBetter ? a.value - b.value : b.value - a.value,
      );

    return rows;
  }, [companies, companyReports, dataKey, lowerIsBetter]);

  if (loading) {
    return (
      <div>
        <h4 className="mb-3 text-xs font-semibold text-gray-600 dark:text-gray-400">{title}</h4>
        <SkeletonLoader type="chart" />
      </div>
    );
  }

  if (chartData.length === 0 && currentValue == null) {
    return (
      <div>
        <h4 className="mb-3 text-xs font-semibold text-gray-600 dark:text-gray-400">{title}</h4>
        <EmptyState message="Sin datos para comparar." />
      </div>
    );
  }

  const fullData = currentValue != null
    ? [...chartData, { name: 'Tu empresa', value: currentValue, highlight: true, badge: 'Tu empresa' }]
    : chartData;

  return (
    <Bar3DChart
      title={title}
      subtitle="Explorador 3D interactivo"
      data={fullData}
      formatter={formatter}
      defaultColor={barColor}
      height={280}
    />
  );
}
