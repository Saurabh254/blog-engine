export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function uniqueSlug(title: string, used: Set<string>): string {
  let slug = slugify(title) || 'post';
  if (!used.has(slug)) {
    used.add(slug);
    return slug;
  }

  let n = 2;
  while (used.has(`${slug}-${n}`)) n++;
  const unique = `${slug}-${n}`;
  used.add(unique);
  return unique;
}
