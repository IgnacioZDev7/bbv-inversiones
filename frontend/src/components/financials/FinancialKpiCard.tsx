import type { ReactNode } from 'react';

type Tone = 'blue' | 'green' | 'amber' | 'red' | 'slate' | 'violet';

interface FinancialKpiCardProps {
  title: string;
  value: string;
  helper?: string;
  tone?: Tone;
  icon?: ReactNode;
}

const toneClasses: Record<Tone, { bg: string, text: string, dot: string, border: string }> = {
  blue: { 
    bg: 'bg-blue-50 dark:bg-blue-500/5', 
    text: 'text-blue-700 dark:text-blue-400', 
    dot: 'bg-blue-500',
    border: 'border-blue-100 dark:border-blue-500/20'
  },
  green: { 
    bg: 'bg-emerald-50 dark:bg-emerald-500/5', 
    text: 'text-emerald-700 dark:text-emerald-400', 
    dot: 'bg-emerald-500',
    border: 'border-emerald-100 dark:border-emerald-500/20'
  },
  amber: { 
    bg: 'bg-amber-50 dark:bg-amber-500/5', 
    text: 'text-amber-700 dark:text-amber-400', 
    dot: 'bg-amber-500',
    border: 'border-amber-100 dark:border-amber-500/20'
  },
  red: { 
    bg: 'bg-red-50 dark:bg-red-500/5', 
    text: 'text-red-700 dark:text-red-400', 
    dot: 'bg-red-500',
    border: 'border-red-100 dark:border-red-500/20'
  },
  slate: { 
    bg: 'bg-slate-50 dark:bg-slate-500/5', 
    text: 'text-slate-700 dark:text-slate-400', 
    dot: 'bg-slate-500',
    border: 'border-slate-100 dark:border-slate-500/20'
  },
  violet: { 
    bg: 'bg-violet-50 dark:bg-violet-500/5', 
    text: 'text-violet-700 dark:text-violet-400', 
    dot: 'bg-violet-500',
    border: 'border-violet-100 dark:border-violet-500/20'
  },
};

/**
 * Professional compact financial metric card.
 * Minimalist design inspired by MarketScreener and Yahoo Finance.
 */
export default function FinancialKpiCard({
  title,
  value,
  helper,
  tone = 'blue',
}: FinancialKpiCardProps) {
  const styles = toneClasses[tone];
  
  return (
    <div className={`rounded-xl border ${styles.border} ${styles.bg} p-4 shadow-sm transition-all hover:shadow-md`}>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
                {title}
            </span>
        </div>
        
        <div className="flex items-baseline justify-between mt-1">
            <span className="text-lg font-black text-gray-900 dark:text-white tracking-tighter">
                {value}
            </span>
            {helper && (
                <span className={`text-[10px] font-bold ${styles.text} uppercase`}>
                    {helper}
                </span>
            )}
        </div>
      </div>
    </div>
  );
}
