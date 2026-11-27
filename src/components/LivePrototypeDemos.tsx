import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowUpRight, RotateCcw } from 'lucide-react';

export interface LivePrototypeItem {
  label: string;
  src: string;
  title: string;
  loadingLabel: string;
  caption: string;
}

export interface LivePrototypesConfig {
  mobile: LivePrototypeItem;
  watch: LivePrototypeItem;
}

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

interface DemoUtilityBarProps {
  label: string;
  href: string;
  onReset: () => void;
  resetAriaLabel: string;
}

const DemoUtilityBar: React.FC<DemoUtilityBarProps> = ({
  label,
  href,
  onReset,
  resetAriaLabel,
}) => (
  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
    <h3 className="micro-label text-muted">{label}</h3>
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
      <button
        type="button"
        onClick={onReset}
        aria-label={resetAriaLabel}
        className="inline-flex min-h-[44px] items-center gap-1.5 text-[11px] sm:text-[11.5px] font-semibold uppercase tracking-[0.08em] text-muted transition-colors duration-150 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        <RotateCcw size={13} strokeWidth={1.75} aria-hidden="true" />
        <span>Reset Demo</span>
      </button>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex min-h-[44px] items-center gap-1.5 text-[11px] sm:text-[11.5px] font-semibold uppercase tracking-[0.08em] text-ink editorial-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
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

const MobilePrototypeDemo: React.FC<{ item: LivePrototypeItem }> = React.memo(
  ({ item }) => {
    const [reloadKey, setReloadKey] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);
    const [screenBox, setScreenBox] = useState({ width: 0, height: 0 });
    const screenRef = useRef<HTMLDivElement | null>(null);

    const measureScreen = useCallback(() => {
      const el = screenRef.current;
      if (!el) return;
      const nextWidth = el.clientWidth;
      const nextHeight = el.clientHeight;
      if (nextWidth > 0 && nextHeight > 0) {
        setScreenBox((prev) =>
          Math.abs(prev.width - nextWidth) < 0.5 &&
          Math.abs(prev.height - nextHeight) < 0.5
            ? prev
            : { width: nextWidth, height: nextHeight }
        );
      }
    }, []);

    useLayoutEffect(() => {
      measureScreen();
    }, [measureScreen]);

    useEffect(() => {
      const el = screenRef.current;
      if (!el) return;
      if (typeof ResizeObserver !== 'undefined') {
        const observer = new ResizeObserver(measureScreen);
        observer.observe(el);
        return () => observer.disconnect();
      }
      window.addEventListener('resize', measureScreen, { passive: true });
      return () => window.removeEventListener('resize', measureScreen);
    }, [measureScreen]);

    const handleReset = useCallback(() => {
      setIsLoaded(false);
      setReloadKey((k) => k + 1);
    }, []);

    const hasSize = screenBox.width > 0 && screenBox.height > 0;
    const effectiveW = hasSize ? screenBox.width : 360;
    const effectiveH = hasSize ? screenBox.height : 758;
    const scale = effectiveW / MOBILE_VIEWPORT_W;
    const iframeHeight = Math.ceil(effectiveH / scale);

    return (
      <div className="pt-8 sm:pt-10">
        <DemoUtilityBar
          label={item.label}
          href={item.src}
          onReset={handleReset}
          resetAriaLabel="Reset interactive mobile prototype"
        />

        {/* Neutral showcase stage */}
        <div className="mt-3 rounded-[8px] border border-hairline bg-stage px-3 py-7 sm:px-6 sm:py-10">
          <div className="mx-auto flex w-full flex-col items-center">
            {/* Realistic modern smartphone chassis with symmetric 11px bezels and top-bezel speaker pill */}
            <div
              data-native-cursor="true"
              className="relative w-[min(100%,88vw,382px)] aspect-[9/19.5] sm:aspect-auto sm:h-[780px] rounded-[46px] bg-[#0E0E0E] p-[11px] shadow-[0_26px_54px_-20px_rgba(14,14,14,0.34),0_2px_10px_rgba(14,14,14,0.12)] ring-1 ring-black/15"
            >
              {/* Centered speaker cutout recessed into the top bezel so the live app bar is never obstructed */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-[4px] z-20 h-[3px] w-14 -translate-x-1/2 rounded-full bg-[#2A2927]"
              />

              {/* Inner rounded viewport filling all four corners symmetrically */}
              <div
                ref={screenRef}
                className="relative h-full w-full overflow-hidden rounded-[35px] bg-[#111214] isolate overscroll-contain"
              >
                {!isLoaded && (
                  <div
                    role="status"
                    aria-live="polite"
                    className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2.5 bg-stage px-6 text-center"
                  >
                    <span
                      aria-hidden="true"
                      className="h-1.5 w-1.5 rounded-full bg-muted animate-pulse"
                    />
                    <span className="font-sans text-[12.5px] font-medium tracking-[0.02em] text-muted">
                      {item.loadingLabel}
                    </span>
                  </div>
                )}

                <iframe
                  key={reloadKey}
                  src={item.src}
                  title={item.title}
                  loading="lazy"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  allow="clipboard-write; fullscreen"
                  onLoad={() => setIsLoaded(true)}
                  style={{
                    width: `${MOBILE_VIEWPORT_W}px`,
                    height: `${iframeHeight}px`,
                    maxWidth: 'none',
                    maxHeight: 'none',
                    transform: `scale(${scale.toFixed(6)})`,
                    transformOrigin: '0 0',
                  }}
                  className={`absolute top-0 left-0 block border-0 transition-opacity duration-300 motion-reduce:transition-none ${
                    isLoaded && hasSize ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              </div>
            </div>

            <p className="mt-5 max-w-[44ch] text-center text-[0.8125rem] sm:text-[0.84375rem] leading-[1.5] text-muted">
              {item.caption}
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
    const [reloadKey, setReloadKey] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);
    const [screenDiameter, setScreenDiameter] = useState(0);
    const screenRef = useRef<HTMLDivElement | null>(null);

    const measureScreen = useCallback(() => {
      const el = screenRef.current;
      if (!el) return;
      const nextSize = el.clientWidth;
      if (nextSize > 0) {
        setScreenDiameter((prev) => (Math.abs(prev - nextSize) < 0.5 ? prev : nextSize));
      }
    }, []);

    useLayoutEffect(() => {
      measureScreen();
    }, [measureScreen]);

    useEffect(() => {
      const el = screenRef.current;
      if (!el) return;
      if (typeof ResizeObserver !== 'undefined') {
        const observer = new ResizeObserver(measureScreen);
        observer.observe(el);
        return () => observer.disconnect();
      }
      window.addEventListener('resize', measureScreen, { passive: true });
      return () => window.removeEventListener('resize', measureScreen);
    }, [measureScreen]);

    const handleReset = useCallback(() => {
      setIsLoaded(false);
      setReloadKey((k) => k + 1);
    }, []);

    const effectiveSize = screenDiameter > 0 ? screenDiameter : 316;
    const scale = effectiveSize / WATCH_SCREEN_CROP_DIAMETER;
    const translateX = effectiveSize / 2 - WATCH_SCREEN_CENTER_X * scale;
    const translateY = effectiveSize / 2 - WATCH_SCREEN_CENTER_Y * scale;

    return (
      <div className="mt-10 border-t border-hairline pt-9 sm:mt-12 sm:pt-11">
        <DemoUtilityBar
          label={item.label}
          href={item.src}
          onReset={handleReset}
          resetAriaLabel="Reset interactive watch prototype"
        />

        {/* Neutral showcase stage */}
        <div className="mt-3 rounded-[8px] border border-hairline bg-stage px-4 py-8 sm:px-6 sm:py-12">
          <div className="mx-auto flex w-full flex-col items-center">
            {/* Circular Pixel Watch chassis wrapper with room for tactile side crown */}
            <div className="relative flex w-full max-w-[372px] items-center justify-center px-4">
              <div
                data-native-cursor="true"
                className="relative aspect-square w-[min(100%,82vw,340px)] rounded-full bg-[#0E0E0E] p-[12px] shadow-[0_26px_52px_-16px_rgba(14,14,14,0.36),0_4px_14px_rgba(14,14,14,0.14)] ring-1 ring-white/10"
              >
                {/* Tactile right-edge side crown nub (non-obstructive) */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-[7px] top-1/2 h-11 w-[7px] -translate-y-1/2 rounded-r-[4px] border border-l-0 border-[#2D2C29] bg-[#1A1918] shadow-[2px_0_6px_rgba(14,14,14,0.22)]"
                />

                {/* Strictly circular clipped live watch screen — zoomed 1:1 to OLED display with zero showcase bleed */}
                <div
                  ref={screenRef}
                  className="relative h-full w-full overflow-hidden rounded-full bg-[#121514] ring-1 ring-white/10 isolate [clip-path:circle(50%_at_50%_50%)] overscroll-contain"
                >
                  {!isLoaded && (
                    <div
                      role="status"
                      aria-live="polite"
                      className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2.5 rounded-full bg-stage px-8 text-center"
                    >
                      <span
                        aria-hidden="true"
                        className="h-1.5 w-1.5 rounded-full bg-muted animate-pulse"
                      />
                      <span className="font-sans text-[12.5px] font-medium tracking-[0.02em] text-muted">
                        {item.loadingLabel}
                      </span>
                    </div>
                  )}

                  <iframe
                    key={reloadKey}
                    src={item.src}
                    title={item.title}
                    loading="lazy"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    allow="clipboard-write; fullscreen"
                    onLoad={() => setIsLoaded(true)}
                    style={{
                      width: `${WATCH_IFRAME_W}px`,
                      height: `${WATCH_IFRAME_H}px`,
                      maxWidth: 'none',
                      maxHeight: 'none',
                      transform: `translate3d(${translateX.toFixed(2)}px, ${translateY.toFixed(2)}px, 0) scale(${scale.toFixed(5)})`,
                      transformOrigin: '0 0',
                    }}
                    className={`absolute top-0 left-0 block border-0 transition-opacity duration-300 motion-reduce:transition-none ${
                      isLoaded && screenDiameter > 0 ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                </div>
              </div>
            </div>

            <p className="mt-6 max-w-[44ch] text-center text-[0.8125rem] sm:text-[0.84375rem] leading-[1.5] text-muted">
              {item.caption}
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
    <div className="mt-10 border-t border-hairline sm:mt-12">
      <MobilePrototypeDemo item={config.mobile} />
      <WatchPrototypeDemo item={config.watch} />
    </div>
  );
});

LivePrototypeDemos.displayName = 'LivePrototypeDemos';
