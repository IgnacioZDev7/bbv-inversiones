import { useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { useApi } from '../../hooks/useApi';
import { getEmpresas, getReportesByEmpresa } from '../../services/apiServices';
import type { Empresa, PaginatedResponse, ReporteFinanciero } from '../../types/api';

// Toolkit Financiero Consolidado
import FinancialAnalysis from '../../components/financials/FinancialAnalysis';
import RiskGauge from '../../components/financials/RiskGauge';

// --- Multimedia: Feedback Sonoro Simple ---
let audioCtx: AudioContext | null = null;
const playBeep = (type: 'normal' | 'riesgoso') => {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);

    if (type === 'riesgoso') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.6, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.start(); osc.stop(audioCtx.currentTime + 0.3);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
      osc.start(); osc.stop(audioCtx.currentTime + 0.1);
    }
  } catch (e) { console.error("Audio failed", e); }
};

const InvestorDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState<number | null>(
    searchParams.get('company') ? Number(searchParams.get('company')) : null
  );

  const { data: companiesData } = useApi<PaginatedResponse<Empresa>>(() => getEmpresas({ page_size: 100 }), []);
  const companies = companiesData?.results ?? [];

  const fetchReports = useCallback(() => {
    if (!selectedId) return Promise.resolve({ count: 0, next: null, previous: null, results: [] });
    return getReportesByEmpresa(selectedId, { page_size: 10 });
  }, [selectedId]);

  const { data: reportsData, isLoading } = useApi<PaginatedResponse<ReporteFinanciero>>(fetchReports, [fetchReports]);

  const processedReports = useMemo(() => 
    (reportsData?.results ?? []).filter(r => r.estado_procesamiento === 'PROCESADO'),
    [reportsData]
  );

  const handleSelect = (id: number) => {
    setSelectedId(id);
    setSearchParams({ company: String(id) });

    // Lógica de feedback sonoro simple tras carga (simulada aquí tras selección)
    if (id % 2 === 0) playBeep('normal'); // Solo para demo de interactividad
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">Monitor de Inversión</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Consulta rápida de salud financiera para inversionistas</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm items-center">
        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Entidad:</label>
        <select
          value={selectedId ?? ''}
          onChange={(e) => handleSelect(Number(e.target.value))}
          className="flex-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-brand-500/10 transition-all cursor-pointer"
        >
          <option value="" disabled>Seleccionar empresa para analizar...</option>
          {companies.map(c => (
            <option key={c.id_empresa} value={c.id_empresa}>{c.nombre} ({c.codigo_bbv})</option>
          ))}
        </select>
      </div>

      {!selectedId && (
        <div className="rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-gray-800 p-20 text-center">
            <p className="text-gray-400 font-medium italic">Seleccione una empresa para desplegar los indicadores de riesgo y solvencia.</p>
        </div>
      )}

      {selectedId && !isLoading && processedReports.length === 0 && (
        <div className="p-10 bg-amber-50 dark:bg-amber-900/10 rounded-3xl text-center border border-amber-100 dark:border-amber-800">
            <p className="text-amber-700 dark:text-amber-400 font-bold">No se encontraron balances procesados para esta entidad.</p>
        </div>
      )}

      {processedReports.length > 0 && (
        <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <FinancialAnalysis reportes={processedReports} />
            </div>
            <div>
                <RiskGauge reportes={processedReports} />
            </div>
            
            <div className="lg:col-span-3 p-8 rounded-3xl bg-blue-600 text-white shadow-xl shadow-blue-600/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-10">
                    <svg className="w-40 h-40" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                </div>
                <h3 className="text-lg font-black uppercase tracking-widest mb-4">Aviso al Inversionista</h3>
                <p className="text-sm leading-relaxed font-medium opacity-90 max-w-2xl">
                    Los indicadores mostrados se basan exclusivamente en el <b>Balance General</b> reportado por la entidad. 
                    Actualmente, el sistema no incluye datos del Estado de Resultados (Ventas/Utilidades), por lo que la clasificación 
                    se enfoca estrictamente en la solvencia patrimonial y liquidez de corto plazo.
                </p>
            </div>
        </div>
      )}
    </div>
  );
};

export default InvestorDashboard;
