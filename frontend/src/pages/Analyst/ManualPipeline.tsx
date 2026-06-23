import { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { getAllEmpresas } from '../../services/apiServices';
import type { Empresa } from '../../types/api';
import PipelineRangeRunner from '../../components/financials/PipelineRangeRunner';

const ManualPipeline: React.FC = () => {
  const [empresaId, setEmpresaId] = useState<number | ''>('');

  const { data: empresas, isLoading: empLoading } = useApi<Empresa[]>(
    () => getAllEmpresas(),
    []
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400">Analista</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">Ejecutar Pipeline Manual</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Dispara manualmente la descarga y procesamiento de reportes financieros, ya sea un periodo puntual o un rango completo de años.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-5 max-w-xl">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Empresa</label>
          <select
            value={empresaId}
            onChange={(e) => setEmpresaId(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
          >
            <option value="">Seleccionar empresa…</option>
            {empLoading ? (
              <option disabled>Cargando…</option>
            ) : (
              (empresas ?? []).map((emp) => (
                <option key={emp.id_empresa} value={emp.id_empresa}>
                  {emp.nombre} ({emp.codigo_bbv})
                </option>
              ))
            )}
          </select>
        </div>

        {empresaId !== '' ? (
          <PipelineRangeRunner empresaId={empresaId} />
        ) : (
          <p className="text-xs italic text-gray-400">Selecciona una empresa para continuar.</p>
        )}
      </div>
    </div>
  );
};

export default ManualPipeline;
