import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { RotateCcw, X } from 'lucide-react';
import {
  A11yTextScale,
  A11yTheme,
  useAccessibility,
} from '../context/AccessibilityContext';

const DIALOG_TRANSITION = {
  duration: 0.18,
  ease: [0.22, 1, 0.36, 1] as const,
} as const;

const THEME_OPTIONS: ReadonlyArray<{ value: A11yTheme; label: string }> = [
  { value: 'default', label: 'Default' },
  { value: 'dark', label: 'Dark' },
  { value: 'high-contrast', label: 'High Contrast' },
];

const TEXT_SCALE_OPTIONS: ReadonlyArray<{ value: A11yTextScale; label: string }> = [
  { value: '100', label: '100%' },
  { value: '112', label: '112%' },
  { value: '125', label: '125%' },
];

/** Clean universal accessibility mark drawn on a 24x24 grid */
export const AccessibilityMark: React.FC<{ size?: number; className?: string }> = ({
  size = 18,
  className = '',
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className}
  >
    <circle cx="12" cy="4.5" r="1.75" />
    <path d="M5 8.5h14" />
    <path d="M12 8.5v5.25" />
    <path d="M8.75 20.5 12 13.75l3.25 6.75" />
  </svg>
);

interface SwitchRowProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
}

const SwitchRow: React.FC<SwitchRowProps> = ({
  id,
  label,
  description,
  checked,
  onToggle,
}) => (
  <div className="flex items-center justify-between gap-4 py-3.5">
    <div className="min-w-0">
      <label
        htmlFor={id}
        className="block text-[0.90625rem] font-medium leading-[1.3] text-ink cursor-pointer"
      >
        {label}
      </label>
      <p id={`${id}-desc`} className="mt-1 text-[0.8125rem] leading-[1.45] text-muted">
        {description}
      </p>
    </div>

    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-describedby={`${id}-desc`}
      onClick={onToggle}
      className="relative inline-flex min-h-[44px] min-w-[52px] shrink-0 items-center justify-end focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      <span
        aria-hidden="true"
        className={`relative inline-flex h-[26px] w-[46px] items-center rounded-full border transition-colors duration-150 ${
          checked
            ? 'border-accent-bg bg-accent-bg'
            : 'border-hairline bg-stage'
        }`}
      >
        <span
          className={`inline-block h-[18px] w-[18px] rounded-full transition-transform duration-150 ${
            checked
              ? 'translate-x-[23px] bg-accent-fg'
              : 'translate-x-[3px] bg-ink'
          }`}
        />
      </span>
    </button>
  </div>
);

export const AccessibilityControls: React.FC = () => {
  const {
    settings,
    activeCount,
    isOpen,
    announcement,
    togglePanel,
    closePanel,
    updateSetting,
    resetSettings,
  } = useAccessibility();

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  // Focus management, focus trapping, and Escape dismissal when dialog is open
  useEffect(() => {
    if (!isOpen) return;

    const raf = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closePanel();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closePanel]);

  const hasCustomizations = activeCount > 0;

  return (
    <>
      {/* Live region for assistive tech status confirmations */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>

      {/* Quiet Editorial Corner Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => togglePanel(triggerRef.current)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls="a11y-settings-dialog"
        aria-label={
          hasCustomizations
            ? `Accessibility settings (${activeCount} active)`
            : 'Accessibility settings'
        }
        title="Accessibility settings (Alt+A)"
        className={`fixed bottom-4 right-4 z-40 inline-flex h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-[8px] border px-3 shadow-[0_8px_24px_-12px_rgba(14,14,14,0.22)] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus sm:bottom-5 sm:right-5 ${
          hasCustomizations
            ? 'border-accent-bg bg-accent-bg text-accent-fg hover:bg-accent-bg-hover'
            : 'border-hairline bg-surface text-ink hover:bg-stage'
        }`}
      >
        <AccessibilityMark size={18} className="shrink-0" />
        <span className="hidden sm:inline text-[11px] font-semibold uppercase tracking-[0.08em] whitespace-nowrap">
          Accessibility
        </span>
        {hasCustomizations && (
          <span className="text-[11px] font-semibold tabular-nums whitespace-nowrap">
            ({activeCount})
          </span>
        )}
      </button>

      {/* Accessible Settings Dialog */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-end p-3 sm:items-center sm:justify-end sm:p-5">
            {/* Subtle Backdrop */}
            <motion.div
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={DIALOG_TRANSITION}
              onClick={closePanel}
              className="fixed inset-0 bg-black/35"
            />

            {/* Dialog Panel */}
            <motion.div
              ref={dialogRef}
              id="a11y-settings-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="a11y-dialog-title"
              aria-describedby="a11y-dialog-subtitle"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={DIALOG_TRANSITION}
              className="relative z-10 flex max-h-[calc(100svh-1.5rem)] w-full max-w-[410px] flex-col overflow-hidden rounded-[10px] border border-hairline bg-surface text-ink shadow-[0_24px_48px_-16px_rgba(0,0,0,0.28)] sm:max-h-[calc(100svh-2.5rem)]"
            >
              {/* Dialog Header */}
              <div className="flex items-start justify-between gap-4 border-b border-hairline px-5 py-4 sm:px-6">
                <div>
                  <p className="micro-label text-muted">ACCESSIBILITY</p>
                  <h2
                    id="a11y-dialog-title"
                    className="mt-1 text-[1.125rem] font-semibold tracking-[-0.015em] text-ink"
                  >
                    Display &amp; Reading Settings
                  </h2>
                  <p id="a11y-dialog-subtitle" className="mt-0.5 text-[0.8125rem] text-muted">
                    Adjust contrast, type size, spacing, and motion. Preferences save automatically.
                  </p>
                </div>

                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={closePanel}
                  aria-label="Close accessibility settings"
                  className="-mr-2 -mt-1 inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-[6px] text-ink transition-colors duration-150 hover:bg-stage focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  <X size={18} strokeWidth={1.75} aria-hidden="true" />
                </button>
              </div>

              {/* Scrollable Controls Body */}
              <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
                {/* Appearance / Contrast */}
                <fieldset>
                  <legend className="micro-label text-muted">APPEARANCE &amp; CONTRAST</legend>
                  <div
                    role="radiogroup"
                    aria-label="Appearance and contrast mode"
                    className="mt-2.5 grid grid-cols-3 gap-1.5 rounded-[8px] border border-hairline bg-stage p-1"
                  >
                    {THEME_OPTIONS.map((option) => {
                      const selected = settings.theme === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() =>
                            updateSetting(
                              'theme',
                              option.value,
                              `${option.label} appearance selected.`
                            )
                          }
                          className={`min-h-[40px] rounded-[6px] px-2 py-2 text-[0.78125rem] font-semibold whitespace-nowrap transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
                            selected
                              ? 'bg-accent-bg text-accent-fg'
                              : 'text-ink hover:bg-surface/70'
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                {/* Text Size */}
                <fieldset className="mt-5">
                  <legend className="micro-label text-muted">TEXT SIZE</legend>
                  <div
                    role="radiogroup"
                    aria-label="Text size scale"
                    className="mt-2.5 grid grid-cols-3 gap-1.5 rounded-[8px] border border-hairline bg-stage p-1"
                  >
                    {TEXT_SCALE_OPTIONS.map((option) => {
                      const selected = settings.textScale === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() =>
                            updateSetting(
                              'textScale',
                              option.value,
                              `Text size set to ${option.label}.`
                            )
                          }
                          className={`min-h-[40px] rounded-[6px] px-2 py-2 text-[0.8125rem] font-semibold tabular-nums whitespace-nowrap transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
                            selected
                              ? 'bg-accent-bg text-accent-fg'
                              : 'text-ink hover:bg-surface/70'
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                {/* Reading & Interaction Switches */}
                <div className="mt-5 border-t border-hairline divide-y divide-hairline">
                  <SwitchRow
                    id="a11y-spacing"
                    label="Relaxed Spacing"
                    description="Increases line height, letter spacing, and word spacing."
                    checked={settings.readingSpacing}
                    onToggle={() =>
                      updateSetting(
                        'readingSpacing',
                        !settings.readingSpacing,
                        !settings.readingSpacing
                          ? 'Relaxed reading spacing enabled.'
                          : 'Relaxed reading spacing disabled.'
                      )
                    }
                  />
                  <SwitchRow
                    id="a11y-readable-font"
                    label="Plain Headings"
                    description="Replaces condensed display type with standard sans-serif headings."
                    checked={settings.readableFont}
                    onToggle={() =>
                      updateSetting(
                        'readableFont',
                        !settings.readableFont,
                        !settings.readableFont
                          ? 'Plain sans-serif headings enabled.'
                          : 'Display headings restored.'
                      )
                    }
                  />
                  <SwitchRow
                    id="a11y-reduce-motion"
                    label="Reduce Motion"
                    description="Pauses typing animations, scroll tracks, and page transitions."
                    checked={settings.reduceMotion}
                    onToggle={() =>
                      updateSetting(
                        'reduceMotion',
                        !settings.reduceMotion,
                        !settings.reduceMotion
                          ? 'Reduced motion enabled.'
                          : 'Animations restored.'
                      )
                    }
                  />
                  <SwitchRow
                    id="a11y-highlight-links"
                    label="Highlight Links & Focus"
                    description="Underlines all links and strengthens keyboard focus outlines."
                    checked={settings.highlightLinks}
                    onToggle={() =>
                      updateSetting(
                        'highlightLinks',
                        !settings.highlightLinks,
                        !settings.highlightLinks
                          ? 'Link underlines and strong focus rings enabled.'
                          : 'Link highlights restored to default.'
                      )
                    }
                  />
                  <SwitchRow
                    id="a11y-native-cursor"
                    label="Standard System Cursor"
                    description="Turns off the custom circular cursor in favor of your OS pointer."
                    checked={settings.nativeCursor}
                    onToggle={() =>
                      updateSetting(
                        'nativeCursor',
                        !settings.nativeCursor,
                        !settings.nativeCursor
                          ? 'Standard system cursor enabled.'
                          : 'Custom cursor restored.'
                      )
                    }
                  />
                </div>
              </div>

              {/* Dialog Footer */}
              <div className="flex items-center justify-between gap-3 border-t border-hairline bg-stage/60 px-5 py-3.5 sm:px-6">
                <span className="text-[0.75rem] text-muted whitespace-nowrap">
                  Shortcut: <kbd className="font-semibold text-ink">Alt + A</kbd>
                </span>
                <button
                  type="button"
                  onClick={resetSettings}
                  disabled={!hasCustomizations}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-[6px] border border-hairline bg-surface px-3.5 py-2 text-[0.75rem] font-semibold uppercase tracking-[0.06em] text-ink whitespace-nowrap transition-colors duration-150 hover:bg-stage disabled:opacity-45 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  <RotateCcw size={13} strokeWidth={1.75} aria-hidden="true" />
                  <span>Reset Defaults</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
