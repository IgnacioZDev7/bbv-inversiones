import { useState, useEffect, useRef } from 'react';
import * as LightweightCharts from 'lightweight-charts';
import { useFinancialSimulator } from '../../agents/useFinancialSimulator';
import type { IndicatorInfo } from '../../types/api';

const { createChart, ColorType } = LightweightCharts;

interface SimulatorProps {
  companies: any[];
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4M12 8h.01" />
    </svg>
  );
}

const KPI_TOOLTIPS: Record<string, string> = {
  cagr: 'Tasa de Crecimiento Anual Compuesto (CAGR). Representa la tasa media de crecimiento anual del patrimonio histórico de la empresa, expresada como porcentaje.',
  volatility: 'Desviación estándar de los rendimientos históricos. Mide cuánto fluctúa el patrimonio de la empresa respecto a su promedio. A mayor volatilidad, mayor incertidumbre.',
  backtesting_error: 'Error MAPE (Mean Absolute Percentage Error) del backtesting. Indica qué tan precisas habrían sido las proyecciones del modelo si se hubieran aplicado en el pasado.',
  roi: 'Retorno sobre la Inversión (ROI). Ganancia total proyectada como porcentaje del capital inicial invertido, asumiendo el horizonte temporal seleccionado.',
};

export default function Simulator({ companies }: SimulatorProps) {
  const { simulate, loading, error, result } = useFinancialSimulator();
  
  const [params, setParams] = useState({
    empresa: companies.length > 0 ? companies[0].id_empresa : '',
    monto: 10000,
    anios: 5,
    escenario: 'base' as 'conservador' | 'base' | 'optimista',
    modo: 'avanzado' as 'basico' | 'avanzado'
  });

  const [tooltip, setTooltip] = useState<string | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);

  const handleSimulate = () => {
    if (!params.empresa) return;
    simulate({
      empresa: Number(params.empresa),
      monto: params.monto,
      anios: params.anios,
      escenario: params.escenario,
      modo: params.modo
    });
  };

  useEffect(() => {
    if (!chartContainerRef.current || !result) return;

    if (chartRef.current) {
      chartRef.current.remove();
    }

    const chart = createChart(chartContainerRef.current, {
      height: 350,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: '#1e293b' },
        horzLines: { color: '#1e293b' },
      },
      timeScale: {
        visible: true,
        borderColor: '#1e293b',
      },
      rightPriceScale: {
        visible: true,
        borderColor: '#1e293b',
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
    });

    if (result.modo === 'avanzado') {
      const p75Series = chart.addLineSeries({ color: '#10b981', lineWidth: 1, lineStyle: 2, title: 'Optimista (P75)' });
      const baseSeries = chart.addAreaSeries({ 
        lineColor: '#3b82f6', 
        topColor: 'rgba(59, 130, 246, 0.4)', 
        bottomColor: 'rgba(59, 130, 246, 0.0)', 
        lineWidth: 3, 
        title: 'Mediana (P50)' 
      });
      const p25Series = chart.addLineSeries({ color: '#ef4444', lineWidth: 1, lineStyle: 2, title: 'Pesimista (P25)' });

      const baseYear = 2024;
      const tBase = result.serie.map(i => ({ time: `${baseYear + i.year}-01-01`, value: i.value }));
      const tP25 = result.serie.map(i => ({ time: `${baseYear + i.year}-01-01`, value: i.p25 }));
      const tP75 = result.serie.map(i => ({ time: `${baseYear + i.year}-01-01`, value: i.p75 }));

      p75Series.setData(tP75 as any);
      baseSeries.setData(tBase as any);
      p25Series.setData(tP25 as any);
    } else {
      const baseSeries = chart.addAreaSeries({ 
        lineColor: '#3b82f6', 
        topColor: 'rgba(59, 130, 246, 0.4)', 
        bottomColor: 'rgba(59, 130, 246, 0.0)', 
        lineWidth: 3, 
        title: 'CAGR Directo' 
      });
      const baseYear = 2024;
      const tBase = result.serie.map(i => ({ time: `${baseYear + i.year}-01-01`, value: i.value }));
      baseSeries.setData(tBase as any);
    }

    chart.timeScale().fitContent();
    chartRef.current = chart;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, [result]);

  const getConfidenceColor = (score: string) => {
    switch (score) {
      case 'Alta': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'Media': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      default: return 'text-red-500 bg-red-500/10 border-red-500/20';
    }
  };

  const getIndicatorColor = (estado: string) => {
    if (['Saludable', 'Sólida', 'Sano', 'Bajo', 'Positivo', 'Aceptable'].includes(estado)) return 'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-500/10 dark:border-green-500/20';
    if (['Moderado', 'Elevado', 'Precaria', 'Débil'].includes(estado)) return 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20';
    return 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-500/10 dark:border-red-500/20';
  };

  const renderKpiCard = (label: string, value: string, tooltipKey: string, color?: string) => (
    <div className="p-6 rounded-3xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.05] group relative">
      <div className="flex items-center gap-1.5 mb-2">
        <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest">{label}</p>
        <button
          onMouseEnter={() => setTooltip(KPI_TOOLTIPS[tooltipKey])}
          onMouseLeave={() => setTooltip(null)}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <InfoIcon className="h-3 w-3 text-gray-400 hover:text-brand-500" />
        </button>
      </div>
      <h4 className={`text-xl font-black ${color || 'text-gray-900 dark:text-white'}`}>
        {value}
      </h4>
    </div>
  );

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-black text-gray-900 dark:text-white">
              Simulador <span className="text-brand-500">IA</span>
            </h3>
            {result && (
              <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getConfidenceColor(result.confidence_score)}`}>
                Confianza {result.confidence_score}
              </div>
            )}
          </div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Proyección basada en comportamiento patrimonial histórico.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
            <button 
              onClick={() => setParams({...params, modo: 'basico'})}
              className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${params.modo === 'basico' ? 'bg-white text-brand-600 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-500'}`}
            >
              Básico
            </button>
            <button 
              onClick={() => setParams({...params, modo: 'avanzado'})}
              className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${params.modo === 'avanzado' ? 'bg-white text-brand-600 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-500'}`}
            >
              Avanzado
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="md:col-span-2 space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Entidad Financiera</label>
          <select
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 text-sm font-bold dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 outline-none focus:ring-4 focus:ring-brand-500/10 transition-all appearance-none"
            value={params.empresa}
            onChange={(e) => setParams({ ...params, empresa: e.target.value })}
          >
            <option value="">Seleccionar empresa...</option>
            {companies.map(c => (
              <option key={c.id_empresa} value={c.id_empresa}>{c.nombre}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Capital Inicial (Bs.)</label>
          <input
            type="number"
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 text-sm font-bold dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 outline-none focus:ring-4 focus:ring-brand-500/10 transition-all"
            value={params.monto}
            onChange={(e) => setParams({ ...params, monto: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Horizonte (Años)</label>
          <input
            type="number"
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 text-sm font-bold dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 outline-none focus:ring-4 focus:ring-brand-500/10 transition-all"
            value={params.anios}
            onChange={(e) => setParams({ ...params, anios: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-6 mb-10">
        <div className="flex-1 w-full space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Escenario de Crecimiento</label>
          <div className="flex rounded-2xl bg-gray-100 p-1.5 dark:bg-gray-800">
            {['conservador', 'base', 'optimista'].map((e) => (
              <button
                key={e}
                onClick={() => setParams({...params, escenario: e as any})}
                className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${
                  params.escenario === e 
                  ? 'bg-white text-brand-600 shadow-xl dark:bg-gray-700 dark:text-white' 
                  : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={handleSimulate}
          disabled={loading || !params.empresa}
          className="w-full md:w-auto px-12 py-4 bg-brand-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-brand-600 active:scale-95 transition-all shadow-2xl shadow-brand-500/30 disabled:opacity-50 mt-5 md:mt-6"
        >
          {loading ? 'Simulando...' : 'Ejecutar'}
        </button>
      </div>

      {error && (
        <div className="mb-8 p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs font-bold text-red-500 animate-shake">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-10 animate-fade-in">
          {tooltip && (
            <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 text-[10px] text-gray-300 leading-relaxed shadow-2xl transition-opacity">
              {tooltip}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {renderKpiCard('CAGR', `${(result.cagr * 100).toFixed(2)}%`, 'cagr')}
            {renderKpiCard('Volatilidad (σ)', `${(result.volatility * 100).toFixed(2)}%`, 'volatility')}
            {renderKpiCard('Error Validación', `${result.backtesting_error}%`, 'backtesting_error', 'text-brand-600 dark:text-brand-400')}
            {renderKpiCard('ROI Proyectado', `${result.roi.toFixed(1)}%`, 'roi', 'text-green-500')}
          </div>

          {result.health_score != null && (
            <div className={`p-5 rounded-2xl border ${
              result.health_score >= 80 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
              result.health_score >= 60 ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
              result.health_score >= 40 ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400' :
              'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1">
                    Score de Salud Financiera (Global)
                  </p>
                  <p className="text-[9px] opacity-70 font-medium">
                    35% Liquidez · 35% Endeudamiento · 20% Crecimiento Patrimonial · 10% Solvencia
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black">{result.health_score}</span>
                  <span className="text-sm opacity-70">/100</span>
                  <p className="text-[10px] font-black uppercase tracking-widest">{result.health_label}</p>
                </div>
              </div>
            </div>
          )}

          {result.warnings && result.warnings.length > 0 && (
            <div className="space-y-2">
              {result.warnings.map((w, i) => (
                <div key={i} className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-600 dark:text-amber-400 leading-relaxed">
                  ⚠ {w}
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-2 text-center">
                  Proyección de Valor Patrimonial (Eje X: Años · Eje Y: Bs.)
                </p>
                <div ref={chartContainerRef} className="h-[380px] w-full" />
              </div>
              {result.modo === 'avanzado' && (
                <div className="flex flex-wrap items-center justify-center gap-6 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50" />
                    P50 — Mediana (escenario base)
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-green-500 shadow-lg shadow-green-500/50" />
                    P75 — Optimista (CAGR + 1σ)
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500 shadow-lg shadow-red-500/50" />
                    P25 — Pesimista (CAGR − 1σ)
                  </span>
                </div>
              )}
            </div>
            
            <div className="space-y-6">
              <div className="p-8 rounded-[2.5rem] bg-slate-950 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 h-32 w-32 bg-brand-500/10 rounded-full blur-3xl group-hover:bg-brand-500/20 transition-all" />
                <p className="text-[10px] text-brand-400 uppercase font-black tracking-[0.3em] mb-3">
                  Valor Futuro Estimado
                </p>
                <p className="text-[8px] text-gray-500 uppercase font-bold tracking-wider mb-1">
                  Capital final proyectado a {params.anios} año(s)
                </p>
                <h4 className="text-4xl font-black text-white mb-8 tracking-tighter">
                  Bs. {result.valor_futuro.toLocaleString()}
                </h4>
                
                <div className="space-y-5">
                  <div className="p-5 rounded-3xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                    <h5 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                      Metodología del Modelo
                    </h5>
                    <p className="text-[10px] text-gray-400 leading-relaxed font-medium italic">
                      {result.modo === 'avanzado' 
                        ? 'Modelo probabilístico: CAGR histórico ± 1σ genera los percentiles P25 y P75.'
                        : 'Modelo determinístico: CAGR histórico aplicado linealmente año a año.'}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[9px] text-gray-500 leading-relaxed font-bold uppercase tracking-widest">
                      Nota de Transparencia:
                    </p>
                    <p className="text-[10px] text-brand-500/80 leading-relaxed font-black italic">
                      Las proyecciones se basan en comportamiento histórico. El rendimiento pasado no garantiza resultados futuros.
                    </p>
                  </div>
                </div>
              </div>

              {result.outliers && (
                <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                  <p className="text-[10px] text-amber-500 leading-relaxed font-black uppercase tracking-widest mb-1">
                    Gestión de Outliers:
                  </p>
                  <p className="text-[10px] text-amber-500/70 leading-relaxed font-medium italic">
                    Se excluyeron variaciones extremas (&gt;300%) para evitar distorsión en la proyección.
                  </p>
                </div>
              )}
            </div>
          </div>

          {result.indicators && Object.keys(result.indicators).length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">
                Indicadores Financieros Reales
              </h4>
              <p className="text-[10px] text-gray-400 font-medium">
                Calculados con los datos contables disponibles del último reporte procesado.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(result.indicators).map(([key, ind]) => {
                  const info = ind as IndicatorInfo;
                  return (
                    <div key={key} className={`p-5 rounded-2xl border ${getIndicatorColor(info.estado)}`}>
                      <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest mb-1">
                        {key.replace(/_/g, ' ')}
                      </p>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-lg font-black text-gray-900 dark:text-white">
                          {info.valor !== null && info.valor !== undefined
                            ? key.includes('crecimiento')
                              ? `${(info.valor * 100).toFixed(1)}%`
                              : info.valor.toLocaleString()
                            : '—'}
                        </span>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${getIndicatorColor(info.estado)}`}>
                          {info.estado}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 leading-relaxed">
                        {info.descripcion}
                      </p>
                      {(info as any).formula && (
                        <p className="text-[8px] text-gray-400 font-mono mt-2 pt-2 border-t border-gray-100 dark:border-white/10">
                          {(info as any).formula} = {info.valor !== null && info.valor !== undefined
                            ? key.includes('crecimiento')
                              ? `${(info.valor * 100).toFixed(1)}%`
                              : info.valor.toLocaleString()
                            : '—'}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
