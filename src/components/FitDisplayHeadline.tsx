import React, { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { useAccessibility } from '../context/AccessibilityContext';

interface FitDisplayHeadlineProps {
  text: string;
  className?: string;
  letterSpacing?: string;
  wordSpacing?: string;
  /** Vertical proportion multiplier to give display titles a taller editorial silhouette. */
  heightScale?: number;
  /** Optional upper cap (px) so short titles remain balanced above the fold. */
  maxFontSize?: number;
}

/**
 * Scales a single-line display headline to fill 100% of its container width
 * across all responsive screen sizes without wrapping or overflowing.
 */
export const FitDisplayHeadline: React.FC<FitDisplayHeadlineProps> = React.memo(({
  text,
  className = '',
  letterSpacing = '0.04em',
  wordSpacing = '0.06em',
  heightScale = 1.22,
  maxFontSize,
}) => {
  const { settings } = useAccessibility();
  const effectiveHeightScale = settings.readableFont ? 1 : heightScale;
  const effectiveLetterSpacing = settings.readableFont ? '-0.02em' : letterSpacing;
  const effectiveWordSpacing = settings.readableFont ? '0.02em' : wordSpacing;

  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);
  const lastMeasuredWidthRef = useRef<number>(0);
  const fittedFontSizeRef = useRef<string | null>(null);

  const fitToWidth = useCallback(
    (force = false) => {
      const container = containerRef.current;
      const heading = textRef.current;
      if (!container || !heading) return;

      const availableWidth = container.clientWidth;
      if (availableWidth <= 0) return;
      if (!force && Math.abs(availableWidth - lastMeasuredWidthRef.current) < 0.5) {
        return;
      }
      lastMeasuredWidthRef.current = availableWidth;

      // Read current font size and rendered width in a single pass (avoids 100px flash + double reflow)
      const currentSize = parseFloat(window.getComputedStyle(heading).fontSize) || 100;
      const currentWidth = heading.getBoundingClientRect().width;
      if (currentWidth <= 0) return;

      const computedSize = currentSize * (availableWidth / currentWidth);
      let safeSize = Math.floor(computedSize * 0.994 * 100) / 100;
      if (maxFontSize !== undefined) {
        safeSize = Math.min(safeSize, maxFontSize);
      }
      const nextFontSize = `${safeSize}px`;
      fittedFontSizeRef.current = nextFontSize;
      if (Math.abs(safeSize - currentSize) >= 0.25) {
        heading.style.fontSize = nextFontSize;
      }
    },
    [maxFontSize]
  );

  useLayoutEffect(() => {
    fitToWidth(true);
  }, [
    fitToWidth,
    text,
    effectiveLetterSpacing,
    effectiveWordSpacing,
    settings.readableFont,
    settings.textScale,
    settings.readingSpacing,
  ]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let rafId: number | null = null;
    const scheduleFit = (force = false) => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        fitToWidth(force);
      });
    };

    const observer =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            scheduleFit(false);
          })
        : null;
    observer?.observe(container);

    const handleResize = () => scheduleFit(false);
    if (!observer) {
      window.addEventListener('resize', handleResize, { passive: true });
    }

    let active = true;
    const handleFontLoad = () => {
      if (active) scheduleFit(true);
    };

    if (typeof document !== 'undefined' && 'fonts' in document) {
      document.fonts.ready.then(handleFontLoad).catch(() => {});
      document.fonts.addEventListener?.('loadingdone', handleFontLoad);
    }

    return () => {
      active = false;
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      observer?.disconnect();
      if (!observer) {
        window.removeEventListener('resize', handleResize);
      }
      if (typeof document !== 'undefined' && 'fonts' in document) {
        document.fonts.removeEventListener?.('loadingdone', handleFontLoad);
      }
    };
  }, [fitToWidth]);

  // Extra vertical flow space to accommodate scaleY from top origin without clipping
  const extraHeightEm = Math.max(0, (effectiveHeightScale - 1) * 0.88);

  return (
    <div ref={containerRef} className="w-full overflow-x-clip overflow-y-visible text-center">
      <h1
        ref={textRef}
        className={`display-headline inline-block whitespace-nowrap select-none align-top ${className}`}
        style={{
          fontSize: fittedFontSizeRef.current ?? 'clamp(3rem, 15vw, 14rem)',
          letterSpacing: effectiveLetterSpacing,
          wordSpacing: effectiveWordSpacing,
          marginRight: settings.readableFont ? undefined : `-${effectiveLetterSpacing}`,
          transform: effectiveHeightScale !== 1 ? `scaleY(${effectiveHeightScale})` : undefined,
          transformOrigin: 'top center',
          marginBottom: extraHeightEm > 0 ? `${extraHeightEm.toFixed(3)}em` : undefined,
        }}
      >
        {text}
      </h1>
    </div>
  );
});

FitDisplayHeadline.displayName = 'FitDisplayHeadline';
