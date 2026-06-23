import type { ReactNode } from 'react';

interface GradientTextProps {
  children: ReactNode;
  className?: string;
  colors?: [string, string, string];
}

export default function GradientText({
  children,
  className = '',
  colors = ['#465fff', '#7592ff', '#465fff'],
}: GradientTextProps) {
  return (
    <span
      className={`gradient-text-shimmer bg-clip-text text-transparent ${className}`}
      style={{
        backgroundImage: `linear-gradient(90deg, ${colors[0]}, ${colors[1]}, ${colors[2]})`,
      }}
    >
      {children}
    </span>
  );
}
