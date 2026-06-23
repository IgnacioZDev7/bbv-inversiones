import { useState, type MouseEvent, type ButtonHTMLAttributes } from 'react';

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

type RippleButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

let rippleId = 0;

/** Botón con el mismo comportamiento que un <button>, agregando un efecto de "ripple" al hacer clic. */
export default function RippleButton({ children, className, onClick, ...rest }: RippleButtonProps) {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const id = ++rippleId;
    setRipples((prev) => [
      ...prev,
      { id, x: e.clientX - rect.left - size / 2, y: e.clientY - rect.top - size / 2, size },
    ]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 650);
    onClick?.(e);
  };

  return (
    <button {...rest} onClick={handleClick} className={`relative overflow-hidden ${className ?? ''}`}>
      {children}
      {ripples.map((r) => (
        <span
          key={r.id}
          className="ripple-span"
          style={{ left: r.x, top: r.y, width: r.size, height: r.size }}
        />
      ))}
    </button>
  );
}
