import { useState, useRef } from 'react';
import { ejecutarPipeline, getAllReportes } from '../../services/apiServices';

type Mode = 'single' | 'range';
type RunStatus = 'pending' | 'running' | 'success' | 'skipped' | 'error';

interface RunItem {
  gestion: number;
  trimestre: number;
  status: RunStatus;
  message?: string;
}

interface PipelineRangeRunnerProps {
  empresaId: number;
  onDone?: () => void;
}

const STATUS_STYLES: Record<RunStatus, string> = {
  pending: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
  running: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
  success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  skipped: 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500',
  error: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
};

const STATUS_LABELS: Record<RunStatus, string> = {
  pending: 'En espera',
  running: 'Procesando…',
  success: 'Éxito',
  skipped: 'Ya procesado',
  error: 'Error',
};

export default function PipelineRangeRunner({ empresaId, onDone }: PipelineRangeRunnerProps) {
  const [mode, setMode] = useState<Mode>('single');

  const currentYear = new Date().getFullYear();
  const [gestion, setGestion] = useState(currentYear);
  const [trimestre, setTrimestre] = useState(Math.ceil((new Date().getMonth() + 1) / 3));

  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  const [running, setRunning] = useState(false);
  const [items, setItems] = useState<RunItem[]>([]);
  const cancelRef = useRef(false);

  const isRangeValid = desde !== '' && hasta !== '' && Number(desde) <= Number(hasta);
  const canRun = mode === 'single' ? !running : isRangeValid && !running;

  const runSingle = async () => {
    setRunning(true);
    setItems([{ gestion, trimestre, status: 'running' }]);
    try {
      await ejecutarPipeline(empresaId, gestion, trimestre);
      setItems([{ gestion, trimestre, status: 'success' }]);
    } catch (err: any) {
      setItems([{ gestion, trimestre, status: 'error', message: err?.response?.data?.error || 'Error al ejecutar el pipeline.' }]);
    } finally {
      setRunning(false);
      onDone?.();
    }
  };

  const runRange = async () => {
    const desdeNum = Number(desde);
    const hastaNum = Number(hasta);
    const pairs: Array<{ gestion: number; trimestre: number }> = [];
    for (let g = desdeNum; g <= hastaNum; g++) {
      for (const t of [1, 2, 3, 4]) pairs.push({ gestion: g, trimestre: t });
    }

    setRunning(true);
    cancelRef.current = false;

    let processedSet = new Set<string>();
    try {
      const existing = await getAllReportes({ empresa: empresaId, estado_procesamiento: 'PROCESADO' });
      processedSet = new Set(existing.map((r) => `${r.gestion}-${r.trimestre}`));
    } catch {
      // Si falla la consulta, simplemente no omitimos nada y se reprocesa todo.
    }

    const initialItems: RunItem[] = pairs.map((p) => ({
      ...p,
      status: processedSet.has(`${p.gestion}-${p.trimestre}`) ? 'skipped' : 'pending',
    }));
    setItems(initialItems);

    for (let i = 0; i < pairs.length; i++) {
      if (cancelRef.current) break;
      const pair = pairs[i];
      if (processedSet.has(`${pair.gestion}-${pair.trimestre}`)) continue;

      setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, status: 'running' } : it)));
      try {
        await ejecutarPipeline(empresaId, pair.gestion, pair.trimestre);
        setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, status: 'success' } : it)));
      } catch (err: any) {
        setItems((prev) => prev.map((it, idx) => (
          idx === i ? { ...it, status: 'error', message: err?.response?.data?.error || 'Error' } : it
        )));
      }
      await new Promise((resolve) => setTimeout(resolve, 400));
    }

    setRunning(false);
    onDone?.();
  };

  const handleCancel = () => {
    cancelRef.current = true;
  };

  const summary = items.length > 0 ? {
    success: items.filter((i) => i.status === 'success').length,
    skipped: items.filter((i) => i.status === 'skipped').length,
    error: items.filter((i) => i.status === 'error').length,
    total: items.length,
  } : null;

  return (
    <div className="space-y-4">
      {/* Tabs de modo */}
      <div className="flex rounded-xl border border-gray-200 p-0.5 dark:border-gray-700">
        <button
          type="button"
          onClick={() => setMode('single')}
          disabled={running}
          className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wide transition-all ${
            mode === 'single' ? 'bg-brand-500 text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
        >
          Periodo específico
        </button>
        <button
          type="button"
          onClick={() => setMode('range')}
          disabled={running}
          className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wide transition-all ${
            mode === 'range' ? 'bg-brand-500 text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
        >
          Rango de años
        </button>
      </div>

      {mode === 'single' ? (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Gestión</label>
            <input
              type="number"
              value={gestion}
              disabled={running}
              onChange={(e) => setGestion(Number(e.target.value))}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500/20 outline-none transition-all disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Trimestre</label>
            <select
              value={trimestre}
              disabled={running}
              onChange={(e) => setTrimestre(Number(e.target.value))}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500/20 outline-none transition-all disabled:opacity-50"
            >
              <option value={1}>Trimestre 1</option>
              <option value={2}>Trimestre 2</option>
              <option value={3}>Trimestre 3</option>
              <option value={4}>Trimestre 4</option>
            </select>
          </div>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Desde año</label>
              <input
                type="number"
                placeholder="Ej: 2022"
                value={desde}
                disabled={running}
                onChange={(e) => setDesde(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Hasta año</label>
              <input
                type="number"
                placeholder="Ej: 2026"
                value={hasta}
                disabled={running}
                onChange={(e) => setHasta(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all disabled:opacity-50"
              />
            </div>
          </div>
          <p className="mt-2 text-[11px] text-gray-400">
            Se procesarán los 4 trimestres de cada año. Los periodos que ya estén marcados como "Procesado" se omiten automáticamente.
          </p>
          {desde !== '' && hasta !== '' && !isRangeValid && (
            <p className="mt-1 text-[11px] font-bold text-red-500">"Hasta año" debe ser mayor o igual a "Desde año".</p>
          )}
        </div>
      )}

      {/* Progreso */}
      {items.length > 0 && (
        <div className="max-h-56 space-y-1 overflow-y-auto custom-scrollbar rounded-xl border border-gray-100 bg-gray-50/50 p-2 dark:border-gray-700 dark:bg-gray-900/30">
          {items.map((it, idx) => (
            <div key={`${it.gestion}-${it.trimestre}-${idx}`} className="rounded-lg px-2 py-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-700 dark:text-gray-300">{it.gestion} T{it.trimestre}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLES[it.status]}`}>
                  {STATUS_LABELS[it.status]}
                </span>
              </div>
              {it.status === 'error' && it.message && (
                <p className="mt-0.5 truncate text-[10px] text-red-400" title={it.message}>{it.message}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {summary && !running && (
        <div className="rounded-xl bg-gray-50 p-3 text-xs font-bold text-gray-600 dark:bg-gray-900/30 dark:text-gray-300">
          Finalizado: {summary.success} éxito{summary.success !== 1 ? 's' : ''}
          {summary.skipped > 0 ? `, ${summary.skipped} omitido${summary.skipped !== 1 ? 's' : ''}` : ''}
          {summary.error > 0 ? `, ${summary.error} con error` : ''} de {summary.total} periodo{summary.total !== 1 ? 's' : ''}.
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        {running && (
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-xl border border-gray-200 dark:border-gray-700 px-5 py-2.5 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
          >
            Cancelar proceso
          </button>
        )}
        <button
          type="button"
          onClick={mode === 'single' ? runSingle : runRange}
          disabled={!canRun}
          className="rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {running ? 'Ejecutando…' : mode === 'single' ? 'Ejecutar' : 'Actualizar Rango'}
        </button>
      </div>
    </div>
  );
}
