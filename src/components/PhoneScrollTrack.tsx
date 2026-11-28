import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  type MotionValue,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { withBase } from '../utils/paths';
import { useAccessibility } from '../context/AccessibilityContext';

export interface PhoneSlide {
  id: string;
  src: string;
  title: string;
  caption: string;
  alt: string;
}

export type PhoneFrameAspect = '740/1420' | '450/974';

export interface PhoneScrollTrackProps {
  slides: PhoneSlide[];
  ariaLabel?: string;
  className?: string;
  frameAspect?: PhoneFrameAspect;
}

interface AspectLayoutConfig {
  width: number;
  height: number;
  radiusClass: string;
  stickyFigureWidth: string;
  stickyFrameBox: string;
  snapFigureWidth: string;
  snapFrameBox: string;
}

const FRAME_ASPECT_CONFIG: Record<PhoneFrameAspect, AspectLayoutConfig> = {
  '450/974': {
    width: 450,
    height: 974,
    radiusClass: 'rounded-[12%/5.55%]',
    stickyFigureWidth:
      'w-full px-2 sm:w-[clamp(232px,calc((100svh-16.5rem)*450/974+2rem),340px)] sm:px-0',
    stickyFrameBox:
      'aspect-[450/974] w-[min(100%,clamp(148px,calc((100svh-13.25rem)*450/974),330px))] sm:w-[clamp(148px,calc((100svh-16.5rem)*450/974),310px)] md:w-[clamp(148px,calc((100svh-16.5rem)*450/974),330px)]',
    snapFigureWidth: 'w-[min(82vw,290px)] snap-center px-1 sm:w-[300px] sm:px-0 md:w-[320px]',
    snapFrameBox: 'aspect-[450/974] w-full max-w-[270px] sm:w-[290px] md:w-[310px]',
  },
  '740/1420': {
    width: 740,
    height: 1420,
    radiusClass: 'rounded-[11%/5.8%]',
    stickyFigureWidth:
      'w-full px-2 sm:w-[clamp(240px,calc((100svh-16.5rem)*740/1420+2rem),340px)] sm:px-0',
    stickyFrameBox:
      'aspect-[740/1420] w-[min(100%,clamp(148px,calc((100svh-13.25rem)*740/1420),350px))] sm:w-[clamp(148px,calc((100svh-16.5rem)*740/1420),320px)] md:w-[clamp(148px,calc((100svh-16.5rem)*740/1420),340px)]',
    snapFigureWidth: 'w-[min(84vw,300px)] snap-center px-1 sm:w-[320px] sm:px-0 md:w-[340px]',
    snapFrameBox: 'aspect-[740/1420] w-full max-w-[280px] sm:w-[310px] md:w-[330px]',
  },
};

function formatCounter(index: number, total: number): string {
  const current = String(index + 1).padStart(2, '0');
  const max = String(total).padStart(2, '0');
  return `${current} / ${max}`;
}

function resolveActiveSlideIndex(progress: number, total: number): number {
  if (total <= 1) return 0;
  return Math.min(total - 1, Math.max(0, Math.round(progress * (total - 1))));
}

function useActiveSlideIndex(
  scrollYProgress: MotionValue<number>,
  total: number
): number {
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

  return activeIndex;
}

/**
 * Detects compact landscape viewports (e.g. phones rotated horizontally) where a
 * sticky vertical-to-horizontal stage would be too short, switching cleanly to
 * native horizontal swipe scrolling instead.
 */
function useCompactViewportHeight(): boolean {
  const [isShort, setIsShort] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(max-height: 520px)').matches
      : false
  );

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const query = window.matchMedia('(max-height: 520px)');
    const handleChange = (event: MediaQueryListEvent) => setIsShort(event.matches);
    setIsShort(query.matches);
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

  return isShort;
}

/**
 * Uniform smartphone frame card used identically across all 6 slides.
 * Uses hardware-accelerated box-shadow on an aspect-matched rounded container instead
 * of per-pixel alpha filter: drop-shadow() for smooth 60–120fps horizontal scrolling.
 */
const PhoneFrameCard: React.FC<{
  slide: PhoneSlide;
  index: number;
  total: number;
  failed: boolean;
  onImageError: (id: string) => void;
  snapMode?: boolean;
  eagerLoad?: boolean;
  frameAspect?: PhoneFrameAspect;
}> = React.memo(
  ({
    slide,
    index,
    total,
    failed,
    onImageError,
    snapMode = false,
    eagerLoad = false,
    frameAspect = '740/1420',
  }) => {
    const slideNumber = String(index + 1).padStart(2, '0');
    const config = FRAME_ASPECT_CONFIG[frameAspect];
    const figureWidthClass = snapMode
      ? config.snapFigureWidth
      : config.stickyFigureWidth;
    const frameBoxClass = snapMode ? config.snapFrameBox : config.stickyFrameBox;

    return (
      <figure className={`flex shrink-0 flex-col items-center ${figureWidthClass}`}>
        {/* Locked identical smartphone frame dimensions across all 6 screens */}
        <div className={`relative mx-auto shrink-0 contain-layout ${frameBoxClass}`}>
          {failed ? (
            <div
              className={`absolute inset-0 sm:inset-1.5 flex flex-col items-center justify-center ${config.radiusClass} border border-[#2A2926] bg-[#141517] px-5 text-center text-[#F4F1EC]`}
            >
              <p className="micro-label text-[#9E9A90]">
                {formatCounter(index, total)}
              </p>
              <p className="mt-2 text-[0.90625rem] font-medium">{slide.title}</p>
            </div>
          ) : (
            <div
              className={`absolute inset-0 sm:inset-1.5 overflow-hidden ${config.radiusClass} shadow-[0_14px_28px_-8px_rgba(14,14,14,0.22),0_2px_6px_rgba(14,14,14,0.08)]`}
            >
              <img
                src={withBase(slide.src)}
                alt={slide.alt}
                width={config.width}
                height={config.height}
                loading={eagerLoad ? 'eager' : 'lazy'}
                fetchPriority="low"
                draggable={false}
                decoding="async"
                referrerPolicy="no-referrer"
                onError={() => onImageError(slide.id)}
                className="pointer-events-none block h-full w-full select-none object-cover"
              />
            </div>
          )}
        </div>

        {/* Screen Title & Brief Caption */}
        <figcaption className="mt-2.5 w-full max-w-[34ch] px-1 text-center sm:mt-3.5">
          <p className="text-[0.875rem] font-medium leading-[1.3] tracking-[-0.01em] text-ink sm:text-[0.9375rem]">
            <span className="mr-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-muted tabular-nums">
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
 * Memoized row of smartphone image cards so parent scroll updates
 * never re-render the 6 smartphone image frames during horizontal scroll interactions.
 */
const PhoneFrameRail: React.FC<{
  slides: PhoneSlide[];
  failedImages: Record<string, boolean>;
  onImageError: (id: string) => void;
  frameAspect: PhoneFrameAspect;
  snapMode?: boolean;
  eagerLoad?: boolean;
}> = React.memo(
  ({
    slides,
    failedImages,
    onImageError,
    frameAspect,
    snapMode = false,
    eagerLoad = false,
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
            snapMode={snapMode}
            eagerLoad={eagerLoad}
            frameAspect={frameAspect}
          />
        ))}
      </>
    );
  }
);

PhoneFrameRail.displayName = 'PhoneFrameRail';

/**
 * Isolated scroll-driven counter badge (`01 / 06`–`06 / 06`).
 * Subscribes directly to `scrollYProgress` so counter ticks never re-render the phone frames.
 */
const ScrollCounterBadge: React.FC<{
  scrollYProgress: MotionValue<number>;
  total: number;
}> = React.memo(({ scrollYProgress, total }) => {
  const activeIndex = useActiveSlideIndex(scrollYProgress, total);

  return (
    <span className="micro-label text-ink tabular-nums whitespace-nowrap">
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
  const activeIndex = useActiveSlideIndex(scrollYProgress, slides.length);

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
              isCurrent ? 'w-7 bg-ink sm:w-8' : 'w-3.5 bg-hairline sm:w-4'
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
  eagerLoad: boolean;
}> = React.memo(
  ({
    slides,
    ariaLabel,
    className,
    frameAspect,
    failedImages,
    onImageError,
    eagerLoad,
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

    // Coalesce resize measurements into rAF so resizing never thrashes layout
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

    // Map native vertical scroll through the outer track into GPU-composited horizontal movement.
    const { scrollYProgress } = useScroll({
      target: trackOuterRef,
      offset: ['start 64px', 'end end'],
    });

    const x = useTransform(scrollYProgress, [0, 1], [0, -maxTranslateX]);

    return (
      <div
        ref={trackOuterRef}
        role="region"
        aria-label={ariaLabel}
        className={`relative h-[280vh] w-full overflow-x-clip sm:h-[340vh] ${className}`}
      >
        {/* Sticky Stage Wrapper aligns cleanly below the responsive sticky navbar */}
        <div className="sticky top-[3.75rem] h-[calc(100svh-3.75rem)] w-full pb-2 sm:top-[4.375rem] sm:h-[calc(100svh-4.375rem)] sm:pb-3">
          <div className="flex h-full w-full flex-col justify-between overflow-hidden rounded-[8px] border border-hairline bg-stage py-3 sm:py-5">
            {/* Top Counter & Scroll Cue */}
            <div className="px-4 sm:px-6">
              <div className="flex items-center justify-between gap-4">
                <ScrollCounterBadge
                  scrollYProgress={scrollYProgress}
                  total={total}
                />
                <span className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-muted whitespace-nowrap">
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
                className={`flex w-full items-center gap-0 px-0 sm:w-max sm:items-start sm:gap-7 sm:px-6 ${
                  eagerLoad ? 'will-change-transform' : ''
                }`}
              >
                <PhoneFrameRail
                  slides={slides}
                  failedImages={failedImages}
                  onImageError={onImageError}
                  frameAspect={frameAspect}
                  eagerLoad={eagerLoad}
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

/**
 * Native horizontal swipe/snap carousel used for reduced-motion preferences
 * and short landscape mobile viewports, with accessible step buttons.
 */
const SnapPhoneScrollTrack: React.FC<{
  slides: PhoneSlide[];
  ariaLabel: string;
  className: string;
  frameAspect: PhoneFrameAspect;
  failedImages: Record<string, boolean>;
  onImageError: (id: string) => void;
  eagerLoad: boolean;
  prefersReducedMotion: boolean;
}> = React.memo(
  ({
    slides,
    ariaLabel,
    className,
    frameAspect,
    failedImages,
    onImageError,
    eagerLoad,
    prefersReducedMotion,
  }) => {
    const scrollerRef = useRef<HTMLDivElement | null>(null);
    const total = slides.length;

    const stepScroll = useCallback(
      (direction: -1 | 1) => {
        const el = scrollerRef.current;
        if (!el) return;
        const step = Math.max(240, Math.round(el.clientWidth * 0.78));
        el.scrollBy({
          left: direction * step,
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
        });
      },
      [prefersReducedMotion]
    );

    return (
      <div
        role="region"
        aria-label={ariaLabel}
        className={`w-full rounded-[8px] border border-hairline bg-stage py-5 sm:py-8 ${className}`}
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-4 pb-3 sm:px-6">
          <span className="micro-label text-muted tabular-nums">
            01–{String(total).padStart(2, '0')} SCREENS
          </span>
          <div className="flex items-center gap-1.5">
            <span className="mr-1.5 hidden text-[0.6875rem] font-medium uppercase tracking-[0.06em] text-muted sm:inline">
              Swipe or step
            </span>
            <button
              type="button"
              onClick={() => stepScroll(-1)}
              aria-label="Previous screen"
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[6px] border border-hairline bg-surface text-ink transition-colors duration-150 hover:bg-alabaster focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              <ChevronLeft size={16} strokeWidth={1.75} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => stepScroll(1)}
              aria-label="Next screen"
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[6px] border border-hairline bg-surface text-ink transition-colors duration-150 hover:bg-alabaster focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              <ChevronRight size={16} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div
          ref={scrollerRef}
          tabIndex={0}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain px-4 pb-2 scroll-px-4 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus sm:gap-7 sm:px-6 sm:scroll-px-6"
        >
          <PhoneFrameRail
            slides={slides}
            failedImages={failedImages}
            onImageError={onImageError}
            frameAspect={frameAspect}
            snapMode
            eagerLoad={eagerLoad}
          />
        </div>
      </div>
    );
  }
);

SnapPhoneScrollTrack.displayName = 'SnapPhoneScrollTrack';

export const PhoneScrollTrack: React.FC<PhoneScrollTrackProps> = React.memo(
  ({
    slides,
    ariaLabel = 'WELLBE+ mobile interface screens',
    className = '',
    frameAspect = '740/1420',
  }) => {
    const { settings } = useAccessibility();
    const prefersReducedMotion = Boolean(useReducedMotion()) || settings.reduceMotion;
    const isShortViewport = useCompactViewportHeight();
    const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
    const [isNearViewport, setIsNearViewport] = useState(false);
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    const total = slides.length;

    // Switch real DOM <img> elements to eager loading once approaching the carousel
    // (avoids detached Image() decode bursts while ensuring zero blank slides when scrolling).
    useEffect(() => {
      if (isNearViewport || total === 0) return;
      const el = sentinelRef.current;
      if (!el || typeof IntersectionObserver === 'undefined') {
        setIsNearViewport(true);
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            setIsNearViewport(true);
            observer.disconnect();
          }
        },
        { rootMargin: '800px 0px' }
      );
      observer.observe(el);
      return () => observer.disconnect();
    }, [isNearViewport, total]);

    const handleImageError = useCallback((id: string) => {
      setFailedImages((prev) => (prev[id] ? prev : { ...prev, [id]: true }));
    }, []);

    if (total === 0) {
      return null;
    }

    const useNativeSnapTrack = prefersReducedMotion || isShortViewport;

    return (
      <div ref={sentinelRef}>
        {useNativeSnapTrack ? (
          <SnapPhoneScrollTrack
            slides={slides}
            ariaLabel={ariaLabel}
            className={className}
            frameAspect={frameAspect}
            failedImages={failedImages}
            onImageError={handleImageError}
            eagerLoad={isNearViewport}
            prefersReducedMotion={prefersReducedMotion}
          />
        ) : (
          <StickyPhoneScrollTrack
            slides={slides}
            ariaLabel={ariaLabel}
            className={className}
            frameAspect={frameAspect}
            failedImages={failedImages}
            onImageError={handleImageError}
            eagerLoad={isNearViewport}
          />
        )}
      </div>
    );
  }
);

PhoneScrollTrack.displayName = 'PhoneScrollTrack';
