import React from 'react';
import { motion, useReducedMotion, useScroll, useSpring } from 'motion/react';
import { useAccessibility } from '../context/AccessibilityContext';

interface ReadingProgressBarProps {
  targetRef: React.RefObject<HTMLElement | null>;
}

const SPRING_CONFIG = {
  stiffness: 400,
  damping: 40,
  restDelta: 0.002,
} as const;

export const ReadingProgressBar: React.FC<ReadingProgressBarProps> = ({
  targetRef,
}) => {
  const { settings } = useAccessibility();
  const prefersReducedMotion = Boolean(useReducedMotion()) || settings.reduceMotion;
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ['start 68px', 'end end'],
  });

  const smoothProgress = useSpring(scrollYProgress, SPRING_CONFIG);
  const scaleX = prefersReducedMotion ? scrollYProgress : smoothProgress;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 right-0 z-50 h-[2.5px] bg-hairline/45"
    >
      <motion.div
        className="h-full w-full origin-left bg-ink will-change-transform"
        style={{ scaleX }}
      />
    </div>
  );
};
