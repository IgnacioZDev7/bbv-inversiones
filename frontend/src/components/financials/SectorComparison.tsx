import { useState, useEffect } from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { getReportesByEmpresa } from '../../services/apiServices';
import type { Empresa, ReporteFinanciero } from '../../types/api';

interface SectorComparisonProps {
  companies: Empresa[];
  selectedCompanyId: number;
}

const getVal = (r: ReporteFinanciero, key: string): number => {
  const d = r.datos_extraidos_json || {};
  const val = d[key];
  return typeof val === 'number' ? val : parseFloat(String(val || 0)) || 0;
};

export default function SectorComparison({ companies, selectedCompanyId }: SectorComparisonProps) {
  const [chartData, setChartData] = useState<{ name: string; liquidez: number; endeudamiento: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadComparisonData = async () => {
      setLoading(true);
      try {
        const currentCompany = companies.find(c => c.id_empresa === selectedCompanyId);
        if (!currentCompany) {
            setLoading(false);
            return;
        }

        const currentSector = currentCompany.sector;
        const sectorCompanies = companies.filter(c => c.sector === currentSector).slice(0, 8);

        const dataPromises = sectorCompanies.map(comp => 
            getReportesByEmpresa(comp.id_empresa, { page_size: 1 })
        );
        const results = await Promise.all(dataPromises);
        
        const newChartData = [];
        
        for (let i = 0; i < sectorCompanies.length; i++) {
          const response = results[i];
          if (response.results.length > 0) {
            const latest = response.results[0];
            const activo = getVal(latest, 'total_activo');
            const pasivo = getVal(latest, 'total_pasivo');
            const ac = getVal(latest, 'total_activo_corriente');
            const pc = getVal(latest, 'total_pasivo_corriente');

            newChartData.push({
              name: sectorCompanies[i].codigo_bbv,
              liquidez: pc > 0 ? ac / pc : 0,
              endeudamiento: activo > 0 ? pasivo / activo : 0
            });
          }
        }
        
        setChartData(newChartData);
      } catch (error) {
        console.error("Error al cargar datos comparativos:", error);
      } finally {
        setLoading(false);
      }
    };

    if (companies && companies.length > 0 && selectedCompanyId) {
      loadComparisonData();
    }
  }, [companies, selectedCompanyId]);

  if (loading) return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 flex h-64 items-center justify-center dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
    </div>
  );

  const options: ApexOptions = {
    chart: { type: 'bar', fontFamily: 'Inter, sans-serif', toolbar: { show: false } },
    colors: ['#3b82f6', '#f59e0b'],
    plotOptions: { bar: { horizontal: false, columnWidth: '55%', borderRadius: 4 } },
    xaxis: { 
        categories: chartData.map(d => d.name),
        labels: { style: { colors: '#6b7280' } }
    },
    yaxis: { labels: { formatter: (v) => v.toFixed(2), style: { colors: '#6b7280' } } },
    legend: { position: 'top', horizontalAlign: 'right', labels: { colors: '#6b7280' } },
    grid: { borderColor: '#e5e7eb', strokeDashArray: 4 },
  };

  const series = [
    { name: 'Liquidez Corriente', data: chartData.map(d => d.liquidez) },
    { name: 'Endeudamiento', data: chartData.map(d => d.endeudamiento) }
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <h3 className="text-lg font-bold text-gray-800 dark:text-white/90 mb-1">Comparativa Sectorial</h3>
      <p className="text-xs text-gray-500 mb-6 italic">Último Balance reportado por entidad.</p>
      <div className="h-72">
        <ReactApexChart options={options} series={series} type="bar" height="100%" />
      </div>
    </div>
  );
}
