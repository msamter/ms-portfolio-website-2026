import { useCallback } from 'react';
import { track } from '@vercel/analytics';

export type WorkClickLocation =
  | 'home_featured_card'
  | 'next_project_card'
  | 'navbar_desktop'
  | 'navbar_mobile';

export type ExternalLinkLocation =
  | 'footer'
  | 'email_toast'
  | 'prototype_mobile'
  | 'prototype_watch'
  | 'case_study_cta';

export type ExternalLinkCategory = 'social' | 'contact' | 'prototype';

export interface WorkProjectClickParams {
  project: string;
  slug: string;
  location: WorkClickLocation;
  destination: string;
}

export interface ExternalLinkClickParams {
  label: string;
  url: string;
  location: ExternalLinkLocation;
  category: ExternalLinkCategory;
  interaction?: 'open' | 'copy';
}

type FlatAnalyticsPayload = Record<string, string | number | boolean | null>;

function resolveDomain(url: string): string {
  if (url.startsWith('mailto:')) return 'mailto';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'external';
  }
}

function safeTrack(eventName: string, payload: FlatAnalyticsPayload): void {
  if (typeof window === 'undefined') return;
  try {
    track(eventName, payload);
  } catch {
    // Never block user navigation if analytics is unavailable or blocked
  }
}

/**
 * Custom Vercel Analytics tracking hook for portfolio engagement events:
 * - Work project card clicks (Home featured card, Next Project card)
 * - Work navigation clicks (Desktop & Mobile navbar)
 * - External link interactions (Social profiles, email copy/mailto, fullscreen prototypes, case study CTAs)
 */
export function usePortfolioAnalytics() {
  const trackWorkProjectClick = useCallback(
    ({ project, slug, location, destination }: WorkProjectClickParams) => {
      safeTrack('Work Project Card Click', {
        project,
        slug,
        location,
        destination,
      });
    },
    []
  );

  const trackWorkNavClick = useCallback(
    (location: 'navbar_desktop' | 'navbar_mobile', destination: string) => {
      safeTrack('Work Navigation Click', {
        location,
        destination,
      });
    },
    []
  );

  const trackExternalLinkClick = useCallback(
    ({
      label,
      url,
      location,
      category,
      interaction = 'open',
    }: ExternalLinkClickParams) => {
      safeTrack('External Link Click', {
        label,
        domain: resolveDomain(url),
        url,
        location,
        category,
        interaction,
      });
    },
    []
  );

  return {
    trackWorkProjectClick,
    trackWorkNavClick,
    trackExternalLinkClick,
  };
}
