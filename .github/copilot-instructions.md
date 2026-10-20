# AI agent guide for this repo

This is an Astro 6 + MDX site with Tailwind CSS v4, KaTeX math, Mermaid diagrams,
and a small PDF→image pipeline. It renders an **archive of academic-style project
pages** rather than a single paper page.

## Architecture and key files

- Content
  - `src/content.config.ts` defines the `projects` collection (glob loader over
    `src/content/projects/**/*.mdx`) and its frontmatter schema.
  - `src/content/projects/*.mdx` contains one project per file. The filename is
    the URL slug.
  - Frontmatter keys: `title`, `subtitle`, `description`, `date`, `tags`,
    `number`, `cover`, `coverAlt`, `links`.
- Pages
  - `src/pages/index.astro` is the archive: it sorts projects by `number` and
    renders `ProjectCard`s.
  - `src/pages/projects/[...slug].astro` renders a single project with `Header`,
    date/tags, and the MDX body via the content collection `render()` API.
  - `src/pages/[number].astro` redirects `/<number>/` to the project with that
    number; legacy slugs redirect via `redirects` in `astro.config.ts`.
- Search
  - `src/pages/search-index.json.ts` builds a section-level index from project
    bodies (using `github-slugger` so anchors match Astro's heading IDs).
  - `src/components/Search.astro` provides the home inline search and the
    floating dialog on project pages (`/` or `Ctrl/Cmd+K`).
- Layout and styling
  - `src/layouts/BaseLayout.astro` owns the document shell, fonts, SEO tags, and
    the prose classes.
  - `src/styles/global.css` defines the Tailwind theme, typography, the
    `data-theme` dark variant, and the 50rem reading column.
- Components
  - `Header.astro` (title, subtitle, author, link buttons, optional cover slot),
    `ProjectCard.astro`, `SiteFooter.astro`.
  - Visual helpers: `Figure`, `Picture`, `Video`, `YouTubeVideo`, `Wide`,
    `Table`, `HighlightedSection`, `SmallCaps`, `Carousel`, `Comparison`.
- Config
  - `astro.config.ts` wires MDX, Mermaid, expressive-code, KaTeX, citations, and
    React support.
  - Alias `@/*` → `./src/*` (see `tsconfig.json`).

## Conventions

- Each project page starts with an `## Abstract` inside
  `<HighlightedSection>` and imports the component at the top of the MDX file.
- Prefer the existing components for visuals; keep content in MDX/Markdown.
- Public assets are referenced from `public/` (e.g. `/images/cover.jpg`,
  `/files/slides.pdf`), not imported from `src/assets`.
- Code blocks are styled by `astro-expressive-code`; do not add manual syntax
  highlighting.

## Workflows

- `npm install`
- `npm run dev` (use `astro dev --background` in agent sessions)
- `npm run build` runs `astro check` and then `astro build`
- `npm run preview` serves `dist/`
- Deploy: GitHub Pages on pushes to `master` (`.github/workflows/astro.yml`).
