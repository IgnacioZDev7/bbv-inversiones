import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import PageMeta from '../../components/common/PageMeta';
import { getEmpresas, getReportesByEmpresa } from '../../services/apiServices';
import type { Empresa, ReporteFinanciero } from '../../types/api';
import MetricsTable from '../../components/bbv/MetricsTable';
import KpiCards from '../../components/bbv/KpiCards';
import HistoricalChart from '../../components/bbv/HistoricalChart';
import FinancialAnalysis from '../../components/bbv/FinancialAnalysis';
import SectorComparison from '../../components/bbv/SectorComparison';
import RiskGauge from '../../components/bbv/RiskGauge';
import FinancialChart from '../../components/bbv/FinancialChart';
import Simulator from '../../components/bbv/Simulator';

// --- Multimedia: Feedback Sonoro Simple ---
let audioCtx: AudioContext | null = null;
const playBeep = (type: 'normal' | 'riesgoso') => {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'riesgoso') {
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(300, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.3);
      gainNode.gain.setValueAtTime(0.6, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.3);
    } else {
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.1);
    }
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

// --- Tipado local para componentes de UI ---
interface Metric {
  id: number;
  reporte: number;
  gestion: number;
  trimestre: number;
  activos: string | null;
  pasivos: string | null;
  patrimonio: string | null;
  activo_corriente: string | null;
  pasivo_corriente: string | null;
  liquidez_corriente: string | null;
  endeudamiento: string | null;
  // Preparado para futuro (Estado de Resultados)
  ingresos?: string | null;
  utilidad?: string | null;
}

const mapReporteToMetric = (r: ReporteFinanciero): Metric => {
  const d = r.datos_extraidos_json || {};
  
  // Mapeo corregido según claves reales del backend (JSON Balance)
  const a = Number(d.total_activo || 0);
  const p = Number(d.total_pasivo || 0);
  const pat = Number(d.total_patrimonio || 0);
  const ac = Number(d.total_activo_corriente || 0);
  const pc = Number(d.total_pasivo_corriente || 0);

  // Cálculos de Ratios (Protección contra división por cero)
  const liq = pc > 0 ? (ac / pc).toFixed(4) : "0";
  const end = a > 0 ? (p / a).toFixed(4) : "0";

  return {
    id: r.id_reporte,
    reporte: r.id_reporte,
    gestion: r.gestion,
    trimestre: r.trimestre || 0,
    activos: String(a),
    pasivos: String(p),
    patrimonio: String(pat),
    activo_corriente: String(ac),
    pasivo_corriente: String(pc),
    liquidez_corriente: liq,
    endeudamiento: end,
    // Marcadores para el futuro: ingresos_totales / utilidad_neta
    ingresos: d.ingresos_totales ? String(d.ingresos_totales) : null,
    utilidad: d.utilidad_neta ? String(d.utilidad_neta) : null,
  };
};

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCompanyId = searchParams.get('company') || '';

  const setSelectedCompany = (id: string) => {
    setSearchParams({ company: id }, { replace: true });
  };

  const [companies, setCompanies] = useState<Empresa[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        setLoading(true);
        // Traemos una lista amplia para el selector
        const response = await getEmpresas({ page_size: 100 });
        setCompanies(response.results);
        setError(null);
        
        if (response.results.length > 0 && !selectedCompanyId) {
            setSelectedCompany(String(response.results[0].id_empresa));
        }
      } catch {
        setError('Error al cargar la lista de empresas. Verifica la conexión con el servidor.');
      } finally {
        setLoading(false);
      }
    };
    loadCompanies();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const loadMetrics = async () => {
      if (!selectedCompanyId) return;

      setLoading(true);
      try {
        const response = await getReportesByEmpresa(Number(selectedCompanyId), { page_size: 50 });
        const mapped = response.results
          .filter(r => r.estado_procesamiento === 'PROCESADO')
          .map(mapReporteToMetric);
          
        setMetrics(mapped);
        setError(null);
        
        if (mapped.length > 0) {
          const sorted = [...mapped].sort((a, b) => {
            if (a.gestion !== b.gestion) return b.gestion - a.gestion;
            return b.trimestre - a.trimestre;
          });
          const latest = sorted[0];
          const previous = sorted.length > 1 ? sorted[1] : null;

          const nLiquidez = Number(latest.liquidez_corriente || 0);
          const nEndeudamiento = Number(latest.endeudamiento || 0);
          const nPatrimonioAct = Number(latest.patrimonio || 0);
          const nPatrimonioPrev = Number(previous?.patrimonio || 0);
          const varPatrimonio = (nPatrimonioPrev !== 0) ? ((nPatrimonioAct - nPatrimonioPrev) / nPatrimonioPrev) : 0;

          const isRiesgoso = (nLiquidez < 1.0 || nEndeudamiento > 0.8 || varPatrimonio < -0.10);
          playBeep(isRiesgoso ? 'riesgoso' : 'normal');
        }
      } catch {
        setMetrics([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadMetrics();
  }, [selectedCompanyId]);

  const isGlobalView = !selectedCompanyId;

  return (
    <>
      <PageMeta
        title="Dashboard Financiero | Inversiones BBV"
        description="Dashboard del sistema de inversiones de la Bolsa Boliviana de Valores"
      />
      
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <h2 className="mb-2 sm:mb-0 text-xl font-bold text-gray-800 dark:text-white/90">
            Monitor Financiero
          </h2>
          
          <div className="flex items-center gap-2">
            <label htmlFor="company-select" className="text-xs font-medium text-gray-500 dark:text-gray-400 hidden sm:block">
              Selección rápida:
            </label>
            <select
              id="company-select"
              className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompany(e.target.value)}
              disabled={loading}
            >
              <option value="" disabled>Selecciona una empresa...</option>
              {companies.map((comp) => (
                <option key={comp.id_empresa} value={comp.id_empresa}>
                  {comp.nombre} ({comp.codigo_bbv})
                </option>
              ))}
            </select>
          </div>
        </div>

        {error ? (
          <div className="rounded-lg bg-red-50 p-4 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        ) : loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent dark:border-brand-400 dark:border-t-transparent"></div>
          </div>
        ) : isGlobalView ? (
          <div className="rounded-lg bg-gray-50 p-8 text-center text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
            Por favor, selecciona una empresa del menú lateral o superior para empezar a analizar.
          </div>
        ) : metrics.length === 0 ? (
          <div className="rounded-lg bg-gray-50 p-8 text-center text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
            Aún no hay reportes procesados para esta entidad.
          </div>
        ) : (
          <div key={selectedCompanyId} className="animate-fade-in space-y-8">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                <FinancialAnalysis metrics={metrics} />
              </div>
              <div>
                <RiskGauge metrics={metrics} />
              </div>
            </div>

            <Simulator companies={companies as any} />

            <FinancialChart 
              metrics={metrics as any} 
              title={`Evolución Patrimonial - ${companies.find(c => String(c.id_empresa) === selectedCompanyId)?.nombre || ''}`}
            />

            <KpiCards metrics={metrics} />
            <HistoricalChart metrics={metrics} />
            <SectorComparison companies={companies as any} selectedCompanyId={selectedCompanyId} />
            <MetricsTable metrics={metrics} />
          </div>
        )}
      </div>
    </>
  );
}
