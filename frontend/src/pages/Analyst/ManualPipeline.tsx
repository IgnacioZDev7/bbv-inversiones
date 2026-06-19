import { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { getAllEmpresas, ejecutarPipeline } from '../../services/apiServices';
import type { Empresa } from '../../types/api';

const ManualPipeline: React.FC = () => {
  const [empresaId, setEmpresaId] = useState<number | ''>('');
  const [gestion, setGestion] = useState('');
  const [trimestre, setTrimestre] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const { data: empresas, isLoading: empLoading } = useApi<Empresa[]>(
    () => getAllEmpresas(),
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresaId || !gestion || !trimestre) return;

    setSubmitting(true);
    setResult(null);

    try {
      await ejecutarPipeline(Number(empresaId), Number(gestion), Number(trimestre));
      setResult({ ok: true, message: 'Pipeline ejecutado exitosamente.' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al ejecutar el pipeline.';
      setResult({ ok: false, message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = empresaId !== '' && gestion.trim() !== '' && trimestre.trim() !== '';

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400">Analista</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">Ejecutar Pipeline Manual</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Dispara manualmente la descarga y procesamiento de un reporte financiero.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-5 max-w-xl"
      >
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Empresa</label>
          <select
            value={empresaId}
            onChange={(e) => setEmpresaId(e.target.value === '' ? '' : Number(e.target.value))}
            required
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
          >
            <option value="">Seleccionar empresa\u2026</option>
            {empLoading ? (
              <option disabled>Cargando\u2026</option>
            ) : (
              (empresas ?? []).map((emp) => (
                <option key={emp.id_empresa} value={emp.id_empresa}>
                  {emp.nombre} ({emp.codigo_bbv})
                </option>
              ))
            )}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Gesti&oacute;n (A&ntilde;o)</label>
            <input
              type="number"
              placeholder="Ej: 2024"
              value={gestion}
              onChange={(e) => setGestion(e.target.value)}
              required
              min={2000}
              max={2100}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Trimestre</label>
            <select
              value={trimestre}
              onChange={(e) => setTrimestre(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
            >
              <option value="">Seleccionar\u2026</option>
              <option value={1}>Trimestre 1</option>
              <option value={2}>Trimestre 2</option>
              <option value={3}>Trimestre 3</option>
              <option value={4}>Trimestre 4</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting || !isValid}
          className="w-full rounded-xl bg-brand-500 px-4 py-3 text-sm font-bold text-white disabled:opacity-50 hover:bg-brand-600 transition-all flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Ejecutando\u2026
            </>
          ) : (
            'Ejecutar Pipeline'
          )}
        </button>

        {result && (
          <div
            className={`rounded-xl p-4 text-sm font-medium ${
              result.ok
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
                : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
            }`}
          >
            {result.ok ? (
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {result.message}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {result.message}
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
};

export default ManualPipeline;
