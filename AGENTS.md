# Project instructions

## Development

Start the dev server in background mode:

```bash
astro dev --background
```

Manage it with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Content model

- Project pages live in `src/content/projects/*.mdx` and are rendered by
  `src/pages/projects/[...slug].astro`.
- The archive at `src/pages/index.astro` lists every project, ordered by the
  `number` frontmatter field.
- `src/pages/[number].astro` redirects legacy `/<number>/` URLs to the matching
  project; old slugs redirect via `redirects` in `astro.config.ts`.
- Search is client-side: `src/pages/search-index.json.ts` emits a section-level
  index, and `src/components/Search.astro` renders the inline bar and dialog.
- Shared visual components (Header, Figure, HighlightedSection, Table, Wide,
  etc.) live in `src/components/`.
- Cover images and downloadable files are served from `public/images/` and
  `public/files/` respectively.

## Checks

Run `npm run build` before finishing a change; it type-checks the project and
verifies that every MDX page compiles.
