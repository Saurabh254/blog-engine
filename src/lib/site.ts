export const SITE = {
  name: 'blog',
  author: 'Saurabh Vishwakarma',
  authorUrl: 'https://saurabhvishwakarma.in',
  description: 'Essays on work, connection, and building things.',
  locale: 'en_IN',
  twitter: '@sau_rabh254',
} as const;

export function pageTitle(title: string): string {
  return title === SITE.name ? `${SITE.name} · ${SITE.author}` : `${title} · ${SITE.name}`;
}

export function absoluteUrl(path: string, site: URL | string): string {
  return new URL(path, site).href;
}
