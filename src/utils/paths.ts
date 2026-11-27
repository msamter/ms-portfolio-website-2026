const RAW_BASE = import.meta.env.BASE_URL || '/';

export const BASE_URL = RAW_BASE.endsWith('/') ? RAW_BASE : `${RAW_BASE}/`;
const BASE_PREFIX = BASE_URL === '/' ? '' : BASE_URL.slice(0, -1);

/**
 * Prepends Vite's configured `base` path to an app-internal asset or route path.
 * Works identically at root (`/`) and under a repository subpath (`/my-repo-name/`).
 */
export function withBase(path: string): string {
  if (!path) return BASE_URL;
  if (/^(https?:|mailto:|tel:|data:|#)/i.test(path)) return path;
  const cleaned = path.replace(/^\/+/, '');
  return cleaned ? `${BASE_URL}${cleaned}` : BASE_URL;
}

/**
 * Strips Vite's configured `base` prefix from `window.location.pathname`
 * and returns a normalized app-internal route starting with `/`.
 */
export function stripBase(rawPathname: string): string {
  const pathnameOnly = rawPathname.split(/[?#]/)[0] || '';
  if (!pathnameOnly || pathnameOnly === '/index.html') return '/';

  let path = pathnameOnly;
  if (BASE_PREFIX && (path === BASE_PREFIX || path.startsWith(`${BASE_PREFIX}/`))) {
    path = path.slice(BASE_PREFIX.length) || '/';
  }

  if (path === '/index.html') return '/';
  const cleaned = path.replace(/\/+$/, '');
  return cleaned === '' ? '/' : cleaned;
}

/**
 * Returns true when a click uses a modifier key or non-primary mouse button
 * so SPA links let the browser open a new tab/window natively.
 */
export function isModifiedEvent(
  event: Pick<MouseEvent, 'metaKey' | 'ctrlKey' | 'shiftKey' | 'altKey' | 'button'>
): boolean {
  return (
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    event.button !== 0
  );
}
