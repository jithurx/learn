/**
 * Shared helpers for the "sub-wiki per post" model.
 *
 * Content layout:
 *   src/content/docs/posts/<post-slug>/index.md   -> post landing (has `number`)
 *   src/content/docs/posts/<post-slug>/*.md       -> sub-wiki pages (no `number`)
 *   src/content/docs/posts/<post-slug>/**\/*.md    -> nested sub-wiki pages
 *
 * A "post" = a folder under `posts/` with its own mini-wiki.
 */

export function getPostSlugFromId(id: string | undefined): string | null {
  if (!id) return null;
  const segments = id.split('/').filter(Boolean);
  // ids look like "posts/<slug>/index.md" or "posts/<slug>/page.md"
  if (segments[0] !== 'posts') return null;
  return segments[1] ?? null;
}

export function getPostSlugFromHref(href: string | undefined): string | null {
  if (!href) return null;
  const pathname = href.split(/[?#]/)[0];
  const segments = pathname.split('/').filter(Boolean);
  if (segments[0] !== 'posts') return null;
  return segments[1] ?? null;
}

export function isPostIndexId(id: string | undefined): boolean {
  if (!id) return false;
  // "posts/<slug>/index.md" or legacy "posts/<slug>.md"
  return /^posts\/[^/]+\/index\.mdx?$/.test(id) || /^posts\/[^/]+\.mdx?$/.test(id);
}

export function postSlugToLabel(slug: string): string {
  return slug
    .split('-')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}
