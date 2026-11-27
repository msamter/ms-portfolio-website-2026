import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useMotionValue } from 'motion/react';

type CursorMode = 'default' | 'pointer' | 'project';

/**
 * Custom mix-blend-mode: difference circular cursor recreating
 * micahsamter.framer.website with 1:1 native-speed pointer tracking:
 * - Zero-lag direct GPU positioning matching hardware mouse responsiveness
 * - 24px white circle with difference blend (dark on alabaster/gray, white on black)
 * - Springs smoothly down to 16px on press and subtly expands over links/project cards
 * - Automatically disabled on touch / coarse-pointer devices
 */
const REDUCED_TRANSITION = { duration: 0.05 } as const;
const SPRING_TRANSITION = {
  scale: {
    type: 'spring' as const,
    stiffness: 520,
    damping: 36,
    mass: 0.45,
    restDelta: 0.002,
  },
  opacity: { duration: 0.1 },
} as const;

interface CustomCursorProps {
  route?: string;
}

function resolveCursorMode(target: EventTarget | null): CursorMode {
  if (!(target instanceof Element)) return 'default';
  if (target.closest('[data-cursor="project"]')) return 'project';
  if (
    target.closest(
      'a, button:not(:disabled), [role="button"]:not([aria-disabled="true"]), input:not(:disabled), textarea:not(:disabled), select:not(:disabled)'
    )
  ) {
    return 'pointer';
  }
  return 'default';
}

export const CustomCursor: React.FC<CustomCursorProps> = ({ route }) => {
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [mode, setMode] = useState<CursorMode>('default');
  const [reducedMotion, setReducedMotion] = useState(false);

  const visibleRef = useRef(false);
  const pressedRef = useRef(false);
  const modeRef = useRef<CursorMode>('default');
  const lastTargetRef = useRef<EventTarget | null>(null);

  // Direct motion values bound 1:1 to pointer coordinates (zero spring lag)
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const syncEnvironment = () => {
      setEnabled(finePointerQuery.matches);
      setReducedMotion(motionQuery.matches);
    };

    syncEnvironment();
    finePointerQuery.addEventListener('change', syncEnvironment);
    motionQuery.addEventListener('change', syncEnvironment);

    return () => {
      finePointerQuery.removeEventListener('change', syncEnvironment);
      motionQuery.removeEventListener('change', syncEnvironment);
    };
  }, []);

  // Only hide the native cursor once the custom cursor is enabled AND visible
  useEffect(() => {
    if (enabled && visible) {
      document.documentElement.classList.add('custom-cursor-active');
    } else {
      document.documentElement.classList.remove('custom-cursor-active');
    }
    return () => {
      document.documentElement.classList.remove('custom-cursor-active');
    };
  }, [enabled, visible]);

  // Clear stale hover target & mode after SPA route transitions
  useEffect(() => {
    lastTargetRef.current = null;
    if (pressedRef.current) {
      pressedRef.current = false;
      setPressed(false);
    }
    if (modeRef.current !== 'default') {
      modeRef.current = 'default';
      setMode('default');
    }
  }, [route]);

  useEffect(() => {
    if (!enabled) return;

    const isNativeCursorTarget = (target: EventTarget | null) =>
      target instanceof Element &&
      (target.tagName === 'IFRAME' || Boolean(target.closest('[data-native-cursor="true"]')));

    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;

      if (isNativeCursorTarget(e.target)) {
        if (visibleRef.current) {
          visibleRef.current = false;
          setVisible(false);
        }
        return;
      }

      mouseX.set(e.clientX);
      mouseY.set(e.clientY);

      if (!visibleRef.current) {
        visibleRef.current = true;
        setVisible(true);
      }

      if (e.target !== lastTargetRef.current) {
        lastTargetRef.current = e.target;
        const nextMode = resolveCursorMode(e.target);
        if (nextMode !== modeRef.current) {
          modeRef.current = nextMode;
          setMode(nextMode);
        }
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      if (isNativeCursorTarget(e.target)) return;
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!pressedRef.current) {
        pressedRef.current = true;
        setPressed(true);
      }
    };

    const handlePointerUp = () => {
      if (pressedRef.current) {
        pressedRef.current = false;
        setPressed(false);
      }
    };

    const handleScroll = () => {
      lastTargetRef.current = null;
      if (modeRef.current !== 'default') {
        modeRef.current = 'default';
        setMode('default');
      }
    };

    const handleResetVisibility = () => {
      lastTargetRef.current = null;
      if (visibleRef.current) {
        visibleRef.current = false;
        setVisible(false);
      }
      if (pressedRef.current) {
        pressedRef.current = false;
        setPressed(false);
      }
      if (modeRef.current !== 'default') {
        modeRef.current = 'default';
        setMode('default');
      }
    };

    const handleMouseEnter = (e: MouseEvent) => {
      if (isNativeCursorTarget(e.target)) return;
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!visibleRef.current) {
        visibleRef.current = true;
        setVisible(true);
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('pointerup', handlePointerUp, { passive: true });
    window.addEventListener('pointercancel', handlePointerUp, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('blur', handleResetVisibility);
    document.documentElement.addEventListener('mouseleave', handleResetVisibility);
    document.documentElement.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('blur', handleResetVisibility);
      document.documentElement.removeEventListener('mouseleave', handleResetVisibility);
      document.documentElement.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [enabled, mouseX, mouseY]);

  if (!enabled || typeof document === 'undefined') {
    return null;
  }

  // Base circle is 32px; animate GPU-composited scale only (16px / 24px / 28px / 32px)
  const scale = pressed ? 0.5 : mode === 'project' ? 1 : mode === 'pointer' ? 0.875 : 0.75;

  return createPortal(
    <motion.div
      aria-hidden="true"
      style={{
        x: mouseX,
        y: mouseY,
        translateX: '-50%',
        translateY: '-50%',
      }}
      initial={false}
      animate={{
        scale,
        opacity: visible ? 1 : 0,
      }}
      transition={reducedMotion ? REDUCED_TRANSITION : SPRING_TRANSITION}
      className="pointer-events-none fixed top-0 left-0 z-[9999] h-8 w-8 rounded-full bg-white mix-blend-difference will-change-transform"
    />,
    document.body
  );
};
