import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  type MotionValue,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'motion/react';
import { withBase } from '../utils/paths';
import { useAccessibility } from '../context/AccessibilityContext';

export interface PhoneSlide {
  id: string;
  src: string;
  title: string;
  caption: string;
  alt: string;
}

export type PhoneFrameAspect = '740/1420' | '636/1376';

export interface PhoneScrollTrackProps {
  slides: PhoneSlide[];
  ariaLabel?: string;
  className?: string;
  frameAspect?: PhoneFrameAspect;
}

function formatCounter(index: number, total: number): string {
  const current = String(index + 1).padStart(2, '0');
  const max = String(total).padStart(2, '0');
  return `${current} / ${max}`;
}

/**
 * Uniform smartphone frame card used identically across all 6 slides (`wellbe-1`..`wellbe-6`).
 * Uses the exact natural 740×1420 aspect ratio of all 6 mockups so screens maximize available
 * space with zero letterboxing, centering strictly one phone at a time on mobile viewports.
 */
const PhoneFrameCard: React.FC<{
  slide: PhoneSlide;
  index: number;
  total: number;
  failed: boolean;
  onImageError: (id: string) => void;
  reducedMotion?: boolean;
  frameAspect?: PhoneFrameAspect;
}> = React.memo(
  ({
    slide,
    index,
    total,
    failed,
    onImageError,
    reducedMotion = false,
    frameAspect = '740/1420',
  }) => {
    const slideNumber = String(index + 1).padStart(2, '0');
    const isTallScreen = frameAspect === '636/1376';
    const imgWidth = isTallScreen ? 636 : 740;
    const imgHeight = isTallScreen ? 1376 : 1420;

    const figureWidthClass = reducedMotion
      ? 'w-full snap-center px-2 sm:w-[320px] sm:px-0 md:w-[340px]'
      : isTallScreen
        ? 'w-full px-2 sm:w-[clamp(240px,calc((100svh-16.5rem)*636/1376+2rem),340px)] sm:px-0'
        : 'w-full px-2 sm:w-[clamp(240px,calc((100svh-16.5rem)*740/1420+2rem),340px)] sm:px-0';

    const frameBoxClass = isTallScreen
      ? reducedMotion
        ? 'aspect-[636/1376] w-full max-w-[320px] sm:w-[300px] md:w-[320px]'
        : 'aspect-[636/1376] w-[min(100%,clamp(140px,calc((100svh-13.5rem)*636/1376),340px))] sm:w-[clamp(140px,calc((100svh-16.5rem)*636/1376),310px)] md:w-[clamp(140px,calc((100svh-16.5rem)*636/1376),330px)]'
      : reducedMotion
        ? 'aspect-[740/1420] w-full max-w-[340px] sm:w-[320px] md:w-[340px]'
        : 'aspect-[740/1420] w-[min(100%,clamp(140px,calc((100svh-13.5rem)*740/1420),360px))] sm:w-[clamp(140px,calc((100svh-16.5rem)*740/1420),320px)] md:w-[clamp(140px,calc((100svh-16.5rem)*740/1420),340px)]';

    return (
      <figure className={`flex shrink-0 flex-col items-center ${figureWidthClass}`}>
        {/* Locked identical smartphone frame dimensions across all 6 screens */}
        <div className={`relative mx-auto shrink-0 ${frameBoxClass}`}>
          {failed ? (
            <div className="absolute inset-0 sm:inset-1.5 flex flex-col items-center justify-center rounded-[22px] border border-[#2A2926] bg-[#141517] px-5 text-center text-[#F4F1EC]">
              <p className="micro-label text-[#9E9A90]">
                {formatCounter(index, total)}
              </p>
              <p className="mt-2 text-[14.5px] font-medium">{slide.title}</p>
            </div>
          ) : (
            <div className="absolute inset-0 sm:inset-1.5">
              <img
                src={withBase(slide.src)}
                alt={slide.alt}
                width={imgWidth}
                height={imgHeight}
                loading="lazy"
                draggable={false}
                decoding="async"
                referrerPolicy="no-referrer"
                onError={() => onImageError(slide.id)}
                className="pointer-events-none block h-full w-full select-none object-contain drop-shadow-[0_14px_26px_rgba(14,14,14,0.14)]"
              />
            </div>
          )}
        </div>

        {/* Screen Title & Brief Caption */}
        <figcaption className="mt-2.5 w-full max-w-[34ch] px-1 text-center sm:mt-3.5">
          <p className="text-[0.875rem] font-medium leading-[1.3] tracking-[-0.01em] text-ink sm:text-[0.9375rem]">
            <span className="mr-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted tabular-nums">
              {slideNumber}
            </span>
            {slide.title}
          </p>
          <p className="mt-1 text-[0.78125rem] leading-[1.4] text-muted sm:text-[0.84375rem] sm:leading-[1.45]">
            {slide.caption}
          </p>
        </figcaption>
      </figure>
    );
  }
);

PhoneFrameCard.displayName = 'PhoneFrameCard';

/**
 * Memoized row of smartphone image cards so parent layout or scroll updates
 * never re-render the 6 smartphone image frames during horizontal scroll interactions.
 */
const PhoneFrameRail: React.FC<{
  slides: PhoneSlide[];
  failedImages: Record<string, boolean>;
  onImageError: (id: string) => void;
  frameAspect: PhoneFrameAspect;
  reducedMotion?: boolean;
}> = React.memo(
  ({
    slides,
    failedImages,
    onImageError,
    frameAspect,
    reducedMotion = false,
  }) => {
    const total = slides.length;
    return (
      <>
        {slides.map((slide, idx) => (
          <PhoneFrameCard
            key={slide.id}
            slide={slide}
            index={idx}
            total={total}
            failed={Boolean(failedImages[slide.id])}
            onImageError={onImageError}
            reducedMotion={reducedMotion}
            frameAspect={frameAspect}
          />
        ))}
      </>
    );
  }
);

PhoneFrameRail.displayName = 'PhoneFrameRail';

function resolveActiveSlideIndex(progress: number, total: number): number {
  if (total <= 1) return 0;
  return Math.min(total - 1, Math.max(0, Math.round(progress * (total - 1))));
}

/**
 * Isolated scroll-driven counter badge (`01 / 06`–`06 / 06`).
 * Subscribes directly to `scrollYProgress` so counter ticks never re-render the phone frames.
 */
const ScrollCounterBadge: React.FC<{
  scrollYProgress: MotionValue<number>;
  total: number;
}> = React.memo(({ scrollYProgress, total }) => {
  const [activeIndex, setActiveIndex] = useState(() =>
    resolveActiveSlideIndex(scrollYProgress.get(), total)
  );

  useEffect(() => {
    const nextIdx = resolveActiveSlideIndex(scrollYProgress.get(), total);
    setActiveIndex((prev) => (prev === nextIdx ? prev : nextIdx));
  }, [scrollYProgress, total]);

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    const nextIdx = resolveActiveSlideIndex(latest, total);
    setActiveIndex((prev) => (prev === nextIdx ? prev : nextIdx));
  });

  return (
    <span
      className="micro-label text-ink tabular-nums whitespace-nowrap"
      aria-live="polite"
    >
      {formatCounter(activeIndex, total)}
    </span>
  );
});

ScrollCounterBadge.displayName = 'ScrollCounterBadge';

/**
 * Isolated scroll-driven bottom sequence indicator bars.
 * Updates independently of the smartphone image rail.
 */
const ScrollSequenceDots: React.FC<{
  scrollYProgress: MotionValue<number>;
  slides: PhoneSlide[];
}> = React.memo(({ scrollYProgress, slides }) => {
  const total = slides.length;
  const [activeIndex, setActiveIndex] = useState(() =>
    resolveActiveSlideIndex(scrollYProgress.get(), total)
  );

  useEffect(() => {
    const nextIdx = resolveActiveSlideIndex(scrollYProgress.get(), total);
    setActiveIndex((prev) => (prev === nextIdx ? prev : nextIdx));
  }, [scrollYProgress, total]);

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    const nextIdx = resolveActiveSlideIndex(latest, total);
    setActiveIndex((prev) => (prev === nextIdx ? prev : nextIdx));
  });

  return (
    <div
      aria-hidden="true"
      className="flex items-center justify-center gap-2 px-4 sm:gap-2.5 sm:px-6"
    >
      {slides.map((slide, idx) => {
        const isCurrent = idx === activeIndex;
        return (
          <span
            key={slide.id}
            className={`block h-[2px] rounded-full transition-[width,background-color] duration-200 ${
              isCurrent
                ? 'w-7 bg-ink sm:w-8'
                : 'w-3.5 bg-hairline sm:w-4'
            }`}
          />
        );
      })}
    </div>
  );
});

ScrollSequenceDots.displayName = 'ScrollSequenceDots';

/**
 * Sticky vertical-to-horizontal scroll track.
 * Always mounts `trackOuterRef` so Motion's `useScroll({ target })` ref is reliably hydrated.
 */
const StickyPhoneScrollTrack: React.FC<{
  slides: PhoneSlide[];
  ariaLabel: string;
  className: string;
  frameAspect: PhoneFrameAspect;
  failedImages: Record<string, boolean>;
  onImageError: (id: string) => void;
}> = React.memo(
  ({
    slides,
    ariaLabel,
    className,
    frameAspect,
    failedImages,
    onImageError,
  }) => {
    const trackOuterRef = useRef<HTMLDivElement | null>(null);
    const stageViewportRef = useRef<HTMLDivElement | null>(null);
    const railRef = useRef<HTMLDivElement | null>(null);

    const [maxTranslateX, setMaxTranslateX] = useState(0);

    const total = slides.length;

    const measureTravel = useCallback(() => {
      const viewportEl = stageViewportRef.current;
      const railEl = railRef.current;
      if (!viewportEl || !railEl) return;
      const distance = Math.max(
        0,
        Math.round(railEl.scrollWidth - viewportEl.clientWidth)
      );
      setMaxTranslateX((prev) => (prev === distance ? prev : distance));
    }, []);

    useLayoutEffect(() => {
      measureTravel();
    }, [measureTravel, total]);

    // Measure exact horizontal travel distance coalesced into rAF so resize never thrashes layout
    useEffect(() => {
      const viewportEl = stageViewportRef.current;
      const railEl = railRef.current;
      if (!viewportEl || !railEl) return;

      let rafId: number | null = null;
      const scheduleMeasure = () => {
        if (rafId !== null) return;
        rafId = window.requestAnimationFrame(() => {
          rafId = null;
          measureTravel();
        });
      };

      if (typeof ResizeObserver !== 'undefined') {
        const observer = new ResizeObserver(scheduleMeasure);
        observer.observe(viewportEl);
        observer.observe(railEl);
        return () => {
          if (rafId !== null) window.cancelAnimationFrame(rafId);
          observer.disconnect();
        };
      }

      window.addEventListener('resize', scheduleMeasure, { passive: true });
      return () => {
        if (rafId !== null) window.cancelAnimationFrame(rafId);
        window.removeEventListener('resize', scheduleMeasure);
      };
    }, [measureTravel, total]);

    // Map native vertical scroll through the tall outer track into GPU-composited horizontal movement.
    // Sticky stage spans calc(100svh - 68px), so `start 68px` to `end end` aligns 1:1 with pinning/unpinning.
    const { scrollYProgress } = useScroll({
      target: trackOuterRef,
      offset: ['start 68px', 'end end'],
    });

    const x = useTransform(scrollYProgress, [0, 1], [0, -maxTranslateX]);

    return (
      <div
        ref={trackOuterRef}
        role="region"
        aria-label={ariaLabel}
        className={`relative h-[300vh] w-full overflow-x-clip sm:h-[340vh] ${className}`}
      >
        {/* Sticky Stage Wrapper spans cleanly to viewport bottom so start 68px -> end end aligns 1:1 */}
        <div className="sticky top-[68px] h-[calc(100svh-68px)] w-full pb-2 sm:pb-3">
          <div className="flex h-full w-full flex-col justify-between overflow-hidden rounded-[8px] border border-hairline bg-stage py-3 sm:py-5">
            {/* Top Counter & Scroll Cue */}
            <div className="px-4 sm:px-6">
              <div className="flex items-center justify-between gap-4">
                <ScrollCounterBadge
                  scrollYProgress={scrollYProgress}
                  total={total}
                />
                <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted whitespace-nowrap">
                  Scroll to explore
                </span>
              </div>
            </div>

            {/* Horizontal Clipping Viewport + GPU-Composited Sliding Track */}
            <div
              ref={stageViewportRef}
              className="my-auto w-full overflow-hidden py-1 sm:py-2.5"
            >
              <motion.div
                ref={railRef}
                style={{ x }}
                className="flex w-full items-center gap-0 px-0 will-change-transform sm:w-max sm:items-start sm:gap-7 sm:px-6"
              >
                <PhoneFrameRail
                  slides={slides}
                  failedImages={failedImages}
                  onImageError={onImageError}
                  frameAspect={frameAspect}
                />
              </motion.div>
            </div>

            {/* Bottom Quiet Screen Sequence Index */}
            <ScrollSequenceDots
              scrollYProgress={scrollYProgress}
              slides={slides}
            />
          </div>
        </div>
      </div>
    );
  }
);

StickyPhoneScrollTrack.displayName = 'StickyPhoneScrollTrack';

export const PhoneScrollTrack: React.FC<PhoneScrollTrackProps> = React.memo(
  ({
    slides,
    ariaLabel = 'WELLBE+ mobile interface screens',
    className = '',
    frameAspect = '740/1420',
  }) => {
    const { settings } = useAccessibility();
    const prefersReducedMotion = Boolean(useReducedMotion()) || settings.reduceMotion;
    const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const preloadedRef = useRef(false);

    const total = slides.length;

    // Defer preloading the 6 carousel screens until user approaches Section 06
    // so they never compete with the above-the-fold Case Study hero image.
    useEffect(() => {
      if (
        typeof window === 'undefined' ||
        slides.length === 0 ||
        preloadedRef.current
      ) {
        return;
      }

      const triggerPreload = () => {
        if (preloadedRef.current) return;
        preloadedRef.current = true;
        slides.forEach((slide) => {
          const img = new Image();
          img.decoding = 'async';
          img.src = withBase(slide.src);
          img.decode?.().catch(() => {});
        });
      };

      const el = sentinelRef.current;
      if (!el || typeof IntersectionObserver === 'undefined') {
        triggerPreload();
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            triggerPreload();
            observer.disconnect();
          }
        },
        { rootMargin: '1000px 0px' }
      );
      observer.observe(el);

      return () => observer.disconnect();
    }, [slides]);

    const handleImageError = useCallback((id: string) => {
      setFailedImages((prev) => (prev[id] ? prev : { ...prev, [id]: true }));
    }, []);

    if (total === 0) {
      return null;
    }

    // Accessible reduced-motion fallback: native horizontal scroll container with zero motion offset
    if (prefersReducedMotion) {
      return (
        <div
          ref={sentinelRef}
          role="region"
          aria-label={ariaLabel}
          className={`w-full rounded-[8px] border border-hairline bg-stage py-6 sm:py-8 ${className}`}
        >
          <div className="mb-4 flex items-center justify-between gap-4 border-b border-hairline px-4 pb-3 sm:px-6">
            <span className="micro-label text-muted">
              01–{String(total).padStart(2, '0')} SCREENS
            </span>
            <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted">
              Scroll horizontally
            </span>
          </div>
          <div
            tabIndex={0}
            className="flex snap-x snap-mandatory gap-0 overflow-x-auto px-0 pb-2 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus sm:gap-7 sm:px-6"
          >
            <PhoneFrameRail
              slides={slides}
              failedImages={failedImages}
              onImageError={handleImageError}
              frameAspect={frameAspect}
              reducedMotion
            />
          </div>
        </div>
      );
    }

    return (
      <div ref={sentinelRef}>
        <StickyPhoneScrollTrack
          slides={slides}
          ariaLabel={ariaLabel}
          className={className}
          frameAspect={frameAspect}
          failedImages={failedImages}
          onImageError={handleImageError}
        />
      </div>
    );
  }
);

PhoneScrollTrack.displayName = 'PhoneScrollTrack';
