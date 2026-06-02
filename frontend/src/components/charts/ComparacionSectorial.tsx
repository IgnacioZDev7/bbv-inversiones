import { useMemo, useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { Empresa } from '../../types/api';
import { getReportesByEmpresa } from '../../services/apiServices';
import SkeletonLoader from '../common/SkeletonLoader';
import ErrorState from '../common/ErrorState';
import EmptyState from '../common/EmptyState';
import { formatPercent } from '../../utils/financialMetrics';
import CustomTooltip from './CustomTooltip';

interface ComparacionSectorialProps {
  companies: Empresa[];
  currentCompanyId: number;
  currentEndeudamiento: number;
  currentLiquidez: number;
}

export default function ComparacionSectorial({
  companies,
  currentCompanyId,
  currentEndeudamiento,
  currentLiquidez,
}: ComparacionSectorialProps) {
  const currentCompany = companies.find((c) => c.id_empresa === currentCompanyId);
  const sectorCompanies = useMemo(
    () => companies.filter((c) => c.sector === currentCompany?.sector && c.id_empresa !== currentCompanyId),
    [companies, currentCompany, currentCompanyId],
  );

  const sectorData = useMemo(() => {
    if (sectorCompanies.length === 0) return [];
    return sectorCompanies.slice(0, 5);
  }, [sectorCompanies]);

  if (sectorCompanies.length === 0) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="mb-4 text-sm font-bold text-gray-900 dark:text-white">
          Comparación Sectorial
        </h3>
        <EmptyState message="No hay otras empresas en el mismo sector para comparar." />
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
          Comparación Sectorial
        </h3>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          {currentCompany?.sector_nombre || 'Mismo sector'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SectorBarChart
          title="Endeudamiento"
          dataKey="endeudamiento"
          companies={sectorData}
          currentValue={currentEndeudamiento}
          formatter={formatPercent}
          barColor="#d97706"
          lowerIsBetter
        />
        <SectorBarChart
          title="Liquidez"
          dataKey="liquidez"
          companies={sectorData}
          currentValue={currentLiquidez}
          formatter={(v) => v.toFixed(2)}
          barColor="#059669"
          lowerIsBetter={false}
        />
      </div>
    </section>
  );
}

interface SectorBarChartProps {
  title: string;
  dataKey: string;
  companies: Empresa[];
  currentValue: number;
  formatter: (v: number) => string;
  barColor: string;
  lowerIsBetter: boolean;
}

function SectorBarChart({
  title,
  dataKey,
  companies,
  currentValue,
  formatter,
  barColor,
  lowerIsBetter,
}: SectorBarChartProps) {
  const [companyReports, setCompanyReports] = useState<
    Record<number, { endeudamiento: number; liquidez: number }>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSectorData = async () => {
      setLoading(true);
      setError(null);
      try {
        const results: Record<number, { endeudamiento: number; liquidez: number }> = {};
        await Promise.all(
          companies.map(async (company) => {
            try {
              const res = await getReportesByEmpresa(company.id_empresa, {
                page_size: 1,
                estado_procesamiento: 'PROCESADO',
              });
              const report = res.results[0];
              if (report?.datos_extraidos_json) {
                const d = report.datos_extraidos_json;
                const activo = Number(d.total_activo || 0);
                const pasivo = Number(d.total_pasivo || 0);
                const ac = Number(d.total_activo_corriente || 0);
                const pc = Number(d.total_pasivo_corriente || 0);
                results[company.id_empresa] = {
                  endeudamiento: activo > 0 ? pasivo / activo : 0,
                  liquidez: pc > 0 ? ac / pc : 0,
                };
              }
            } catch {
              // skip company if fetch fails
            }
          }),
        );
        setCompanyReports(results);
      } catch {
        setError('Error al cargar datos del sector.');
      } finally {
        setLoading(false);
      }
    };

    if (companies.length > 0) fetchSectorData();
    else setLoading(false);
  }, [companies]);

  const chartData = useMemo(() => {
    const rows = companies
      .filter((c) => companyReports[c.id_empresa])
      .map((c) => ({
        name: c.codigo_bbv || c.nombre.slice(0, 12),
        [dataKey]: dataKey === 'endeudamiento'
          ? companyReports[c.id_empresa].endeudamiento
          : companyReports[c.id_empresa].liquidez,
      }))
      .sort((a, b) =>
        lowerIsBetter
          ? (a[dataKey] as number) - (b[dataKey] as number)
          : (b[dataKey] as number) - (a[dataKey] as number),
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

  if (error) {
    return (
      <div>
        <h4 className="mb-3 text-xs font-semibold text-gray-600 dark:text-gray-400">{title}</h4>
        <ErrorState message={error} />
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div>
        <h4 className="mb-3 text-xs font-semibold text-gray-600 dark:text-gray-400">{title}</h4>
        <EmptyState message="Sin datos del sector." />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400">{title}</h4>
        <span className="text-[11px] text-gray-400 dark:text-gray-500">
          Tu empresa: {formatter(currentValue)}
        </span>
      </div>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={[
              ...chartData,
              {
                name: 'Tu empresa',
                [dataKey]: currentValue,
              },
            ]}
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
              width={70}
            />
            <Tooltip
              content={<CustomTooltip formatter={(v) => formatter(v)} />}
              cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
            />
            <Bar
              dataKey={dataKey}
              name={title}
              fill={barColor}
              radius={[0, 4, 4, 0]}
              maxBarSize={20}
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
