import React from 'react';
import { Github, Linkedin } from 'lucide-react';
import { CONTACT_EMAIL } from '../data/projects';

import { isModifiedEvent } from '../utils/paths';
import { usePortfolioAnalytics } from '../hooks/usePortfolioAnalytics';

interface FooterProps {
  onEmailClick: () => void;
}

const LINKEDIN_URL = 'https://www.linkedin.com/in/micahsamter/';
const GITHUB_URL = 'https://github.com/msamter';

const ProtonMailIcon: React.FC<{ size?: number; strokeWidth?: number; className?: string }> = ({
  size = 14,
  strokeWidth = 1.75,
  className = '',
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className}
  >
    <path d="M3 6.2c0-1 1.1-1.6 1.9-.9L12 11l7.1-5.7c.8-.7 1.9-.1 1.9.9v11.3c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V6.2Z" />
    <path d="M16.5 7.4v12.1" />
    <path d="M3 10.5 12 16.5l4.5-3" />
  </svg>
);

export const Footer: React.FC<FooterProps> = React.memo(({ onEmailClick }) => {
  const { trackExternalLinkClick } = usePortfolioAnalytics();

  return (
    <footer className="mt-20 sm:mt-32 bg-alabaster">
      <div className="mx-auto flex max-w-[1100px] flex-col items-center justify-center px-5 pt-10 pb-[calc(5.25rem+env(safe-area-inset-bottom))] sm:px-10 sm:pt-16 sm:pb-20 text-center">
        {/* Centered Social & Contact Links Row */}
        <nav
          aria-label="Footer Contact Links"
          className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 sm:gap-x-7"
        >
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            onClick={(e) => {
              const modified = isModifiedEvent(e);
              trackExternalLinkClick({
                label: 'Email',
                url: `mailto:${CONTACT_EMAIL}`,
                location: 'footer',
                category: 'contact',
                interaction: modified ? 'open' : 'copy',
              });
              if (modified) return;
              e.preventDefault();
              onEmailClick();
            }}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 px-2 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-ink editorial-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus whitespace-nowrap"
          >
            <ProtonMailIcon size={14} strokeWidth={1.75} className="shrink-0" />
            <span>EMAIL</span>
          </a>
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              trackExternalLinkClick({
                label: 'LinkedIn',
                url: LINKEDIN_URL,
                location: 'footer',
                category: 'social',
                interaction: 'open',
              })
            }
            onAuxClick={(e) => {
              if (e.button !== 1) return;
              trackExternalLinkClick({
                label: 'LinkedIn',
                url: LINKEDIN_URL,
                location: 'footer',
                category: 'social',
                interaction: 'open',
              });
            }}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 px-2 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-ink editorial-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus whitespace-nowrap"
          >
            <Linkedin size={14} strokeWidth={1.75} className="shrink-0" aria-hidden="true" />
            <span>LINKEDIN</span>
          </a>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              trackExternalLinkClick({
                label: 'GitHub',
                url: GITHUB_URL,
                location: 'footer',
                category: 'social',
                interaction: 'open',
              })
            }
            onAuxClick={(e) => {
              if (e.button !== 1) return;
              trackExternalLinkClick({
                label: 'GitHub',
                url: GITHUB_URL,
                location: 'footer',
                category: 'social',
                interaction: 'open',
              });
            }}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 px-2 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-ink editorial-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus whitespace-nowrap"
          >
            <Github size={14} strokeWidth={1.75} className="shrink-0" aria-hidden="true" />
            <span>GITHUB</span>
          </a>
        </nav>

        {/* Quiet Copyright Notice */}
        <p className="mt-10 text-[11.5px] font-normal tracking-[0.04em] text-muted tabular-nums">
          &copy; Micah Samter 2026
        </p>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';
