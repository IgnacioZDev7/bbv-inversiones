import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

const STEP_DELAY = 0.04;
const MAX_DELAY = 0.4;

function delayFor(index: number) {
  return Math.min(index * STEP_DELAY, MAX_DELAY);
}

interface StaggerProps {
  index: number;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

/** Fila de tabla que entra con un leve fundido + desplazamiento, escalonada por índice. */
export function StaggerRow({ index, children, className, onClick }: StaggerProps) {
  return (
    <motion.tr
      className={className}
      onClick={onClick}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: delayFor(index), ease: 'easeOut' }}
    >
      {children}
    </motion.tr>
  );
}

/** Igual que StaggerRow pero para listas no-tabulares (divs). */
export function StaggerItem({ index, children, className }: StaggerProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: delayFor(index), ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
