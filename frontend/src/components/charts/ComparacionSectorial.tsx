import { useMemo, useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip,
} from 'recharts';
import type { Empresa } from '../../types/api';
import { getReportesByEmpresa } from '../../services/apiServices';
import SkeletonLoader from '../common/SkeletonLoader';
import ErrorState from '../common/ErrorState';
import EmptyState from '../common/EmptyState';
import { formatPercent } from '../../utils/financialMetrics';
import CustomTooltip from './CustomTooltip';

interface CompanyMetrics {
  endeudamiento: number;
  liquidez: number;
  roa: number | null;
  roe: number | null;
}

interface ComparacionSectorialProps {
  companies: Empresa[];
  currentCompanyId: number;
  currentSector?: number;
  currentEndeudamiento: number;
  currentLiquidez: number;
  currentRoa: number | null;
  currentRoe: number | null;
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
  { key: 'roa', title: 'ROA', color: '#2563eb', lowerIsBetter: false, formatter: formatPercent },
  { key: 'roe', title: 'ROE', color: '#8b5cf6', lowerIsBetter: false, formatter: formatPercent },
];

export default function ComparacionSectorial({
  companies,
  currentCompanyId,
  currentSector,
  currentEndeudamiento,
  currentLiquidez,
  currentRoa,
  currentRoe,
}: ComparacionSectorialProps) {
  const [companyReports, setCompanyReports] = useState<Record<number, CompanyMetrics>>({});
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  console.log('[ComparacionSectorial] companies.length:', companies.length);
  console.log('[ComparacionSectorial] currentCompanyId:', currentCompanyId);
  console.log('[ComparacionSectorial] currentSector (prop):', currentSector, typeof currentSector);
  console.log('[ComparacionSectorial] all sectors in companies:', [...new Set(companies.map((c) => `${c.sector} (${typeof c.sector})`))]);

  const currentCompany = useMemo(
    () => companies.find((c) => c.id_empresa === currentCompanyId),
    [companies, currentCompanyId],
  );
  console.log('[ComparacionSectorial] currentCompany found:', !!currentCompany);
  console.log('[ComparacionSectorial] currentCompany.sector:', currentCompany?.sector, typeof currentCompany?.sector);
  console.log('[ComparacionSectorial] currentCompany.sector_nombre:', currentCompany?.sector_nombre);

  const sectorValue = currentSector ?? (currentCompany?.sector as number | undefined);
  console.log('[ComparacionSectorial] sectorValue used for filter:', sectorValue, typeof sectorValue);

  const sectorCompanies = useMemo(() => {
    if (sectorValue == null) return [];
    const filtered = companies.filter((c) => {
      const match =
        c.sector === sectorValue ||
        String(c.sector) === String(sectorValue) ||
        c.id_empresa === currentCompanyId;
      return match && c.id_empresa !== currentCompanyId;
    });
    console.log('[ComparacionSectorial] sectorCompanies found:', filtered.length);
    filtered.forEach((c) => console.log('  -', c.nombre, 'sector:', c.sector));
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
              page_size: 1,
              estado_procesamiento: 'PROCESADO',
            });
            const reports = Array.isArray(res) ? res : res.results;
            const report = reports?.[0];
            if (report?.datos_extraidos_json) {
              const d = report.datos_extraidos_json;
              const activo = Number(d.total_activo || 0);
              const pasivo = Number(d.total_pasivo || 0);
              const ac = Number(d.total_activo_corriente || 0);
              const pc = Number(d.total_pasivo_corriente || 0);
              results[company.id_empresa] = {
                endeudamiento: activo > 0 ? pasivo / activo : 0,
                liquidez: pc > 0 ? ac / pc : 0,
                roa: d.roa != null ? Number(d.roa) : null,
                roe: d.roe != null ? Number(d.roe) : null,
              };
              console.log(`[ComparacionSectorial] ${company.nombre}:`, results[company.id_empresa]);
            } else {
              console.log(`[ComparacionSectorial] ${company.nombre}: no report found`);
            }
          } catch (err) {
            console.log(`[ComparacionSectorial] ${company.nombre}: fetch error`, err);
          }
        }),
      );
      console.log('[ComparacionSectorial] total companyReports built:', Object.keys(results).length);
      setCompanyReports(results);
      setLoading(false);
    };
    fetchSectorData();
  }, [sectorData]);

  const currentValues: Record<string, number | null> = {
    endeudamiento: currentEndeudamiento,
    liquidez: currentLiquidez,
    roa: currentRoa,
    roe: currentRoe,
  };

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
    ? [...chartData, { name: 'Tu empresa', value: currentValue }]
    : chartData;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400">{title}</h4>
        {currentValue != null && (
          <span className="text-[11px] text-gray-400 dark:text-gray-500">
            Actual: {formatter(currentValue)}
          </span>
        )}
      </div>
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={fullData}
            margin={{ top: 4, right: 4, left: -12, bottom: 0 }}
            layout="vertical"
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(148, 163, 184, 0.15)"
              horizontal={false}
            />
            <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={72}
            />
            <Tooltip
              content={<CustomTooltip formatter={(v) => formatter(v)} />}
              cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
            />
            <Bar
              dataKey="value"
              name={title}
              fill={barColor}
              radius={[0, 4, 4, 0]}
              maxBarSize={18}
              label={{
                position: 'right' as const,
                fontSize: 10,
                fill: '#6b7280',
                formatter: (v: any) => formatter(Number(v)),
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
