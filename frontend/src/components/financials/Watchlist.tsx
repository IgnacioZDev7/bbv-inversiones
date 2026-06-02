import type { Empresa } from '../../types/api';

interface WatchlistProps {
  companies: Empresa[];
  selectedCompanyId: number | null;
  onSelect: (companyId: number) => void;
  onRemove?: (companyId: number) => void;
}

/**
 * Watchlist presents user-selected companies without inventing financial data.
 * The parent decides how the list is persisted and how company selection works.
 */
export default function Watchlist({
  companies,
  selectedCompanyId,
  onSelect,
  onRemove,
}: WatchlistProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Lista de seguimiento</h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Empresas guardadas localmente por el inversionista.
          </p>
        </div>
        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
          {companies.length}
        </span>
      </div>

      {companies.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-gray-200 p-6 text-center dark:border-gray-800">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Aun no hay empresas guardadas. Selecciona una empresa y agregala a seguimiento.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-2">
          {companies.map((company) => {
            const isActive = selectedCompanyId === company.id_empresa;
            return (
              <div
                key={company.id_empresa}
                className={`flex items-center gap-3 rounded-xl border p-3 transition ${
                  isActive
                    ? 'border-blue-200 bg-blue-50 dark:border-blue-500/30 dark:bg-blue-500/10'
                    : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-800 dark:bg-transparent dark:hover:bg-white/[0.04]'
                }`}
              >
                <button type="button" onClick={() => onSelect(company.id_empresa)} className="min-w-0 flex-1 text-left">
                  <span className="block truncate text-sm font-bold text-gray-900 dark:text-white">
                    {company.nombre}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {company.codigo_bbv} · {company.sector_nombre}
                  </span>
                </button>
                {onRemove && (
                  <button
                    type="button"
                    onClick={() => onRemove(company.id_empresa)}
                    className="rounded-lg px-2 py-1 text-xs font-bold text-gray-500 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-800"
                  >
                    Quitar
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
