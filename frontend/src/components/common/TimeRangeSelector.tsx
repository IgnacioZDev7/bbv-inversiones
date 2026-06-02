import { useMemo } from 'react';

type RangeKey = '1y' | '3y' | '5y' | 'all';

interface TimeRangeSelectorProps {
  value: RangeKey;
  onChange: (range: RangeKey) => void;
}

const ranges: { key: RangeKey; label: string }[] = [
  { key: '1y', label: '1 año' },
  { key: '3y', label: '3 años' },
  { key: '5y', label: '5 años' },
  { key: 'all', label: 'Todo' },
];

export function filterByRange<T extends { gestion: number }>(
  data: T[],
  range: RangeKey,
): T[] {
  if (range === 'all') return data;
  const currentYear = new Date().getFullYear();
  const limit = range === '1y' ? 1 : range === '3y' ? 3 : 5;
  const minYear = currentYear - limit;
  return data.filter((d) => d.gestion >= minYear);
}

export type { RangeKey };

export default function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  const currentIndex = useMemo(
    () => ranges.findIndex((r) => r.key === value),
    [value],
  );

  return (
    <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 dark:border-gray-700 dark:bg-gray-800/50">
      {ranges.map((range, index) => (
        <button
          key={range.key}
          onClick={() => onChange(range.key)}
          className={`relative rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
            value === range.key
              ? 'bg-white text-brand-500 shadow-sm dark:bg-gray-700 dark:text-brand-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
          style={
            value === range.key
              ? {
                  transform: `translateX(${(currentIndex - index) * 0}px)`,
                }
              : undefined
          }
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}
