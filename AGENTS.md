# AGENTS.md — Project Guardrails

This file defines the architecture, design tokens, accessibility requirements, iframe rules, and external-link conventions for **ms-portfolio-website-2026** (Micah Samter's UX Research & Design portfolio). Follow these guardrails on every change.

---

## 1. Tech Stack & Architecture

- **Core:** React 19 (`react` / `react-dom` ^19), TypeScript (`target: ES2022`, `jsx: react-jsx`), Vite 8 (Rolldown bundler).
- **Styling:** Tailwind CSS v4 via `@tailwindcss/vite` and `@import "tailwindcss";` + `@theme` in `src/index.css`. There is no `tailwind.config.*` file—define all design tokens in `src/index.css`.
- **Animation:** `motion` v12 (`import { ... } from 'motion/react'`). Do **not** import from `framer-motion`.
- **Icons:** `lucide-react` (custom inline SVGs are used only for bespoke marks like `AccessibilityMark` and `ProtonMailIcon`).
- **Hosting & Telemetry:** Vercel (`vercel.json`), `@vercel/analytics`, `@vercel/speed-insights`.
- **Package Manager & Scripts:** `bun.lock` is committed; standard scripts run via `npm` or `bun`:
  - `npm run dev` — Vite dev server on port `3000`.
  - `npm run lint` — TypeScript typecheck (`tsc --noEmit`).
  - `npm run build` — Production build (`vite build`), which also injects `%SITE_URL%` into `index.html` and regenerates `dist/robots.txt` and `dist/sitemap.xml` from `SITE_ROUTES` in `vite.config.ts`.
  - `npm run preview` — Preview production build.
- **Path Alias:** `@/*` maps to `./src/*` (`tsconfig.json`, `vite.config.ts`).

### Routing & Base Path Rules
- Routing is a custom History API SPA router in `src/App.tsx` (do not introduce React Router unless explicitly requested).
- **Canonical routes:** `/` (Home) and `/Work` (case-sensitive primary case study route). Legacy paths (`/work`, `/work/wellbe`, `/work/holistic-mental-health`) permanently redirect in `vercel.json` and canonicalize client-side to `/Work`. Additional case studies resolve at `/work/:slug`.
- **Always use `withBase()` / `stripBase()`** from `src/utils/paths.ts` for internal hrefs and static asset paths so builds work both at `/` and under `VITE_BASE_PATH`.
- **Always check `isModifiedEvent(e)`** from `src/utils/paths.ts` before calling `e.preventDefault()` on SPA `<a>` click handlers so Cmd/Ctrl/Shift/Alt/middle-click opens natively in a new tab/window.
- Wrap `window.history.pushState` / `replaceState` in `try/catch` to avoid throwing inside sandboxed frames.
- **Do not alter** the `DISABLE_HMR` server logic (`server.hmr` and `server.watch`) in `vite.config.ts`.
- **Do not commit** temporary `aistudio/` attachment assets (stripped automatically during `vite build`).
- If adding routes or case studies, keep `SITE_ROUTES` (`vite.config.ts`), `vercel.json` redirects/rewrites, dynamic `<head>` metadata + JSON-LD (`src/App.tsx`), and `index.html` in sync.

### Key Files
- `src/index.css` — `@font-face`, `@theme` tokens, accessibility theme overrides, and editorial utility classes.
- `src/App.tsx` — SPA router, `<MotionConfig>`, skip links, SEO/JSON-LD sync, email copy toast.
- `src/context/AccessibilityContext.tsx` & `src/components/AccessibilityControls.tsx` — Persistent a11y preferences (`localStorage` key `ms-accessibility-v1`) and settings dialog.
- `src/components/LivePrototypeDemos.tsx` — Sandboxed mobile & Wear OS live prototype embeds with static WebP fallbacks.
- `src/components/PhoneScrollTrack.tsx` — Sticky vertical-to-horizontal carousel with reduced-motion / short-viewport snap fallback.
- `src/data/projects.ts` — Case study structured content, slides, Q&A, and `CONTACT_EMAIL`.
- `src/hooks/usePortfolioAnalytics.ts` — Safe Vercel Analytics event wrapper.

---

## 2. Typography Tokens & Rules

### Font Families (`@theme` in `src/index.css`)
| Token | Font Stack | Source & Usage |
|---|---|---|
| `--font-sans` | `"Heebo", -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif` | Google Fonts (`400;500;600;700;900`). Default body, UI, metadata, and case-study headings. |
| `--font-display` | `"Grith", "Grith Fallback", "Heebo", sans-serif` | Self-hosted `/fonts/Grith.woff2` + `.woff` (`font-weight: 400`, preloaded in `index.html`). |

### Typography Guardrails
- **No faux bold/italic on Grith:** `.display-headline` sets `font-weight: 400; font-synthesis: none; text-transform: uppercase; letter-spacing: 0.03em; line-height: 0.9;`. Never apply bold weights to Grith.
- **Preserve CLS-preventing fallback metrics:** Keep the `"Grith Fallback"` `@font-face` (`size-adjust: 53%`, `ascent-override: 151%`, `descent-override: 38%`, `line-gap-override: 0%`) and pass `reservedAspectRatio` to `<FitDisplayHeadline />` when adding full-width display titles.
- **Respect "Plain Headings" mode:** `html[data-a11y-readable-font="true"] .display-headline` switches display headlines to `Heebo` (`font-weight: 700`, `letter-spacing: -0.02em`, `line-height: 1.05`), and `FitDisplayHeadline` resets `heightScale` to `1`. Do not bypass `.display-headline` or hardcode `font-family: Grith` inline.
- **Reuse editorial classes from `src/index.css`:**
  - `.editorial-lead` — `clamp(1.42rem, 2.75vw, 2.32rem)`, Heebo 400, `line-height: 1.32`, `letter-spacing: -0.015em`.
  - `.micro-label` — `0.72rem`, weight `600`, uppercase, `letter-spacing: 0.08em`, `line-height: 1.2`.
  - `.editorial-underline` — `1px` underline with `3px` offset (`5px` + `opacity: 0.65` on fine-pointer hover).
- **Use `rem` for readable text:** Avoid fixed `px` sizes on prose, headings, and labels so root text scaling (`112.5%` / `125%`) scales typography reliably without clipping or horizontal overflow.
- **Use `tabular-nums`** for counters (`01 / 06`), metrics, section numbers, and years.

---

## 3. Color Tokens & Multi-Theme Rules

All UI surfaces, borders, text, buttons, and focus rings **must** use the semantic tokens defined in `src/index.css` so Default, Dark, and High Contrast modes switch cleanly via `html[data-a11y-theme]`.

| CSS Variable | Tailwind Utilities | Default (Alabaster) | Dark (`dark`) | High Contrast (`high-contrast`) | Intended Role |
|---|---|---|---|---|---|
| `--color-alabaster` | `bg-alabaster` | `#F4F1EC` | `#121211` | `#FFFFFF` | Page canvas, navbar, footer |
| `--color-surface` | `bg-surface` | `#FFFFFF` | `#1A1A18` | `#FFFFFF` | Cards, dialogs, controls |
| `--color-stage` | `bg-stage` | `#ECEAE4` | `#22221F` | `#F4F4F4` | Showcase stages, segmented tracks, subtle fills |
| `--color-hairline` | `border-hairline`, `bg-hairline` | `#DDD8CE` | `#34332E` | `#000000` | 1px dividers and borders |
| `--color-ink` | `text-ink`, `bg-ink` | `#0E0E0E` | `#F2EFE9` | `#000000` | Primary headings, active links, strong ink |
| `--color-ink-body` | `text-ink-body` | `#1C1B19` | `#DCD8CE` | `#000000` | Long-form body prose |
| `--color-muted` | `text-muted` | `#68655E` | `#A9A49A` | `#1A1A1A` | Secondary metadata, captions, inactive nav |
| `--color-subtle` | `text-subtle` | `#9E9A90` | `#8C877D` | `#262626` | Decorative slashes (`/`) and non-essential dividers **only** |
| `--color-accent-bg` | `bg-accent-bg` | `#0E0E0E` | `#F2EFE9` | `#000000` | Primary CTAs, active toggles, toasts, text selection |
| `--color-accent-bg-hover` | `hover:bg-accent-bg-hover` | `#2A2926` | `#DDD8CE` | `#222222` | Primary CTA hover state |
| `--color-accent-fg` | `text-accent-fg` | `#F4F1EC` | `#121211` | `#FFFFFF` | Text/icons on `accent-bg` |
| `--color-focus` | `outline-focus` | `#0E0E0E` | `#F2EFE9` | `#005FCC` | Keyboard `:focus-visible` outlines |

### Color Guardrails
- **Do not hardcode theme hex values** (such as `#F4F1EC`, `#0E0E0E`, `#FFFFFF`, or gray scales) on standard UI surfaces, text, or borders.
- **Permitted fixed-color exceptions:** Physical hardware bezels/device screens (`#0E0E0E`, `#131A17`, `#121514`, `#0B0C0C`, `#1B1C20`) and high-contrast loading pills overlaid directly on dark device screenshots (`bg-[#0E0E0E]/88 text-[#F4F1EC]`).
- **Keep theme metadata synchronized:** If theme colors or `data-a11y-*` attributes change, update `src/index.css`, `THEME_COLORS` in `src/context/AccessibilityContext.tsx`, and the inline pre-paint FOUC script in `index.html` together.

---

## 4. Contrast & Accessibility Expectations

### Contrast Floors
- **Default & Dark themes:** Maintain at least **WCAG AA** (`>= 4.5:1` for normal text, `>= 3:1` for large text and UI components).
- **High Contrast theme (`data-a11y-theme="high-contrast"`):** Maintain **WCAG AAA** (`>= 7:1` text contrast, `#000000` borders, `#005FCC` focus indicator).
- **Never use `text-subtle` for readable copy or labels:** In the default theme, `#9E9A90` on `#F4F1EC` is `2.49:1` (fails AA). Reserve `text-subtle` strictly for `aria-hidden="true"` decorative glyphs like `/`.
- **Muted ink on neutral surfaces:** In the default theme, `--color-muted` (`#68655E`) achieves `5.16:1` on `alabaster`, `5.81:1` on `surface`, and `4.83:1` on `stage` (passing WCAG AA across all three); still prefer `text-ink` for primary interactive text.

### Required Accessibility Support
All new components and views must respect every user control in `AccessibilityContext`:
1. **Theme (`data-a11y-theme`):** `default`, `dark`, `high-contrast`.
2. **Text Scale (`data-a11y-text`):** `100%`, `112%` (`112.5%`), `125%`. Layouts must reflow cleanly with zero horizontal overflow (`overflow-x: clip` on `body`).
3. **Relaxed Spacing (`data-a11y-spacing="true"`):** WCAG 1.4.12 (`line-height: 1.85`, `letter-spacing: 0.035em`, `word-spacing: 0.1em` inside `main`). Avoid fixed container heights that clip wrapped text when spacing increases.
4. **Plain Headings (`data-a11y-readable-font="true"`):** Replaces condensed display type with `Heebo`.
5. **Reduce Motion (`data-a11y-reduced-motion="true"` & `prefers-reduced-motion: reduce`):**
   - `<MotionConfig reducedMotion={settings.reduceMotion ? 'always' : 'user'}>` wraps the app.
   - Any custom JS/CSS animation, typing effect, scroll-linked motion, or smooth scroll **must** honor both `settings.reduceMotion` and OS `prefers-reduced-motion: reduce`.
   - Scroll-driven galleries (`PhoneScrollTrack`) must fall back to a keyboard-focusable horizontal snap carousel with Prev/Next buttons when reduced motion is active or on short viewports (`max-height: 520px`).
   - Animated text (`BackspaceText`) must expose static final copy via `sr-only` and hide animated spans with `aria-hidden="true"`.
6. **Highlight Links & Focus (`data-a11y-links="true"`):** Underlines all `a[href]` and enforces `3px solid var(--color-focus)` focus rings. Never suppress focus outlines (`outline-none` without a stronger `focus-visible:` replacement).
7. **Standard System Cursor (`settings.nativeCursor`):** Unmounts `<CustomCursor />`. `<CustomCursor />` must also stay disabled on touch/coarse pointers (`(hover: hover) and (pointer: fine)`).

### Keyboard, Semantics, Touch Targets & Responsive Rules
- **Landmarks & Skip Links:** Preserve the `Skip to main content` (`#main-content`) and `Accessibility settings` skip controls in `src/App.tsx`, global `Alt + A` shortcut (ignoring form inputs), one `<h1>` per view, ordered headings, and labeled `<nav aria-label="...">` landmarks.
- **Focus Visible:** Every interactive control must define `focus-visible:outline-2 focus-visible:outline-offset-2` (or `4`/`6`) with `focus-visible:outline-focus` (or `focus-visible:outline-accent-fg` on inverted `bg-accent-bg` surfaces).
- **Dialogs & Live Regions:** Modals must implement `role="dialog"`, `aria-modal="true"`, `aria-labelledby`/`aria-describedby`, `Tab`/`Shift+Tab` focus trapping, `Escape` dismissal, and focus restoration to the trigger element. Status notifications (toasts, settings updates, iframe loading) must use `role="status"` and `aria-live="polite"`.
- **Decorative Icons:** Mark decorative icons and dividers with `aria-hidden="true"`; icon-only buttons require `aria-label`.
- **Touch Targets & Safe Areas:** Keep primary interactive hit areas at least `44px × 44px` (`min-h-[44px] min-w-[44px]`) and account for `env(safe-area-inset-bottom)` / `env(safe-area-inset-right)` on fixed UI so nothing overlaps OS chrome or the bottom-right Accessibility button.
- **Images:** Provide descriptive `alt`, explicit `width`/`height` (or `aspect-ratio`), and `decoding="async"`. Reserve `loading="eager" fetchPriority="high"` strictly for above-the-fold LCP hero media; lazy-load everything else.
- **Responsive Tables:** Provide a stacked `<640px` (`sm:hidden`) layout alongside semantic `<table>` markup at `sm+` (`hidden sm:table`) so mobile viewports never horizontally scroll.

---

## 5. Iframe & Live Prototype Rules

When embedding interactive external prototypes (see `src/components/LivePrototypeDemos.tsx`):

- **Sandbox & Permissions:** Always set:
  - `sandbox="allow-scripts allow-same-origin allow-forms allow-popups"`
  - `allow="clipboard-write; fullscreen"`
  - Never add permissive flags like `allow-top-navigation` unless explicitly approved.
- **Accessible Title:** Every `<iframe>` must include a clear, unique `title` attribute.
- **Lazy Mounting:** Never mount cross-origin iframes eagerly on page load. Activate them via `IntersectionObserver` (`rootMargin: '400px 0px'`).
- **Offline, Error & Timeout Fallbacks:**
  - Check `navigator.onLine === false`, handle `onError`, and enforce a load timeout (`9000ms`) that degrades cleanly to a static WebP `fallbackImage` and explanatory `fallbackCaption`.
  - Automatically retry when the browser fires the `online` event.
  - Set `aria-hidden={isIframeVisible || undefined}` on the fallback `<img>` once the live iframe is visible so assistive tech does not duplicate announcements.
  - Respect `motion-reduce:transition-none` on iframe opacity transitions.
- **User Escape Hatches:** Every embedded prototype must ship with a utility bar containing:
  1. A **Reset Demo** `<button>` (remounting via key increment) with a descriptive `aria-label`.
  2. An **Open Fullscreen** external link (`target="_blank" rel="noopener noreferrer"`).
- **Cursor & Scroll Isolation:**
  - Wrap iframe hardware frames with `data-native-cursor="true"` so `CustomCursor` immediately yields to the OS pointer over cross-origin embeds.
  - Apply `isolate`, `overscroll-contain`, `contain-layout` (chassis), and `contain-strict` (clipped screen viewport) to prevent scroll chaining and repaint leaks.
- **Viewport Scaling & Pre-hints:**
  - Measure containers via rAF-coalesced `ResizeObserver` and scale via CSS `transform` (`transformOrigin: '0 0'`) to preserve canonical upstream prototype dimensions (`MOBILE_VIEWPORT_W = 390`; Watch `1600×740` centered at `(800, 396.25)` with `410px` circular crop `[clip-path:circle(50%_at_50%_50%)]`). Do not change these geometry constants unless the upstream prototype layouts change.
  - Add `<link rel="dns-prefetch" href="...">` in `index.html` for trusted live prototype origins.

---

## 6. External Links, Contact & Analytics Rules

- **New-Tab Security:** Every external `http(s)` link opening in a new tab **must** include `target="_blank"` and `rel="noopener noreferrer"`.
- **Visual Direction & Underline:** External action CTAs should pair with `ArrowUpRight` (`aria-hidden="true"`) and preserve link discoverability (`.editorial-underline` or high-contrast `bg-accent-bg` button styling).
- **Email / Contact Links (`CONTACT_EMAIL` in `src/data/projects.ts`):**
  - Always render as a semantic `<a href="mailto:...">` so modifier clicks (`isModifiedEvent(e)`) and context menus work natively.
  - On unmodified primary click, copy the address via `navigator.clipboard.writeText` (with `textarea` + `execCommand('copy')` fallback) and trigger the `role="status"` toast with an accessible `Open Mail` `mailto:` fallback link.
- **Analytics Tracking (`usePortfolioAnalytics` in `src/hooks/usePortfolioAnalytics.ts`):**
  - Track every external link click via `trackExternalLinkClick({ label, url, location, category, interaction })` on **both** `onClick` and middle-click `onAuxClick` (`if (e.button === 1)`).
  - Track internal case-study/work navigation links via `trackWorkProjectClick` or `trackWorkNavClick` on both `onClick` and middle-click `onAuxClick`.
  - Keep analytics calls wrapped in `try/catch` (`safeTrack`) with flat primitive payloads (`string | number | boolean | null`) so blocked analytics never disrupt navigation.

---

## 7. Workflow, Task Scoping & Verification

### Narrow Task Scoping
- **One concern per pass:** Keep each edit pass tightly scoped to a single concrete feature, audit, or bug fix (for example, responsive layout checks, mobile menu behavior, or performance cleanup).
- **No drive-by refactors:** Do not modify unrelated files, copy, or design tokens outside the requested scope. If a prompt bundles multiple independent tasks, propose splitting them into sequential passes.

### Per-Pass Verification Checklist
After every pass, before finalizing:
1. Review `git status` and `git diff` to confirm all changes are minimal, intentional, and strictly within scope.
2. Run `npm run lint` (`tsc --noEmit`) and `npm run build` (`vite build`), and review the build output (including chunk sizes and generated SEO artifacts) for warnings or errors.
3. Verify any UI change works across all three themes (`Default`, `Dark`, `High Contrast`), `125%` text scale, `Relaxed Spacing`, `Plain Headings`, and `Reduce Motion`.
4. Confirm zero horizontal overflow on mobile (`<640px`) and desktop viewports, and confirm keyboard focus order and `:focus-visible` outlines remain intact.
