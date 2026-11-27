import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITE_ROUTES = [
  { path: '', changefreq: 'monthly', priority: '1.0' },
  { path: 'Work', changefreq: 'monthly', priority: '0.9' },
] as const;

export default defineConfig(({ command }) => {
  // Ensure production builds never bundle react-dom.development.js when host CI/shells set NODE_ENV=development
  if (command === 'build' && process.env.NODE_ENV !== 'production') {
    process.env.NODE_ENV = 'production';
  }

  const disableHmr = process.env.DISABLE_HMR === 'true';
  const rawBase = (process.env.VITE_BASE_PATH || '/').trim();
  const base =
    rawBase === ''
      ? '/'
      : `${rawBase.startsWith('/') ? '' : '/'}${rawBase.replace(/\/+$/, '')}/`.replace(/^\/\/+/, '/');

  const normalizeSiteUrl = (value?: string): string => {
    const trimmed = (value || '').trim();
    if (!trimmed) return '';
    // Recover clean URL if an env var was accidentally pasted as a markdown link [url](url)
    const mdMatch = trimmed.match(/\((https?:\/\/[^)\s]+)\)/i);
    const candidate = mdMatch ? mdMatch[1] : trimmed;
    if (!/^https?:\/\/[^\s[\]()]+$/i.test(candidate)) return '';
    return candidate.replace(/\/+$/, '');
  };

  const rawSiteUrl =
    normalizeSiteUrl(process.env.VITE_SITE_URL) ||
    normalizeSiteUrl(process.env.APP_URL) ||
    normalizeSiteUrl(
      process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : ''
    ) ||
    normalizeSiteUrl(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    'https://micahsamter.com';
  const siteBaseUrl = rawSiteUrl ? `${rawSiteUrl}${base}` : base;

  return {
    base,
    define:
      command === 'build'
        ? {
            'process.env.NODE_ENV': JSON.stringify('production'),
          }
        : undefined,
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'seo-meta-and-sitemap',
        transformIndexHtml: {
          order: 'post',
          handler(html) {
            return html.replace(/%SITE_URL%/g, siteBaseUrl);
          },
        },
        closeBundle(error?: Error): void {
          if (error) return;
          const distDir = path.resolve(__dirname, 'dist');
          if (!fs.existsSync(distDir)) return;

          const hasAbsoluteOrigin = /^https?:\/\//i.test(siteBaseUrl);
          const robotsLines = ['User-agent: *', 'Allow: /'];
          if (hasAbsoluteOrigin) {
            robotsLines.push('', `Sitemap: ${siteBaseUrl}sitemap.xml`);
          }
          fs.writeFileSync(
            path.join(distDir, 'robots.txt'),
            `${robotsLines.join('\n')}\n`,
            'utf8'
          );

          if (hasAbsoluteOrigin) {
            const lastmod = new Date().toISOString().split('T')[0];
            const urlEntries = SITE_ROUTES.map(
              (entry) => `  <url>
    <loc>${siteBaseUrl}${entry.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`
            ).join('\n');

            const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>
`;
            fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemapXml, 'utf8');
          }
        },
      },
      // Copies src/assets into dist/ so root-relative URLs like
      // "/src/assets/images/..." (e.g. generate_image output) still resolve
      // in production builds, while excluding temporary aistudio/ chat attachment folders.
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) return;
          const distDir = path.resolve(__dirname, 'dist');
          const srcAssets = path.resolve(__dirname, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, {
              recursive: true,
              force: true,
              filter: (srcPath) =>
                !srcPath.split(path.sep).includes('aistudio'),
            });
          }
          // Strip any aistudio/ chat attachment directories copied from public/ into dist/
          for (const relDir of ['assets/aistudio', 'aistudio', 'src/assets/aistudio']) {
            const targetDir = path.join(distDir, relDir);
            if (fs.existsSync(targetDir)) {
              fs.rmSync(targetDir, { recursive: true, force: true });
            }
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    build: {
      target: 'es2022',
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              {
                name: 'vendor-react',
                test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
                priority: 20,
              },
              {
                name: 'vendor-motion',
                test: /node_modules[\\/](motion|framer-motion|motion-dom|motion-utils)[\\/]/,
                priority: 15,
              },
            ],
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: !disableHmr,
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: disableHmr ? null : undefined,
    },
  };
});