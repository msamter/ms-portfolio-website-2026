import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { Check, Mail } from 'lucide-react';
import { CASE_STUDIES, CONTACT_EMAIL } from './data/projects';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomeView } from './views/HomeView';
import { CustomCursor } from './components/CustomCursor';
import { AccessibilityControls } from './components/AccessibilityControls';
import { AccessibilityProvider, useAccessibility } from './context/AccessibilityContext';
import { stripBase, withBase } from './utils/paths';
import { usePortfolioAnalytics } from './hooks/usePortfolioAnalytics';

const CaseStudyView = lazy(() =>
  import('./views/CaseStudyView').then((mod) => ({ default: mod.CaseStudyView }))
);
const NotFoundView = lazy(() =>
  import('./views/NotFoundView').then((mod) => ({ default: mod.NotFoundView }))
);

const PAGE_TRANSITION = { duration: 0.16, ease: [0.22, 1, 0.36, 1] as const };
const TOAST_TRANSITION = { duration: 0.16, ease: [0.22, 1, 0.36, 1] as const };
const SITE_NAME = 'Micah Samter — UX Researcher & Designer';
const HOME_META = {
  title: 'Micah Samter — UX Researcher & Designer',
  description:
    'Portfolio of Micah Samter, UX Researcher & Designer in Atlanta, GA—using ethnographic fieldwork and usability testing to build human-centered products.',
};
const WELLBE_META = {
  title: 'WELLBE+ — UX Case Study | Micah Samter',
  description:
    'WELLBE+ UX research & product design case study by Micah Samter: 50 surveys, 7 interviews, and a 22-app audit behind a holistic mental health app.',
};
const NOT_FOUND_META = {
  title: 'Page Not Found — Micah Samter',
  description:
    "The page you're looking for doesn't exist. Return to Micah Samter's UX research and design portfolio.",
};

const PRIMARY_WORK_ROUTE = '/Work';

const LEGACY_ROUTE_REDIRECTS: Record<string, string> = {
  '/work': PRIMARY_WORK_ROUTE,
  '/work/wellbe': PRIMARY_WORK_ROUTE,
  '/work/holistic-mental-health': PRIMARY_WORK_ROUTE,
};

function normalizePath(rawPath: string): string {
  const stripped = stripBase(rawPath);
  if (stripped === PRIMARY_WORK_ROUTE) return PRIMARY_WORK_ROUTE;
  const lowered = stripped.toLowerCase();
  return LEGACY_ROUTE_REDIRECTS[lowered] ?? stripped;
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string): void {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function getPreferredSmoothScroll(): ScrollBehavior {
  if (
    typeof document !== 'undefined' &&
    document.documentElement.getAttribute('data-a11y-reduced-motion') === 'true'
  ) {
    return 'auto';
  }
  if (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  ) {
    return 'auto';
  }
  return 'smooth';
}

function scrollToPageTop(behavior: ScrollBehavior): void {
  const scrollEl = document.scrollingElement || document.documentElement;
  if (typeof window.scrollTo === 'function') {
    window.scrollTo({ top: 0, left: 0, behavior });
  }
  if (behavior === 'instant' && window.scrollY > 0) {
    if (scrollEl) scrollEl.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }
}

function AppContent() {
  const { settings, openPanel } = useAccessibility();
  const { trackExternalLinkClick } = usePortfolioAnalytics();
  const [route, setRoute] = useState<string>(() => {
    if (typeof window === 'undefined') return '/';
    return normalizePath(window.location.pathname);
  });

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const routeRef = useRef<string>(route);
  routeRef.current = route;
  const toastTimerRef = useRef<number | null>(null);
  const scrollRafRef = useRef<number | null>(null);
  const pendingScrollActionRef = useRef<'top' | 'selected-work' | 'about' | null>(null);

  const performPendingScroll = useCallback(() => {
    const action = pendingScrollActionRef.current;
    if (!action) return;
    pendingScrollActionRef.current = null;

    if (action === 'selected-work' || action === 'about') {
      const targetId = action === 'selected-work' ? 'selected-work' : 'about-heading';
      scrollRafRef.current = window.requestAnimationFrame(() => {
        scrollRafRef.current = window.requestAnimationFrame(() => {
          scrollRafRef.current = null;
          const el = document.getElementById(targetId);
          if (el) {
            el.scrollIntoView({ behavior: getPreferredSmoothScroll(), block: 'start' });
          } else {
            scrollToPageTop('instant');
          }
        });
      });
      return;
    }
    scrollToPageTop('instant');
  }, []);

  const navigate = useCallback((target: string) => {
    if (scrollRafRef.current !== null) {
      window.cancelAnimationFrame(scrollRafRef.current);
      scrollRafRef.current = null;
    }

    const currentPath = routeRef.current;

    if (target === '/#selected-work' || target === '/#about') {
      const anchorAction = target === '/#selected-work' ? 'selected-work' : 'about';
      const targetId = target === '/#selected-work' ? 'selected-work' : 'about-heading';
      if (currentPath !== '/') {
        try {
          window.history.pushState({}, '', withBase('/'));
        } catch {
          // Ignore history restrictions in sandboxed frames
        }
        pendingScrollActionRef.current = anchorAction;
        setRoute('/');
      } else {
        const el = document.getElementById(targetId);
        el?.scrollIntoView({ behavior: getPreferredSmoothScroll(), block: 'start' });
      }
      return;
    }

    const nextPath = normalizePath(target);
    if (nextPath === currentPath) {
      scrollRafRef.current = window.requestAnimationFrame(() => {
        scrollRafRef.current = null;
        scrollToPageTop(getPreferredSmoothScroll());
      });
      return;
    }

    try {
      window.history.pushState({}, '', withBase(nextPath));
    } catch {
      // Ignore history restrictions in sandboxed frames
    }
    pendingScrollActionRef.current = 'top';
    setRoute(nextPath);
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const nextRoute = normalizePath(window.location.pathname);
      const hash = window.location.hash;
      const sameRoute = nextRoute === routeRef.current;

      if (hash === '#selected-work' || hash === '#about') {
        const targetId = hash === '#selected-work' ? 'selected-work' : 'about-heading';
        if (sameRoute) {
          document
            .getElementById(targetId)
            ?.scrollIntoView({ behavior: getPreferredSmoothScroll(), block: 'start' });
          return;
        }
        pendingScrollActionRef.current =
          hash === '#selected-work' ? 'selected-work' : 'about';
      } else {
        if (sameRoute) {
          scrollToPageTop(getPreferredSmoothScroll());
          return;
        }
        pendingScrollActionRef.current = 'top';
      }
      setRoute(nextRoute);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Canonicalize legacy URLs in the address bar (e.g., /work, /work/wellbe -> /Work)
  useEffect(() => {
    const rawPath = stripBase(window.location.pathname);
    const canonicalPath = normalizePath(rawPath);
    if (canonicalPath !== rawPath) {
      try {
        window.history.replaceState({}, '', withBase(canonicalPath));
      } catch {
        // Ignore history restrictions in sandboxed frames
      }
    }
  }, [route]);

  // Support direct landing on /#selected-work or /#about
  useEffect(() => {
    if (
      route === '/' &&
      (window.location.hash === '#selected-work' || window.location.hash === '#about')
    ) {
      const targetId =
        window.location.hash === '#selected-work' ? 'selected-work' : 'about-heading';
      const raf = window.requestAnimationFrame(() => {
        document
          .getElementById(targetId)
          ?.scrollIntoView({ behavior: getPreferredSmoothScroll(), block: 'start' });
      });
      return () => window.cancelAnimationFrame(raf);
    }
  }, [route]);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastVisible(false);
    }, 3800);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
      if (scrollRafRef.current !== null) {
        window.cancelAnimationFrame(scrollRafRef.current);
      }
    };
  }, []);

  const handleEmailClick = useCallback(async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(CONTACT_EMAIL);
        showToast(`Copied ${CONTACT_EMAIL}`);
        return;
      }
    } catch {
      // Fall through to execCommand fallback
    }

    try {
      const textarea = document.createElement('textarea');
      textarea.value = CONTACT_EMAIL;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand('copy');
      document.body.removeChild(textarea);
      showToast(copied ? `Copied ${CONTACT_EMAIL}` : CONTACT_EMAIL);
    } catch {
      showToast(CONTACT_EMAIL);
    }
  }, [showToast]);

  // Resolve route to view
  const isHome = route === '/';
  const workSlug =
    route === PRIMARY_WORK_ROUTE
      ? CASE_STUDIES[0]?.slug ?? 'wellbe'
      : route.startsWith('/work/')
      ? route.slice('/work/'.length)
      : null;
  const matchedProject = workSlug
    ? CASE_STUDIES.find((p) => p.slug === workSlug) ?? null
    : null;
  const isNotFound = !isHome && !matchedProject;

  // Sync document title, canonical URL, Open Graph / Twitter metadata, and route JSON-LD
  useEffect(() => {
    const { title, description } = isHome
      ? HOME_META
      : matchedProject
      ? matchedProject.slug === 'wellbe'
        ? WELLBE_META
        : {
            title: `${matchedProject.title} — Micah Samter`,
            description: matchedProject.summary,
          }
      : NOT_FOUND_META;

    const normalizedPath = isNotFound ? window.location.pathname : withBase(route);
    const pageUrl = `${window.location.origin}${normalizedPath}`;
    const homeUrl = `${window.location.origin}${withBase('/')}`;
    const ogImageUrl = new URL(withBase('assets/social-preview-1.jpg'), window.location.href).href;

    document.title = title;
    upsertMeta('name', 'description', description);
    upsertMeta(
      'name',
      'robots',
      isNotFound
        ? 'noindex, nofollow'
        : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    );
    upsertMeta('property', 'og:site_name', SITE_NAME);
    upsertMeta('property', 'og:type', matchedProject ? 'article' : 'website');
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', pageUrl);
    upsertMeta('property', 'og:image', ogImageUrl);
    if (ogImageUrl.startsWith('https://')) {
      upsertMeta('property', 'og:image:secure_url', ogImageUrl);
    } else {
      document.head
        .querySelector('meta[property="og:image:secure_url"]')
        ?.remove();
    }
    upsertMeta('name', 'twitter:url', pageUrl);
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', ogImageUrl);

    const existingCanonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (isNotFound) {
      existingCanonical?.remove();
    } else if (existingCanonical) {
      existingCanonical.setAttribute('href', pageUrl);
    } else {
      const canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      canonical.setAttribute('href', pageUrl);
      document.head.appendChild(canonical);
    }

    const routeLdId = 'route-structured-data';
    const existingLd = document.getElementById(routeLdId);
    if (matchedProject) {
      const caseStudySchema = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Article',
            headline: `${matchedProject.title} — UX Case Study`,
            description,
            url: pageUrl,
            image: new URL(
              withBase(
                matchedProject.heroImages?.src ?? 'assets/social-preview-1.jpg'
              ),
              window.location.href
            ).href,
            author: {
              '@type': 'Person',
              name: 'Micah Samter',
              url: homeUrl,
            },
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: homeUrl },
              { '@type': 'ListItem', position: 2, name: matchedProject.displayTitle, item: pageUrl },
            ],
          },
        ],
      };
      const script = existingLd ?? document.createElement('script');
      script.id = routeLdId;
      script.setAttribute('type', 'application/ld+json');
      script.textContent = JSON.stringify(caseStudySchema);
      if (!existingLd) document.head.appendChild(script);
    } else {
      existingLd?.remove();
    }
  }, [isHome, isNotFound, matchedProject, route]);

  const viewKey = isHome
    ? 'home'
    : matchedProject
    ? `work-${matchedProject.slug}`
    : 'not-found';

  return (
    <MotionConfig reducedMotion={settings.reduceMotion ? 'always' : 'user'}>
      <Analytics />
      <SpeedInsights route={route} />
      {!settings.nativeCursor && <CustomCursor route={route} />}
      <div className="min-h-dvh overflow-x-clip bg-alabaster text-ink flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:bg-accent-bg focus:px-4 focus:py-2.5 focus:text-[11.5px] focus:font-semibold focus:uppercase focus:tracking-[0.08em] focus:text-accent-fg focus:outline-2 focus:outline-offset-2 focus:outline-focus"
        >
          Skip to main content
        </a>
        <button
          type="button"
          onClick={(e) => openPanel(e.currentTarget)}
          className="sr-only focus:not-sr-only focus:fixed focus:top-14 focus:left-3 sm:focus:top-3 sm:focus:left-[210px] focus:z-[60] focus:bg-accent-bg focus:px-4 focus:py-2.5 focus:text-[11.5px] focus:font-semibold focus:uppercase focus:tracking-[0.08em] focus:text-accent-fg focus:outline-2 focus:outline-offset-2 focus:outline-focus"
        >
          Accessibility settings
        </button>
        {!isNotFound && (
          <Navbar
            currentRoute={route}
            onNavigate={navigate}
          />
        )}

        <AnimatePresence
          mode="wait"
          initial={false}
          onExitComplete={performPendingScroll}
        >
          <motion.div
            key={viewKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={PAGE_TRANSITION}
            className="flex-1 flex flex-col"
          >
            {isHome && (
              <main id="main-content" className="flex-1">
                <HomeView onNavigate={navigate} />
              </main>
            )}

            {matchedProject && (
              <main id="main-content" className="flex-1">
                <Suspense fallback={<div className="min-h-dvh" />}>
                  <CaseStudyView project={matchedProject} onNavigate={navigate} />
                </Suspense>
              </main>
            )}

            {isNotFound && (
              <Suspense fallback={<div id="main-content" className="min-h-dvh" />}>
                <NotFoundView onNavigate={navigate} />
              </Suspense>
            )}
          </motion.div>
        </AnimatePresence>

        {!isNotFound && (
          <Footer onEmailClick={handleEmailClick} />
        )}

        <AccessibilityControls />

        {/* Quiet Editorial Email Toast */}
        <AnimatePresence>
          {toastVisible && (
            <motion.div
              role="status"
              aria-live="polite"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={TOAST_TRANSITION}
              className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] left-1/2 z-50 w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 border border-hairline bg-accent-bg px-4 py-2.5 text-[12.5px] text-accent-fg shadow-md sm:bottom-[calc(1.25rem+env(safe-area-inset-bottom))]"
            >
              <span className="inline-flex items-center gap-2 break-all sm:whitespace-nowrap">
                <Check size={14} strokeWidth={2} className="shrink-0" aria-hidden="true" />
                <span>{toastMessage}</span>
              </span>
              <span className="hidden sm:inline-block h-3.5 w-px bg-hairline/50" aria-hidden="true" />
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                onClick={() =>
                  trackExternalLinkClick({
                    label: 'Open Mail',
                    url: `mailto:${CONTACT_EMAIL}`,
                    location: 'email_toast',
                    category: 'contact',
                    interaction: 'open',
                  })
                }
                className="inline-flex min-h-[44px] -my-2 items-center gap-1.5 whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.08em] text-accent-fg/85 hover:text-accent-fg underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-fg"
              >
                <Mail size={12} strokeWidth={1.75} aria-hidden="true" />
                <span>Open Mail</span>
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}

export default function App() {
  return (
    <AccessibilityProvider>
      <AppContent />
    </AccessibilityProvider>
  );
}
