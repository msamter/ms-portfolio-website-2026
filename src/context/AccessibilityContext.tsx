import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

export type A11yTheme = 'default' | 'dark' | 'high-contrast';
export type A11yTextScale = '100' | '112' | '125';

export interface AccessibilitySettings {
  theme: A11yTheme;
  textScale: A11yTextScale;
  readingSpacing: boolean;
  readableFont: boolean;
  reduceMotion: boolean;
  highlightLinks: boolean;
  nativeCursor: boolean;
}

export const A11Y_STORAGE_KEY = 'ms-accessibility-v1';

export const DEFAULT_ACCESSIBILITY_SETTINGS: AccessibilitySettings = {
  theme: 'default',
  textScale: '100',
  readingSpacing: false,
  readableFont: false,
  reduceMotion: false,
  highlightLinks: false,
  nativeCursor: false,
};

const THEME_COLORS: Record<A11yTheme, string> = {
  default: '#F4F1EC',
  dark: '#121211',
  'high-contrast': '#FFFFFF',
};

function getSystemReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function readStoredSettings(): { settings: AccessibilitySettings; hasStoredReduceMotion: boolean } {
  const systemReduced = getSystemReducedMotion();
  const base: AccessibilitySettings = {
    ...DEFAULT_ACCESSIBILITY_SETTINGS,
    reduceMotion: systemReduced,
  };

  if (typeof window === 'undefined') {
    return { settings: base, hasStoredReduceMotion: false };
  }

  try {
    const raw = window.localStorage.getItem(A11Y_STORAGE_KEY);
    if (!raw) return { settings: base, hasStoredReduceMotion: false };
    const parsed = JSON.parse(raw) as Partial<AccessibilitySettings>;
    const validTheme: A11yTheme =
      parsed.theme === 'dark' || parsed.theme === 'high-contrast' || parsed.theme === 'default'
        ? parsed.theme
        : 'default';
    const validScale: A11yTextScale =
      parsed.textScale === '112' || parsed.textScale === '125' || parsed.textScale === '100'
        ? parsed.textScale
        : '100';
    const hasStoredReduceMotion = typeof parsed.reduceMotion === 'boolean';

    return {
      hasStoredReduceMotion,
      settings: {
        theme: validTheme,
        textScale: validScale,
        readingSpacing: Boolean(parsed.readingSpacing),
        readableFont: Boolean(parsed.readableFont),
        reduceMotion: hasStoredReduceMotion ? Boolean(parsed.reduceMotion) : systemReduced,
        highlightLinks: Boolean(parsed.highlightLinks),
        nativeCursor: Boolean(parsed.nativeCursor),
      },
    };
  } catch {
    return { settings: base, hasStoredReduceMotion: false };
  }
}

export function applyAccessibilityAttributes(settings: AccessibilitySettings): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  if (settings.theme === 'default') {
    root.removeAttribute('data-a11y-theme');
  } else {
    root.setAttribute('data-a11y-theme', settings.theme);
  }

  if (settings.textScale === '100') {
    root.removeAttribute('data-a11y-text');
  } else {
    root.setAttribute('data-a11y-text', settings.textScale);
  }

  const toggleAttr = (name: string, enabled: boolean) => {
    if (enabled) {
      root.setAttribute(name, 'true');
    } else {
      root.removeAttribute(name);
    }
  };

  toggleAttr('data-a11y-spacing', settings.readingSpacing);
  toggleAttr('data-a11y-readable-font', settings.readableFont);
  toggleAttr('data-a11y-reduced-motion', settings.reduceMotion);
  toggleAttr('data-a11y-links', settings.highlightLinks);

  const themeMeta = document.head.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (themeMeta) {
    themeMeta.setAttribute('content', THEME_COLORS[settings.theme]);
  }
}

interface AccessibilityContextValue {
  settings: AccessibilitySettings;
  activeCount: number;
  isOpen: boolean;
  announcement: string;
  openPanel: (triggerEl?: HTMLElement | null) => void;
  closePanel: () => void;
  togglePanel: (triggerEl?: HTMLElement | null) => void;
  updateSetting: <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K],
    label?: string
  ) => void;
  resetSettings: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialRef = useRef<{
    settings: AccessibilitySettings;
    hasStoredReduceMotion: boolean;
  } | null>(null);
  if (!initialRef.current) {
    initialRef.current = readStoredSettings();
  }

  const [settings, setSettings] = useState<AccessibilitySettings>(
    () => initialRef.current!.settings
  );
  const hasExplicitMotionRef = useRef<boolean>(initialRef.current.hasStoredReduceMotion);
  const [isOpen, setIsOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const returnFocusRef = useRef<HTMLElement | null>(null);

  // Sync DOM attributes before paint so theme/font/spacing update without flicker
  useLayoutEffect(() => {
    applyAccessibilityAttributes(settings);
  }, [settings]);

  // Persist user choices to localStorage
  useEffect(() => {
    try {
      const hasAnyCustom =
        settings.theme !== 'default' ||
        settings.textScale !== '100' ||
        settings.readingSpacing ||
        settings.readableFont ||
        settings.highlightLinks ||
        settings.nativeCursor ||
        hasExplicitMotionRef.current;

      if (!hasAnyCustom) {
        window.localStorage.removeItem(A11Y_STORAGE_KEY);
        return;
      }

      const payload: Partial<AccessibilitySettings> = {
        theme: settings.theme,
        textScale: settings.textScale,
        readingSpacing: settings.readingSpacing,
        readableFont: settings.readableFont,
        highlightLinks: settings.highlightLinks,
        nativeCursor: settings.nativeCursor,
      };
      if (hasExplicitMotionRef.current) {
        payload.reduceMotion = settings.reduceMotion;
      }
      window.localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage failures in restricted contexts
    }
  }, [settings]);

  // Follow OS prefers-reduced-motion changes unless the user explicitly chose a setting
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => {
      if (!hasExplicitMotionRef.current) {
        setSettings((prev) => ({ ...prev, reduceMotion: query.matches }));
      }
    };
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

  const openPanel = useCallback((triggerEl?: HTMLElement | null) => {
    returnFocusRef.current =
      triggerEl ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    setIsOpen(true);
  }, []);

  const closePanel = useCallback(() => {
    setIsOpen(false);
    const target = returnFocusRef.current;
    if (target && document.contains(target)) {
      window.requestAnimationFrame(() => {
        target.focus();
      });
    }
  }, []);

  const togglePanel = useCallback(
    (triggerEl?: HTMLElement | null) => {
      setIsOpen((prev) => {
        if (prev) {
          const target = returnFocusRef.current;
          if (target && document.contains(target)) {
            window.requestAnimationFrame(() => target.focus());
          }
          return false;
        }
        returnFocusRef.current =
          triggerEl ??
          (document.activeElement instanceof HTMLElement ? document.activeElement : null);
        return true;
      });
    },
    []
  );

  // Global keyboard shortcut: Alt + A toggles the Accessibility Settings dialog
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && !event.ctrlKey && !event.metaKey && event.key.toLowerCase() === 'a') {
        const activeTag = document.activeElement?.tagName;
        if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') return;
        event.preventDefault();
        togglePanel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePanel]);

  const updateSetting = useCallback(
    <K extends keyof AccessibilitySettings>(
      key: K,
      value: AccessibilitySettings[K],
      label?: string
    ) => {
      if (key === 'reduceMotion') {
        hasExplicitMotionRef.current = true;
      }
      setSettings((prev) => {
        if (prev[key] === value) return prev;
        return { ...prev, [key]: value };
      });
      if (label) {
        setAnnouncement(label);
      }
    },
    []
  );

  const resetSettings = useCallback(() => {
    hasExplicitMotionRef.current = false;
    const systemReduced = getSystemReducedMotion();
    setSettings({
      ...DEFAULT_ACCESSIBILITY_SETTINGS,
      reduceMotion: systemReduced,
    });
    try {
      window.localStorage.removeItem(A11Y_STORAGE_KEY);
    } catch {
      // Ignore storage failures
    }
    setAnnouncement('Accessibility settings reset to defaults.');
  }, []);

  const activeCount = useMemo(() => {
    let count = 0;
    if (settings.theme !== 'default') count += 1;
    if (settings.textScale !== '100') count += 1;
    if (settings.readingSpacing) count += 1;
    if (settings.readableFont) count += 1;
    if (hasExplicitMotionRef.current && settings.reduceMotion !== getSystemReducedMotion()) {
      count += 1;
    } else if (settings.reduceMotion) {
      count += 1;
    }
    if (settings.highlightLinks) count += 1;
    if (settings.nativeCursor) count += 1;
    return count;
  }, [settings]);

  const value = useMemo<AccessibilityContextValue>(
    () => ({
      settings,
      activeCount,
      isOpen,
      announcement,
      openPanel,
      closePanel,
      togglePanel,
      updateSetting,
      resetSettings,
    }),
    [
      settings,
      activeCount,
      isOpen,
      announcement,
      openPanel,
      closePanel,
      togglePanel,
      updateSetting,
      resetSettings,
    ]
  );

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export function useAccessibility(): AccessibilityContextValue {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return ctx;
}
