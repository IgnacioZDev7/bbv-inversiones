interface OrbitLoaderProps {
  size?: number;
  color?: string;
}

export default function OrbitLoader({ size = 20, color = '#465fff' }: OrbitLoaderProps) {
  return (
    <span
      className="relative inline-block shrink-0"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span
        className="absolute inset-0 rounded-full border-2 border-current opacity-20"
        style={{ color }}
      />
      <span
        className="absolute inset-0 animate-spin rounded-full border-2 border-transparent"
        style={{ borderTopColor: color, borderRightColor: color, animationDuration: '0.7s' }}
      />
      <span
        className="absolute inset-1 animate-spin rounded-full border-2 border-transparent opacity-60"
        style={{ borderBottomColor: color, animationDuration: '1.1s', animationDirection: 'reverse' }}
      />
    </span>
  );
}
