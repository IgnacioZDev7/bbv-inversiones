import { useState, useEffect } from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { getReportesByEmpresa } from '../../services/apiServices';
import type { Empresa, ReporteFinanciero } from '../../types/api';

interface SectorComparisonProps {
  companies: Empresa[];
  selectedCompanyId: string;
}

const mapReporteToChartData = (r: ReporteFinanciero) => {
  const d = r.datos_extraidos_json || {};
  return {
    liquidez: Number(d.liquidez_corriente || 0),
    endeudamiento: Number(d.endeudamiento || 0)
  };
};

export default function SectorComparison({ companies, selectedCompanyId }: SectorComparisonProps) {
  const [chartData, setChartData] = useState<{ name: string; liquidez: number; endeudamiento: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadComparisonData = async () => {
      setLoading(true);
      try {
        const currentCompany = companies.find(c => String(c.id_empresa) === String(selectedCompanyId));
        if (!currentCompany) {
            setLoading(false);
            return;
        }

        const currentSector = currentCompany.sector;
        
        // Filtrar empresas del mismo sector
        const sectorCompanies = companies.filter(c => c.sector === currentSector);

        // Limitamos a un máximo de 5 empresas para evitar saturar de peticiones (Riesgo de rendimiento)
        // En una implementación futura, el backend debería proveer un endpoint de comparación.
        const topCompanies = sectorCompanies.slice(0, 10);

        const dataPromises = topCompanies.map(comp => 
            getReportesByEmpresa(comp.id_empresa, { page_size: 1 })
        );
        const results = await Promise.all(dataPromises);
        
        const newChartData = [];
        
        for (let i = 0; i < topCompanies.length; i++) {
          const response = results[i];
          if (response.results.length > 0) {
            const latest = response.results[0];
            const metrics = mapReporteToChartData(latest);
            
            newChartData.push({
              name: topCompanies[i].codigo_bbv,
              ...metrics
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

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] mb-6 flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent dark:border-brand-400 dark:border-t-transparent"></div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] mb-6 flex h-64 items-center justify-center text-gray-500">
        No hay datos suficientes para la comparación sectorial.
      </div>
    );
  }

  const options: ApexOptions = {
    chart: {
      type: 'bar',
      fontFamily: 'Inter, sans-serif',
      toolbar: { show: false },
      dropShadow: {
        enabled: true,
        top: 8,
        left: 0,
        blur: 5,
        color: '#000',
        opacity: 0.08
      }
    },
    colors: ['#3b82f6', '#f59e0b'], 
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: 'vertical',
        shadeIntensity: 0.25,
        opacityFrom: 1,
        opacityTo: 0.75,
        stops: [0, 100]
      }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        borderRadius: 6,
        dataLabels: {
          position: 'top', 
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => val.toFixed(2),
      offsetY: -20,
      style: {
        fontSize: '11px',
        fontWeight: 600,
        colors: ['#87909e'], 
      },
      background: {
        enabled: false,
      }
    },
    stroke: {
      show: true,
      width: 3,
      colors: ['transparent'],
    },
    xaxis: {
      categories: chartData.map(d => d.name),
      labels: {
        style: {
          colors: '#6b7280',
          fontWeight: 500,
        },
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      title: {
        text: 'Valor de Ratio',
        style: { color: '#6b7280', fontWeight: 500 },
      },
      labels: {
        style: { colors: '#6b7280' },
        formatter: (val) => val.toFixed(2),
      },
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      labels: { colors: '#6b7280' },
      markers: {
        offsetX: 0,
      }
    },
    grid: {
      borderColor: '#e5e7eb',
      strokeDashArray: 4,
      padding: {
        top: 20, 
      }
    },
    tooltip: {
      y: {
        formatter: (val) => val.toFixed(3)
      }
    }
  };

  const series = [
    {
      name: 'Liquidez Corriente',
      data: chartData.map(d => d.liquidez)
    },
    {
      name: 'Endeudamiento',
      data: chartData.map(d => d.endeudamiento)
    }
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] mb-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">
          Comparativa Sectorial (Último Período)
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Ratio de Liquidez y Endeudamiento frente a entidades del mismo sector.
        </p>
      </div>
      <div className="h-80">
        <ReactApexChart options={options} series={series} type="bar" height="100%" />
      </div>
    </div>
  );
}
