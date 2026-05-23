// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Set SITE_URL in CI (e.g. https://blog.saurabhvishwakarma.in)
const site = process.env.SITE_URL ?? 'https://blog.saurabhvishwakarma.in';

export default defineConfig({
  site,
  integrations: [
    sitemap({
      filter: page => !page.includes('/draft'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
