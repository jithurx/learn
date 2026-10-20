# learn.jithurx.dev

Academic-style project pages for my learning notes and technical write-ups. The
site is built with [Astro](https://astro.build/), [Tailwind CSS](https://tailwindcss.com/),
and [MDX](https://mdxjs.com/), based on
[Roman Hauksson-Neill's academic project page template](https://github.com/RomanHauksson/academic-project-astro-template).

## Structure

```text
/
├── public/
│   ├── files/                  # Downloadable slides, PDFs, and archives
│   ├── images/                 # Cover images and figures referenced from content
│   └── videos/                 # Video assets
├── src/
│   ├── components/             # Academic project page components
│   ├── content/
│   │   └── projects/           # One .mdx file per project page
│   ├── layouts/
│   │   └── BaseLayout.astro    # Shared document shell, fonts, and prose styles
│   ├── pages/
│   │   ├── index.astro         # Project archive / landing page
│   │   └── projects/
│   │       └── [...slug].astro # Renders a project from the content collection
│   └── styles/
│       └── global.css          # Tailwind theme, typography, and layout tokens
└── astro.config.ts             # Astro, MDX, Mermaid, and KaTeX configuration
```

## Adding a project

Create a new `.mdx` file in `src/content/projects/`. The filename becomes the URL
slug (`src/content/projects/my-project.mdx` → `/projects/my-project/`).

```mdx
---
title: "My Project"
subtitle: "A one-line subtitle shown under the header"
description: "Used for the archive card and link previews."
date: 2026-08-01
tags: ["Topic", "Workshop"]
number: 4
cover: "/images/my-cover.jpg"
links:
  - name: "Slides"
    url: "/files/my-slides.pdf"
    icon: "ri:slideshow-2-line"
---

import HighlightedSection from "@/components/HighlightedSection.astro";

<HighlightedSection>

## Abstract

A short summary of the project.

</HighlightedSection>

## First Section

Body content in Markdown, MDX, LaTeX, or Mermaid.
```

Projects are ordered by `number`. A project page automatically gets a cover
header, author line, tags, link buttons, and a footer.

### Numbered and legacy URLs

- `/<number>/` redirects to the corresponding project page (for example, `/3/`).
- The old Starlight slugs (`/git-and-beyond/`, `/intro-to-hardware/`, and
  `/intro-to-hardware-day-2/`) redirect to their new `/projects/...` pages.
  Add more entries to `redirects` in `astro.config.ts` when moving content.

## Search

A client-side search bar indexes every project section at build time via
`src/pages/search-index.json.ts`. The home page has an inline search bar; project
pages expose a floating search button. Both support `/` and `Ctrl/Cmd+K` as
keyboard shortcuts, and results deep-link to the relevant section anchor.

## Development

```bash
npm install
npm run dev
npm run build
npm run preview
```

`npm run build` runs `astro check` before building. To verify the production
output locally, run `npm run build && npm run preview`.
