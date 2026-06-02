import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: NameType; value: ValueType; color?: string; dataKey?: string }>;
  label?: string;
  formatter?: (value: number) => string;
  labelFormatter?: (label: string) => string;
}

export default function CustomTooltip({
  active,
  payload,
  label,
  formatter = (v: number) => v.toLocaleString('es-BO'),
  labelFormatter,
}: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="min-w-[180px] rounded-xl border border-gray-200/50 bg-white/95 p-3 shadow-lg backdrop-blur-sm dark:border-gray-700/50 dark:bg-gray-900/95">
      <p className="mb-2 text-xs font-semibold text-gray-600 dark:text-gray-400">
        {labelFormatter ? labelFormatter(label ?? '') : label}
      </p>
      <div className="space-y-1.5">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-gray-700 dark:text-gray-300">
                {entry.name}
              </span>
            </div>
            <span className="text-xs font-semibold text-gray-900 dark:text-white">
              {formatter(Number(entry.value))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CustomTooltipContent({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-xl border border-gray-200/50 bg-white/95 p-3 shadow-lg backdrop-blur-sm dark:border-gray-700/50 dark:bg-gray-900/95">
      <p className="mb-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400">{label}</p>
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-3 text-xs">
            <span className="text-gray-500 dark:text-gray-400">{entry.name}</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
