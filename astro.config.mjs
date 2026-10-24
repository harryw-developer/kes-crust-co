import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readFileSync } from 'node:fs';

const site = JSON.parse(readFileSync(new URL('./src/data/site.json', import.meta.url), 'utf8'));
// site.url is the full public address, e.g. https://harryw-developer.github.io/kes-crust-co
// On a custom domain later, set it to https://www.yourdomain.co.uk and the base becomes "/".
const { origin, pathname } = new URL(site.url);

export default defineConfig({
  site: origin,
  base: pathname,
  build: { format: 'file', inlineStylesheets: 'always' },
  integrations: [sitemap({ filter: (page) => !page.includes('/admin') })],
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
});
