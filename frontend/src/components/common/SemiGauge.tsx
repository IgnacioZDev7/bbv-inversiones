interface SemiGaugeProps {
  /** Progress value on a 0-100 scale, used for the arc fill. */
  value: number;
  color: string;
  size?: number;
  valueText: string;
  caption?: string;
}

export default function SemiGauge({ value, color, size = 160, valueText, caption }: SemiGaugeProps) {
  const progress = Math.max(0, Math.min(100, value));
  const height = size * 0.62;

  return (
    <div className="relative shrink-0" style={{ width: size, height }}>
      <svg viewBox="0 0 200 120" width={size} height={height} className="block">
        <path
          d="M 10 110 A 90 90 0 0 1 190 110"
          fill="none"
          stroke="currentColor"
          strokeWidth="16"
          strokeLinecap="round"
          pathLength={100}
          className="text-gray-100 dark:text-gray-800"
        />
        <path
          d="M 10 110 A 90 90 0 0 1 190 110"
          fill="none"
          stroke={color}
          strokeWidth="16"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={100}
          strokeDashoffset={100 - progress}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
        <span className="text-2xl font-black leading-none text-gray-900 dark:text-white">{valueText}</span>
        {caption && <span className="mt-0.5 text-[10px] font-semibold text-gray-400 dark:text-gray-500">{caption}</span>}
      </div>
    </div>
  );
}
