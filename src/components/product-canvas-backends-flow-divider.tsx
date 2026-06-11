import type { RefObject } from 'react';
import { m, useScroll, useTransform } from 'framer-motion';

const DIVIDER_STROKE = 'rgba(24, 24, 24, 0.12)';
const STEM_X = 12;
const MID_Y = 50;
const ARROW_HALF_HEIGHT = 5;
const ARROW_LENGTH = 10;

function buildDividerPath(progress: number): string {
  if (progress <= 0.001) {
    return `M ${STEM_X} 0 L ${STEM_X} 100`;
  }

  const halfHeight = ARROW_HALF_HEIGHT * progress;
  const arrowLength = ARROW_LENGTH * progress;
  const topJoin = MID_Y - halfHeight;
  const bottomJoin = MID_Y + halfHeight;
  const tipX = STEM_X + arrowLength;

  return `M ${STEM_X} 0 L ${STEM_X} ${topJoin} L ${tipX} ${MID_Y} L ${STEM_X} ${bottomJoin} L ${STEM_X} 100`;
}

type ProductCanvasBackendsFlowDividerProps = {
  position: number;
  containerRef: RefObject<HTMLElement | null>;
};

export function ProductCanvasBackendsFlowDivider({
  position,
  containerRef,
}: ProductCanvasBackendsFlowDividerProps) {
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 0.9', 'center 0.55', 'end 0.1'],
  });

  const arrowProgress = useTransform(scrollYProgress, (value) => {
    const start = 0.12;
    const end = 0.52;
    if (value <= start) return 0;
    if (value >= end) return 1;
    return (value - start) / (end - start);
  });

  const pathD = useTransform(arrowProgress, buildDividerPath);

  return (
    <m.svg
      className='pointer-events-none absolute top-0 hidden h-full w-6 -translate-x-1/2 md:block'
      style={{ left: `${position * 100}%` }}
      viewBox='0 0 24 100'
      preserveAspectRatio='none'
      aria-hidden='true'
    >
      <m.path
        fill='none'
        stroke={DIVIDER_STROKE}
        strokeWidth={1}
        strokeLinecap='square'
        strokeLinejoin='miter'
        vectorEffect='non-scaling-stroke'
        d={pathD}
      />
    </m.svg>
  );
}
