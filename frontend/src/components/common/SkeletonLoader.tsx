interface SkeletonLoaderProps {
  type?: 'card' | 'chart' | 'table' | 'kpi';
  count?: number;
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-3">
          <div className="h-3 w-24 rounded-md bg-gray-200 dark:bg-gray-700" />
          <div className="h-7 w-32 rounded-md bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="h-10 w-10 rounded-xl bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="mt-3 h-3 w-48 rounded-md bg-gray-200 dark:bg-gray-700" />
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-4 space-y-2">
        <div className="h-4 w-48 rounded-md bg-gray-200 dark:bg-gray-700" />
        <div className="h-3 w-64 rounded-md bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="flex h-[300px] items-end gap-2 px-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-md bg-gray-200 dark:bg-gray-700"
            style={{ height: `${30 + Math.random() * 70}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-4 h-4 w-36 rounded-md bg-gray-200 dark:bg-gray-700" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="h-4 flex-1 rounded-md bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 w-24 rounded-md bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 w-24 rounded-md bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 w-24 rounded-md bg-gray-200 dark:bg-gray-700" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SkeletonKpi() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="h-3 w-20 rounded-md bg-gray-200 dark:bg-gray-700" />
          <div className="h-8 w-28 rounded-md bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="h-10 w-10 shrink-0 rounded-xl bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="mt-3 h-3 w-36 rounded-md bg-gray-200 dark:bg-gray-700" />
    </div>
  );
}

const skeletons: Record<string, React.ComponentType> = {
  card: SkeletonCard,
  chart: SkeletonChart,
  table: SkeletonTable,
  kpi: SkeletonKpi,
};

export default function SkeletonLoader({ type = 'card', count = 1 }: SkeletonLoaderProps) {
  const Component = skeletons[type] || SkeletonCard;
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Component key={i} />
      ))}
    </>
  );
}
