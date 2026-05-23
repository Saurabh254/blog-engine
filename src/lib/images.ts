const IMAGE_EXT = /\.(avif|gif|jpe?g|png|svg|webp)$/i;

function resolvePublicSrc(src: string): string {
  const trimmed = src.trim().replace(/^["']|["']$/g, '');
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')) return trimmed;
  const path = trimmed.replace(/^\.\//, '');
  return `/${path}`;
}

function isImagePath(src: string): boolean {
  return IMAGE_EXT.test(src.split('?')[0] ?? src);
}

/**
 * Resolves markdown image/link paths to URLs served from /public.
 *
 * - ![](images/photo.jpg) → ![](/images/photo.jpg)
 * - [](images/photo.jpg)  → ![](/images/photo.jpg)  (your preferred syntax)
 */
export function resolvePublicImagePaths(markdown: string): string {
  return markdown.replace(/(!?)\[([^\]]*)\]\(([^)]+)\)/g, (_match, bang, alt, url) => {
    const resolved = resolvePublicSrc(url);
    const image = bang === '!' || isImagePath(url);

    if (image) {
      return `![${alt}](${resolved})`;
    }

    // Regular links: still prefix relative paths from public
    if (!/^https?:\/\//i.test(url.trim()) && !url.trim().startsWith('/')) {
      return `[${alt}](${resolved})`;
    }

    return `[${alt}](${url})`;
  });
}
