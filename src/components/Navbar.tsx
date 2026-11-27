import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Menu, X } from 'lucide-react';
import { isModifiedEvent, withBase } from '../utils/paths';
import { usePortfolioAnalytics } from '../hooks/usePortfolioAnalytics';

interface NavbarProps {
  currentRoute: string;
  onNavigate: (path: string) => void;
}

const WORK_ROUTE = '/Work';

const NAV_ITEMS = [
  { label: 'ABOUT', path: '/' },
  { label: 'WORK', path: WORK_ROUTE },
] as const;

const MENU_TRANSITION = {
  duration: 0.2,
  ease: [0.22, 1, 0.36, 1] as const,
} as const;

export const Navbar: React.FC<NavbarProps> = React.memo(({
  currentRoute,
  onNavigate,
}) => {
  const { trackWorkNavClick } = usePortfolioAnalytics();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 12);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [currentRoute]);

  // Close mobile menu when crossing into desktop breakpoint, pressing Escape, or clicking outside
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (
        headerRef.current &&
        event.target instanceof Node &&
        !headerRef.current.contains(event.target)
      ) {
        setMobileMenuOpen(false);
      }
    };

    const mediaQuery = window.matchMedia('(min-width: 640px)');
    const handleMediaChange = (event: MediaQueryListEvent) => {
      if (event.matches) setMobileMenuOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);
    mediaQuery.addEventListener('change', handleMediaChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, [mobileMenuOpen]);

  const handleLinkClick = useCallback(
    (
      event: React.MouseEvent<HTMLAnchorElement>,
      targetPath: string,
      navSurface?: 'navbar_desktop' | 'navbar_mobile'
    ) => {
      if (targetPath === WORK_ROUTE && navSurface) {
        trackWorkNavClick(navSurface, targetPath);
      }
      if (isModifiedEvent(event)) return;
      event.preventDefault();
      event.currentTarget.blur();
      setMobileMenuOpen(false);
      onNavigate(targetPath);
    },
    [onNavigate, trackWorkNavClick]
  );

  const isRouteActive = (path: string) => {
    if (path === '/') return currentRoute === '/';
    return currentRoute === WORK_ROUTE || currentRoute.startsWith('/work/');
  };

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-40 w-full transition-colors duration-200 ${
        mobileMenuOpen
          ? 'bg-alabaster border-b border-hairline'
          : scrolled
          ? 'bg-alabaster/88 backdrop-blur-md border-b border-hairline/75'
          : 'bg-alabaster border-b border-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-3 px-5 py-4 sm:gap-4 sm:px-10 sm:py-5">
        {/* Left: Only MS links to Home; "/" and "RESEARCHER" are plain non-interactive text */}
        <div className="inline-flex min-w-0 items-center gap-1.5 whitespace-nowrap shrink-0 text-[11.5px] tracking-[0.06em] uppercase text-ink">
          <a
            href={withBase('/')}
            onClick={(e) => handleLinkClick(e, '/')}
            className="inline-flex min-h-[44px] min-w-[44px] -my-3 -ml-2 items-center pl-2 pr-1 font-bold text-ink transition-opacity duration-150 hover:opacity-65 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            aria-label="Micah Samter Home"
          >
            MS
          </a>
          <span
            className="text-subtle font-normal select-none pointer-events-none"
            aria-hidden="true"
          >
            /
          </span>
          <span className="font-semibold text-ink select-none pointer-events-none">
            RESEARCHER
          </span>
        </div>

        {/* Desktop Navigation: ABOUT and WORK */}
        <nav
          aria-label="Primary"
          className="hidden sm:flex items-center gap-6 shrink-0"
        >
          {NAV_ITEMS.map((item) => {
            const active = isRouteActive(item.path);
            return (
              <a
                key={item.path}
                href={withBase(item.path)}
                aria-current={active ? 'page' : undefined}
                onClick={(e) => handleLinkClick(e, item.path, 'navbar_desktop')}
                onAuxClick={(e) => {
                  if (e.button === 1 && item.path === WORK_ROUTE) {
                    trackWorkNavClick('navbar_desktop', item.path);
                  }
                }}
                className={`inline-flex min-h-[44px] -my-3 items-center px-1 whitespace-nowrap shrink-0 text-[11.5px] font-semibold tracking-[0.08em] uppercase transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
                  active
                    ? 'text-ink editorial-underline'
                    : 'text-muted hover:text-ink'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Mobile Hamburger Toggle */}
        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-nav-menu"
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          className="inline-flex sm:hidden min-h-[44px] min-w-[44px] -my-3 -mr-2 items-center justify-center text-ink transition-opacity duration-150 hover:opacity-65 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          {mobileMenuOpen ? (
            <X size={20} strokeWidth={1.75} aria-hidden="true" />
          ) : (
            <Menu size={20} strokeWidth={1.75} aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Mobile Overlay Menu — out of flow so closing never shifts layout or interrupts scroll-to-top */}
      <AnimatePresence initial={false}>
        {mobileMenuOpen && (
          <motion.nav
            id="mobile-nav-menu"
            aria-label="Mobile navigation"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={MENU_TRANSITION}
            className="sm:hidden absolute inset-x-0 top-full border-b border-hairline bg-alabaster shadow-[0_12px_28px_-12px_rgba(14,14,14,0.14)]"
          >
            <div className="mx-auto flex max-w-[1100px] flex-col px-5 py-3 sm:px-6">
              {NAV_ITEMS.map((item) => {
                const active = isRouteActive(item.path);
                return (
                  <a
                    key={item.path}
                    href={withBase(item.path)}
                    aria-current={active ? 'page' : undefined}
                    onClick={(e) => handleLinkClick(e, item.path, 'navbar_mobile')}
                    onAuxClick={(e) => {
                      if (e.button === 1 && item.path === WORK_ROUTE) {
                        trackWorkNavClick('navbar_mobile', item.path);
                      }
                    }}
                    className={`flex min-h-[48px] items-center justify-end text-right border-b border-hairline/60 last:border-b-0 text-[12px] font-semibold tracking-[0.08em] uppercase transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
                      active
                        ? 'text-ink'
                        : 'text-muted hover:text-ink'
                    }`}
                  >
                    <span className={active ? 'editorial-underline' : undefined}>
                      {item.label}
                    </span>
                  </a>
                );
              })}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
});

Navbar.displayName = 'Navbar';
