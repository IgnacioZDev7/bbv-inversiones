import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

type Tone = 'blue' | 'green' | 'amber' | 'red' | 'violet' | 'slate';

interface AnimatedKpiCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  helper?: string;
  trend?: { value: number; label: string; isUp: boolean };
  tone?: Tone;
  icon?: ReactNode;
  formatFn?: (value: number) => string;
}

const toneAccents: Record<Tone, { light: string; dark: string; ring: string; icon: string }> = {
  blue: {
    light: 'bg-blue-50 text-blue-700 ring-blue-100',
    dark: 'dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20',
    ring: 'ring-blue-200 dark:ring-blue-500/30',
    icon: 'text-blue-600 dark:text-blue-400',
  },
  green: {
    light: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    dark: 'dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20',
    ring: 'ring-emerald-200 dark:ring-emerald-500/30',
    icon: 'text-emerald-600 dark:text-emerald-400',
  },
  amber: {
    light: 'bg-amber-50 text-amber-700 ring-amber-100',
    dark: 'dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20',
    ring: 'ring-amber-200 dark:ring-amber-500/30',
    icon: 'text-amber-600 dark:text-amber-400',
  },
  red: {
    light: 'bg-red-50 text-red-700 ring-red-100',
    dark: 'dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20',
    ring: 'ring-red-200 dark:ring-red-500/30',
    icon: 'text-red-600 dark:text-red-400',
  },
  violet: {
    light: 'bg-violet-50 text-violet-700 ring-violet-100',
    dark: 'dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/20',
    ring: 'ring-violet-200 dark:ring-violet-500/30',
    icon: 'text-violet-600 dark:text-violet-400',
  },
  slate: {
    light: 'bg-slate-50 text-slate-700 ring-slate-100',
    dark: 'dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-500/20',
    ring: 'ring-slate-200 dark:ring-slate-500/30',
    icon: 'text-slate-600 dark:text-slate-400',
  },
};

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export default function AnimatedKpiCard({
  title,
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  helper,
  trend,
  tone = 'blue',
  icon,
  formatFn,
}: AnimatedKpiCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const accent = toneAccents[tone];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
        }
      },
      { threshold: 0.3 },
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [hasAnimated]);

  useEffect(() => {
    if (!hasAnimated) {
      setDisplayValue(0);
      return;
    }

    const duration = 1000;
    const startTime = performance.now();
    const startValue = 0;
    const endValue = value;

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);
      setDisplayValue(startValue + (endValue - startValue) * easedProgress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
      }
    }

    requestAnimationFrame(animate);
  }, [hasAnimated, value]);

  const formatted = formatFn
    ? formatFn(displayValue)
    : `${prefix}${displayValue.toFixed(decimals)}${suffix}`;

  return (
    <div
      ref={ref}
      className="group rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md dark:border-gray-800 dark:bg-white/[0.03] sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {title}
          </p>
          <p className="mt-2 break-words text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
            {formatted}
          </p>
          {trend && (
            <div className="mt-1.5 flex items-center gap-1">
              <span
                className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-medium ${
                  trend.isUp
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                    : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                }`}
              >
                <svg
                  className={`h-3 w-3 ${trend.isUp ? '' : 'rotate-180'}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                </svg>
                {trend.isUp ? '+' : ''}
                {(trend.value * 100).toFixed(1)}%
              </span>
              <span className="text-[11px] text-gray-400 dark:text-gray-500">{trend.label}</span>
            </div>
          )}
        </div>
        {icon && (
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${accent.light} ${accent.dark}`}
          >
            {icon}
          </div>
        )}
      </div>
      {helper && (
        <p className="mt-3 text-xs leading-5 text-gray-500 dark:text-gray-400">{helper}</p>
      )}
    </div>
  );
}
