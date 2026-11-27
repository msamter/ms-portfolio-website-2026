import React, { useEffect, useState } from 'react';
import { useAccessibility } from '../context/AccessibilityContext';

export interface BackspaceTextProps {
  /** Ordered sequence of phrases; computes shared prefix and backspaces only to divergence. */
  phrases: string[];
  /** Base typing interval in ms per character. */
  typeSpeed?: number;
  /** Base backspacing interval in ms per character. */
  deleteSpeed?: number;
  /** Pause in ms after completing a phrase before backspacing to the next. */
  pauseDuration?: number;
  /** Initial delay in ms before typing begins. */
  startDelay?: number;
  /** Whether to loop back to the first phrase after the last. Defaults to false (intro mode). */
  loop?: boolean;
  /** Caret style matching shadcn.io Backspace Text. */
  cursor?: 'line' | 'block';
  /** Fade out the blinking caret once the final phrase completes (when loop is false). */
  hideCursorOnComplete?: boolean;
  className?: string;
}

function getCommonPrefixLength(a: string, b: string): number {
  const limit = Math.min(a.length, b.length);
  let i = 0;
  while (i < limit && a[i] === b[i]) {
    i += 1;
  }
  return i;
}

/**
 * Natural human-revision Backspace Text animation inspired by shadcn.io/text/backspace-text.
 * Types each phrase behind a blinking caret, backspaces only to the longest shared prefix
 * with the next phrase, and types the revised ending. Respects prefers-reduced-motion.
 */
export const BackspaceText: React.FC<BackspaceTextProps> = ({
  phrases,
  typeSpeed = 46,
  deleteSpeed = 28,
  pauseDuration = 850,
  startDelay = 260,
  loop = false,
  cursor = 'line',
  hideCursorOnComplete = true,
  className = '',
}) => {
  const finalPhrase = phrases[phrases.length - 1] ?? '';

  const { settings } = useAccessibility();
  const [systemReducedMotion, setSystemReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => setSystemReducedMotion(query.matches);
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

  const prefersReducedMotion = settings.reduceMotion || systemReducedMotion;

  const [displayText, setDisplayText] = useState<string>(() =>
    prefersReducedMotion ? finalPhrase : ''
  );
  const [phase, setPhase] = useState<'idle' | 'typing' | 'pausing' | 'deleting' | 'done'>(() =>
    prefersReducedMotion ? 'done' : 'idle'
  );
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [cursorHidden, setCursorHidden] = useState(prefersReducedMotion);

  useEffect(() => {
    if (prefersReducedMotion || phrases.length === 0) {
      setDisplayText(finalPhrase);
      setPhase('done');
      setCursorHidden(true);
      return;
    }

    let timer: number | undefined;
    const safePhraseIndex = phraseIndex % phrases.length;
    const currentPhrase = phrases[safePhraseIndex] ?? '';
    const isLastPhrase = safePhraseIndex === phrases.length - 1;
    const nextIndex = isLastPhrase ? 0 : safePhraseIndex + 1;
    const nextPhrase = phrases[nextIndex] ?? '';
    const sharedPrefixLen = getCommonPrefixLength(currentPhrase, nextPhrase);

    if (phase === 'idle') {
      timer = window.setTimeout(() => {
        setPhase('typing');
      }, startDelay);
    } else if (phase === 'typing') {
      if (displayText.length < currentPhrase.length) {
        // Subtle natural cadence variance for human-like keystrokes
        const nextChar = currentPhrase[displayText.length];
        const punctuationPause = nextChar === '.' || nextChar === ',' ? 55 : 0;
        const variance = ((displayText.length * 17) % 18) - 6;
        const delay = Math.max(22, typeSpeed + variance + punctuationPause);

        timer = window.setTimeout(() => {
          setDisplayText(currentPhrase.slice(0, displayText.length + 1));
        }, delay);
      } else if (isLastPhrase && !loop) {
        setPhase('done');
      } else {
        setPhase('pausing');
      }
    } else if (phase === 'pausing') {
      timer = window.setTimeout(() => {
        setPhase('deleting');
      }, pauseDuration);
    } else if (phase === 'deleting') {
      if (displayText.length > sharedPrefixLen) {
        timer = window.setTimeout(() => {
          setDisplayText(displayText.slice(0, -1));
        }, deleteSpeed);
      } else {
        // Brief human beat at the divergence point before typing the revision
        timer = window.setTimeout(() => {
          setPhraseIndex(nextIndex);
          setPhase('typing');
        }, 160);
      }
    } else if (phase === 'done' && hideCursorOnComplete) {
      timer = window.setTimeout(() => {
        setCursorHidden(true);
      }, 1500);
    }

    return () => {
      if (timer !== undefined) {
        window.clearTimeout(timer);
      }
    };
  }, [
    displayText,
    phase,
    phraseIndex,
    phrases,
    finalPhrase,
    typeSpeed,
    deleteSpeed,
    pauseDuration,
    startDelay,
    loop,
    hideCursorOnComplete,
    prefersReducedMotion,
  ]);

  const isActivelyMoving = phase === 'typing' || phase === 'deleting';

  return (
    <span className={`inline-flex items-baseline justify-center ${className}`}>
      {/* Clean static copy for screen readers */}
      <span className="sr-only">{finalPhrase}</span>

      {/* Animated visual text */}
      <span aria-hidden="true" className="inline">
        {displayText}
        {!cursorHidden && (
          <span
            className={`inline-block align-[-0.1em] ml-[2px] transition-opacity duration-300 ${
              cursor === 'block'
                ? 'h-[1em] w-[0.52em] bg-ink'
                : 'h-[1.08em] w-[1.75px] bg-ink'
            } ${isActivelyMoving ? 'opacity-100' : 'backspace-caret-blink'}`}
          />
        )}
      </span>
    </span>
  );
};
