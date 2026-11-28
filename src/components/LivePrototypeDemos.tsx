import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ArrowUpRight, RotateCcw } from 'lucide-react';
import { withBase } from '../utils/paths';
import {
  type ExternalLinkLocation,
  usePortfolioAnalytics,
} from '../hooks/usePortfolioAnalytics';

export interface LivePrototypeFallbackImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface LivePrototypeItem {
  label: string;
  src: string;
  title: string;
  loadingLabel: string;
  caption: string;
  fallbackCaption?: string;
  fallbackImage?: LivePrototypeFallbackImage;
}

export interface LivePrototypesConfig {
  mobile: LivePrototypeItem;
  watch: LivePrototypeItem;
}

type PrototypeStatus = 'idle' | 'loading' | 'loaded' | 'fallback';

// Canonical mobile viewport width of https://wellbe-mobile.micahsamter.com/
// (matches its max-w-[390px] bottom capsule dock and prevents narrow-screen cramping).
const MOBILE_VIEWPORT_W = 390;

// Native layout geometry of https://wellbe-watch.micahsamter.com/ at 1600x740:
// - >=1536px (2xl) renders equal 356px left spacer and 356px right Studio panel with
//   symmetric 16px horizontal padding and 40px gaps, guaranteeing exact horizontal
//   symmetry at X = 800.00px (and well clear of the 920px breakpoint edge).
// - >=920px locks root to h-[100dvh] overflow-hidden with watch scale = 1.0,
//   placing the 412x412 circular OLED display center at (800, 396.25).
const WATCH_IFRAME_W = 1600;
const WATCH_IFRAME_H = 740;
const WATCH_SCREEN_CENTER_X = 800;
const WATCH_SCREEN_CENTER_Y = 396.25;
// Crop 1px inside the 412px screen rim so the entire watch screen fills edge-to-edge with zero bleed
const WATCH_SCREEN_CROP_DIAMETER = 410;

// Grace period after entering the viewport before falling back to the static WebP mockup
const PROTOTYPE_LOAD_TIMEOUT_MS = 9000;
const SIZE_EPSILON = 0.5;
const IFRAME_SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-popups';
const IFRAME_ALLOW = 'clipboard-write; fullscreen';

function isOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

/**
 * Measures an element's inner box using rAF-coalesced ResizeObserver entries
 * (reading contentRect directly to avoid extra layout reflows).
 */
function useElementSize(ref: React.RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  const commitSize = useCallback((nextWidth: number, nextHeight: number) => {
    if (nextWidth <= 0 || nextHeight <= 0) return;
    setSize((prev) =>
      Math.abs(prev.width - nextWidth) < SIZE_EPSILON &&
      Math.abs(prev.height - nextHeight) < SIZE_EPSILON
        ? prev
        : { width: nextWidth, height: nextHeight }
    );
  }, []);

  useLayoutEffect(() => {
    const el = ref.current;
    if (el) commitSize(el.clientWidth, el.clientHeight);
  }, [ref, commitSize]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let rafId: number | null = null;
    let pendingW = 0;
    let pendingH = 0;

    const flush = () => {
      rafId = null;
      commitSize(pendingW, pendingH);
    };

    const schedule = (w: number, h: number) => {
      pendingW = w;
      pendingH = h;
      if (rafId === null) {
        rafId = window.requestAnimationFrame(flush);
      }
    };

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver((entries) => {
        const rect = entries[0]?.contentRect;
        if (rect) {
          schedule(rect.width, rect.height);
        } else {
          schedule(el.clientWidth, el.clientHeight);
        }
      });
      observer.observe(el);
      return () => {
        if (rafId !== null) window.cancelAnimationFrame(rafId);
        observer.disconnect();
      };
    }

    const handleResize = () => schedule(el.clientWidth, el.clientHeight);
    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
    };
  }, [ref, commitSize]);

  return size;
}

/**
 * Manages lazy viewport activation, timeout/error fallback, manual reset,
 * and automatic recovery when the browser comes back online.
 */
function usePrototypeLifecycle(containerRef: React.RefObject<HTMLElement | null>) {
  const [reloadKey, setReloadKey] = useState(0);
  const [status, setStatus] = useState<PrototypeStatus>('idle');

  const startAttempt = useCallback((bumpKey: boolean) => {
    if (bumpKey) {
      setReloadKey((k) => k + 1);
    }
    setStatus(isOffline() ? 'fallback' : 'loading');
  }, []);

  // Activate in a single state transition once the hardware frame approaches the viewport
  useEffect(() => {
    if (status !== 'idle') return;
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      startAttempt(false);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          startAttempt(false);
        }
      },
      { rootMargin: '400px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [containerRef, status, startAttempt]);

  // Fall back gracefully if a cross-origin embed is blocked, drops offline, or times out silently
  useEffect(() => {
    if (status !== 'loading') return;
    const handleOffline = () => setStatus('fallback');
    window.addEventListener('offline', handleOffline);
    const timer = window.setTimeout(() => {
      setStatus('fallback');
    }, PROTOTYPE_LOAD_TIMEOUT_MS);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.clearTimeout(timer);
    };
  }, [status, reloadKey]);

  // Recover automatically if the user regains connectivity while viewing the fallback mockup
  useEffect(() => {
    if (status !== 'fallback') return;
    const handleOnline = () => startAttempt(true);
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [status, startAttempt]);

  const handleLoad = useCallback(() => {
    setStatus('loaded');
  }, []);

  const handleError = useCallback(() => {
    setStatus('fallback');
  }, []);

  const handleReset = useCallback(() => {
    startAttempt(true);
  }, [startAttempt]);

  return {
    reloadKey,
    status,
    shouldMountIframe: status === 'loading' || status === 'loaded',
    handleLoad,
    handleError,
    handleReset,
  };
}

interface DemoUtilityBarProps {
  label: string;
  href: string;
  trackingLabel: string;
  trackingLocation: ExternalLinkLocation;
  onReset: () => void;
  resetAriaLabel: string;
}

const DemoUtilityBar: React.FC<DemoUtilityBarProps> = React.memo(
  ({ label, href, trackingLabel, trackingLocation, onReset, resetAriaLabel }) => {
    const { trackExternalLinkClick } = usePortfolioAnalytics();

    const handleExternalOpen = useCallback(() => {
      trackExternalLinkClick({
        label: trackingLabel,
        url: href,
        location: trackingLocation,
        category: 'prototype',
        interaction: 'open',
      });
    }, [href, trackExternalLinkClick, trackingLabel, trackingLocation]);

    return (
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <h3 className="micro-label text-muted">{label}</h3>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 sm:gap-x-5">
          <button
            type="button"
            onClick={onReset}
            aria-label={resetAriaLabel}
            className="inline-flex min-h-[44px] items-center gap-1.5 text-[0.6875rem] sm:text-[0.71875rem] font-semibold uppercase tracking-[0.08em] text-muted transition-colors duration-150 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            <RotateCcw size={13} strokeWidth={1.75} aria-hidden="true" />
            <span>Reset Demo</span>
          </button>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleExternalOpen}
            onAuxClick={(e) => {
              if (e.button === 1) handleExternalOpen();
            }}
            className="group inline-flex min-h-[44px] items-center gap-1.5 text-[0.6875rem] sm:text-[0.71875rem] font-semibold uppercase tracking-[0.08em] text-ink editorial-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            <span>Open Fullscreen</span>
            <ArrowUpRight
              size={13}
              strokeWidth={1.75}
              className="transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden="true"
            />
          </a>
        </div>
      </div>
    );
  }
);

DemoUtilityBar.displayName = 'DemoUtilityBar';

const PrototypeLoadingOverlay: React.FC<{
  label: string;
  hasFallback: boolean;
  variant: 'mobile' | 'watch';
}> = React.memo(({ label, hasFallback, variant }) => {
  if (!hasFallback) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-stage text-center ${
          variant === 'watch' ? 'rounded-full px-8' : 'px-6'
        }`}
      >
        <span className="font-sans text-[0.78125rem] font-medium tracking-[0.02em] text-muted">
          {label}
        </span>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={
        variant === 'watch'
          ? 'pointer-events-none absolute inset-x-8 bottom-7 z-10 flex justify-center'
          : 'pointer-events-none absolute inset-x-4 bottom-5 z-10 flex justify-center'
      }
    >
      <span
        className={`rounded-[4px] border border-white/15 bg-[#0E0E0E]/88 font-sans font-medium tracking-[0.03em] text-[#F4F1EC] ${
          variant === 'watch' ? 'px-2.5 py-1 text-[0.65625rem]' : 'px-3 py-1.5 text-[0.6875rem]'
        }`}
      >
        {label}
      </span>
    </div>
  );
});

PrototypeLoadingOverlay.displayName = 'PrototypeLoadingOverlay';

const MobilePrototypeDemo: React.FC<{ item: LivePrototypeItem }> = React.memo(
  ({ item }) => {
    const screenRef = useRef<HTMLDivElement | null>(null);
    const screenBox = useElementSize(screenRef);
    const {
      reloadKey,
      status,
      shouldMountIframe,
      handleLoad,
      handleError,
      handleReset,
    } = usePrototypeLifecycle(screenRef);

    const hasSize = screenBox.width > 0 && screenBox.height > 0;
    const effectiveW = hasSize ? screenBox.width : 360;
    const effectiveH = hasSize ? screenBox.height : 758;
    const scale = effectiveW / MOBILE_VIEWPORT_W;
    const iframeHeight = Math.ceil(effectiveH / scale);
    const isIframeVisible = status === 'loaded' && hasSize;

    const iframeStyle = useMemo<React.CSSProperties>(
      () => ({
        width: `${MOBILE_VIEWPORT_W}px`,
        height: `${iframeHeight}px`,
        maxWidth: 'none',
        maxHeight: 'none',
        transform: `scale(${scale.toFixed(6)})`,
        transformOrigin: '0 0',
      }),
      [iframeHeight, scale]
    );

    const captionText =
      status === 'fallback'
        ? item.fallbackCaption ||
          'Static app preview shown — the live embed could not connect. Use Reset Demo or Open Fullscreen above.'
        : item.caption;

    return (
      <div className="pt-7 sm:pt-10">
        <DemoUtilityBar
          label={item.label}
          href={item.src}
          trackingLabel={`${item.title} (Fullscreen)`}
          trackingLocation="prototype_mobile"
          onReset={handleReset}
          resetAriaLabel="Reset interactive mobile prototype"
        />

        {/* Neutral showcase stage */}
        <div className="mt-3 rounded-[8px] border border-hairline bg-stage px-3 py-6 sm:px-6 sm:py-10">
          <div className="mx-auto flex w-full flex-col items-center">
            {/* Responsive smartphone chassis: adapts cleanly to narrow portrait, landscape phones, tablets, and desktop */}
            <div
              data-native-cursor="true"
              className="relative aspect-[9/19.5] w-[min(100%,86vw,382px,calc(max(480px,84svh)*9/19.5))] shrink-0 rounded-[40px] sm:rounded-[46px] bg-[#0E0E0E] p-[9px] sm:p-[11px] shadow-[0_26px_54px_-20px_rgba(14,14,14,0.34),0_2px_10px_rgba(14,14,14,0.12)] ring-1 ring-black/15 contain-layout"
            >
              {/* Centered speaker cutout recessed into the top bezel so the live app bar is never obstructed */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-[3.5px] sm:top-[4px] z-20 h-[3px] w-12 sm:w-14 -translate-x-1/2 rounded-full bg-[#2A2927]"
              />

              {/* Inner rounded viewport filling all four corners symmetrically */}
              <div
                ref={screenRef}
                className="relative h-full w-full overflow-hidden rounded-[31px] sm:rounded-[35px] bg-[#131A17] isolate overscroll-contain contain-strict"
              >
                {item.fallbackImage && (
                  <img
                    src={withBase(item.fallbackImage.src)}
                    alt={item.fallbackImage.alt}
                    aria-hidden={isIframeVisible || undefined}
                    width={item.fallbackImage.width}
                    height={item.fallbackImage.height}
                    loading="lazy"
                    fetchPriority="low"
                    decoding="async"
                    draggable={false}
                    className="absolute inset-0 h-full w-full select-none object-cover object-top"
                  />
                )}

                {status === 'loading' && (
                  <PrototypeLoadingOverlay
                    label={item.loadingLabel}
                    hasFallback={Boolean(item.fallbackImage)}
                    variant="mobile"
                  />
                )}

                {shouldMountIframe && (
                  <iframe
                    key={reloadKey}
                    src={item.src}
                    title={item.title}
                    width={MOBILE_VIEWPORT_W}
                    height={iframeHeight}
                    sandbox={IFRAME_SANDBOX}
                    allow={IFRAME_ALLOW}
                    referrerPolicy="strict-origin-when-cross-origin"
                    tabIndex={isIframeVisible ? undefined : -1}
                    aria-hidden={!isIframeVisible || undefined}
                    onLoad={handleLoad}
                    onError={handleError}
                    style={iframeStyle}
                    className={`absolute top-0 left-0 block border-0 transition-opacity duration-300 motion-reduce:transition-none ${
                      isIframeVisible
                        ? 'pointer-events-auto opacity-100'
                        : 'pointer-events-none opacity-0'
                    }`}
                  />
                )}
              </div>
            </div>

            <p
              role={status === 'fallback' ? 'status' : undefined}
              aria-live={status === 'fallback' ? 'polite' : undefined}
              className="mt-5 max-w-[44ch] px-1 text-center text-[0.8125rem] sm:text-[0.84375rem] leading-[1.5] text-muted"
            >
              {captionText}
            </p>
          </div>
        </div>
      </div>
    );
  }
);

MobilePrototypeDemo.displayName = 'MobilePrototypeDemo';

const WatchPrototypeDemo: React.FC<{ item: LivePrototypeItem }> = React.memo(
  ({ item }) => {
    const screenRef = useRef<HTMLDivElement | null>(null);
    const { width: screenDiameter } = useElementSize(screenRef);
    const {
      reloadKey,
      status,
      shouldMountIframe,
      handleLoad,
      handleError,
      handleReset,
    } = usePrototypeLifecycle(screenRef);

    const effectiveSize = screenDiameter > 0 ? screenDiameter : 316;
    const scale = effectiveSize / WATCH_SCREEN_CROP_DIAMETER;
    const translateX = effectiveSize / 2 - WATCH_SCREEN_CENTER_X * scale;
    const translateY = effectiveSize / 2 - WATCH_SCREEN_CENTER_Y * scale;
    const isIframeVisible = status === 'loaded' && screenDiameter > 0;

    const iframeStyle = useMemo<React.CSSProperties>(
      () => ({
        width: `${WATCH_IFRAME_W}px`,
        height: `${WATCH_IFRAME_H}px`,
        maxWidth: 'none',
        maxHeight: 'none',
        transform: `translate3d(${translateX.toFixed(2)}px, ${translateY.toFixed(2)}px, 0) scale(${scale.toFixed(5)})`,
        transformOrigin: '0 0',
      }),
      [translateX, translateY, scale]
    );

    const captionText =
      status === 'fallback'
        ? item.fallbackCaption ||
          'Static watch preview shown — the live embed could not connect. Use Reset Demo or Open Fullscreen above.'
        : item.caption;

    return (
      <div className="mt-9 border-t border-hairline pt-8 sm:mt-12 sm:pt-11">
        <DemoUtilityBar
          label={item.label}
          href={item.src}
          trackingLabel={`${item.title} (Fullscreen)`}
          trackingLocation="prototype_watch"
          onReset={handleReset}
          resetAriaLabel="Reset interactive watch prototype"
        />

        {/* Neutral showcase stage */}
        <div className="mt-3 rounded-[8px] border border-hairline bg-stage px-3 py-7 sm:px-6 sm:py-12">
          <div className="mx-auto flex w-full flex-col items-center">
            {/* Circular Pixel Watch chassis wrapper with room for tactile side crown */}
            <div className="relative flex w-full max-w-[372px] items-center justify-center px-3 sm:px-4">
              <div
                data-native-cursor="true"
                className="relative aspect-square w-[min(100%,80vw,340px,max(220px,74svh))] shrink-0 rounded-full bg-[#0E0E0E] p-[10px] sm:p-[12px] shadow-[0_26px_52px_-16px_rgba(14,14,14,0.36),0_4px_14px_rgba(14,14,14,0.14)] ring-1 ring-white/10 contain-layout"
              >
                {/* Tactile right-edge side crown nub (non-obstructive) */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-[6px] sm:-right-[7px] top-1/2 h-9 sm:h-11 w-[6px] sm:w-[7px] -translate-y-1/2 rounded-r-[4px] border border-l-0 border-[#2D2C29] bg-[#1A1918] shadow-[2px_0_6px_rgba(14,14,14,0.22)]"
                />

                {/* Strictly circular clipped live watch screen — zoomed 1:1 to OLED display with zero showcase bleed */}
                <div
                  ref={screenRef}
                  className="relative h-full w-full overflow-hidden rounded-full bg-[#121514] ring-1 ring-white/10 isolate [clip-path:circle(50%_at_50%_50%)] overscroll-contain contain-strict"
                >
                  {item.fallbackImage && (
                    <img
                      src={withBase(item.fallbackImage.src)}
                      alt={item.fallbackImage.alt}
                      aria-hidden={isIframeVisible || undefined}
                      width={item.fallbackImage.width}
                      height={item.fallbackImage.height}
                      loading="lazy"
                      fetchPriority="low"
                      decoding="async"
                      draggable={false}
                      className="absolute inset-0 h-full w-full select-none object-cover object-center"
                    />
                  )}

                  {status === 'loading' && (
                    <PrototypeLoadingOverlay
                      label={item.loadingLabel}
                      hasFallback={Boolean(item.fallbackImage)}
                      variant="watch"
                    />
                  )}

                  {shouldMountIframe && (
                    <iframe
                      key={reloadKey}
                      src={item.src}
                      title={item.title}
                      width={WATCH_IFRAME_W}
                      height={WATCH_IFRAME_H}
                      sandbox={IFRAME_SANDBOX}
                      allow={IFRAME_ALLOW}
                      referrerPolicy="strict-origin-when-cross-origin"
                      tabIndex={isIframeVisible ? undefined : -1}
                      aria-hidden={!isIframeVisible || undefined}
                      onLoad={handleLoad}
                      onError={handleError}
                      style={iframeStyle}
                      className={`absolute top-0 left-0 block border-0 transition-opacity duration-300 motion-reduce:transition-none ${
                        isIframeVisible
                          ? 'pointer-events-auto opacity-100'
                          : 'pointer-events-none opacity-0'
                      }`}
                    />
                  )}
                </div>
              </div>
            </div>

            <p
              role={status === 'fallback' ? 'status' : undefined}
              aria-live={status === 'fallback' ? 'polite' : undefined}
              className="mt-5 sm:mt-6 max-w-[44ch] px-1 text-center text-[0.8125rem] sm:text-[0.84375rem] leading-[1.5] text-muted"
            >
              {captionText}
            </p>
          </div>
        </div>
      </div>
    );
  }
);

WatchPrototypeDemo.displayName = 'WatchPrototypeDemo';

export const LivePrototypeDemos: React.FC<{
  config: LivePrototypesConfig;
}> = React.memo(({ config }) => {
  return (
    <div className="mt-9 border-t border-hairline sm:mt-12">
      <MobilePrototypeDemo item={config.mobile} />
      <WatchPrototypeDemo item={config.watch} />
    </div>
  );
});

LivePrototypeDemos.displayName = 'LivePrototypeDemos';
