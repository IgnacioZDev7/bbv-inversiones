interface ChevronFlowProps {
  direction: 'up' | 'down';
  color: string;
  size?: number;
}

const PATHS = {
  up: 'M2 12L12 2L22 12',
  down: 'M2 2L12 12L22 2',
};

export default function ChevronFlow({ direction, color, size = 14 }: ChevronFlowProps) {
  const animClass = direction === 'up' ? 'chevron-flow-up' : 'chevron-flow-down';
  const path = PATHS[direction];
  const chevronHeight = size * 0.6;
  const stackHeight = size * 1.5;

  return (
    <span
      className="relative inline-block shrink-0"
      style={{ width: size, height: stackHeight }}
      aria-hidden="true"
    >
      {[0, 1, 2].map((i) => (
        <svg
          key={i}
          className={animClass}
          style={{
            position: 'absolute',
            left: 0,
            top: i * (chevronHeight * 0.55),
            animationDelay: `${i * 0.18}s`,
            color,
          }}
          width={size}
          height={chevronHeight}
          viewBox="0 0 24 14"
          fill="none"
        >
          <path d={path} stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ))}
    </span>
  );
}
