import type { Empresa } from '../../types/api';

interface CompanySelectorProps {
  companies: Empresa[];
  selectedCompanyId: number | null;
  onChange: (companyId: number) => void;
  isLoading?: boolean;
  label?: string;
}

/**
 * CompanySelector is the canonical company switcher for financial dashboards.
 * It is intentionally API-agnostic: pages own data fetching and URL syncing.
 */
export default function CompanySelector({
  companies,
  selectedCompanyId,
  onChange,
  isLoading = false,
  label = 'Empresa',
}: CompanySelectorProps) {
  return (
    <label className="block w-full">
      <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </span>
      <select
        value={selectedCompanyId ?? ''}
        onChange={(event) => onChange(Number(event.target.value))}
        disabled={isLoading || companies.length === 0}
        className="h-12 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 dark:border-gray-800 dark:bg-gray-900 dark:text-white dark:focus:border-blue-400"
      >
        <option value="" disabled>
          {isLoading ? 'Cargando empresas...' : 'Selecciona una empresa'}
        </option>
        {companies.map((company) => (
          <option key={company.id_empresa} value={company.id_empresa}>
            {company.nombre} ({company.codigo_bbv})
          </option>
        ))}
      </select>
    </label>
  );
}
