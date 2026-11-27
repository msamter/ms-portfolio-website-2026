import React from 'react';
import { motion } from 'motion/react';
import { isModifiedEvent, withBase } from '../utils/paths';

interface NotFoundViewProps {
  onNavigate: (path: string) => void;
}

const FADE_UP_TRANSITION = { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const };

export const NotFoundView: React.FC<NotFoundViewProps> = ({ onNavigate }) => {
  return (
    <main id="main-content" className="flex min-h-screen w-full flex-col items-center justify-between bg-alabaster px-6 py-10 text-center">
      <div className="flex flex-1 flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={FADE_UP_TRANSITION}
          className="max-w-[540px]"
        >
          <h1 className="text-[1.85rem] sm:text-[2.15rem] font-normal tracking-[-0.02em] leading-[1.2] text-ink">
            This page doesn&apos;t exist
          </h1>
          <p className="mt-3 text-[0.98rem] sm:text-[1.02rem] font-medium leading-[1.5] text-ink-body">
            The link might be broken, or the project moved on. Let&apos;s get you back on track.
          </p>

          <div className="mt-8">
            <a
              href={withBase('/')}
              onClick={(e) => {
                if (isModifiedEvent(e)) return;
                e.preventDefault();
                onNavigate('/');
              }}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink editorial-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
            >
              BACK TO HOME
            </a>
          </div>
        </motion.div>
      </div>

      <p className="mt-10 text-[11.5px] font-normal tracking-[0.04em] text-muted tabular-nums">
        &copy; Micah Samter 2026
      </p>
    </main>
  );
};
