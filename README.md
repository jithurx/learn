# learn.jithurx.dev

My personal learning and documentation platform. It is built with [Astro Starlight](https://starlight.astro.build/).

## Project Structure

```text
/
├── public/
│   └── images/                 # Favicons and cover images for posts
├── src/
│   ├── components/             # Custom Starlight component overrides
│   ├── content/
│   │   └── docs/
│   │       └── posts/          # Markdown content for all wiki posts
│   ├── pages/
│   │   └── index.astro         # The custom, sidebar-less splash homepage
│   └── styles/
│       └── custom.css          # Global Gruvbox theme variables
└── astro.config.mjs            # Starlight and Astro configuration
```

## Managing Content

This repository includes a built-in Local CMS Dashboard for easily managing your wiki posts. 

To add, edit, or delete posts, run the following command in your terminal:

```bash
npm run manage-posts
```

This will launch a web interface where you can:
- **Create Posts**: Generate new posts and upload cover images.
- **Upload Attachments**: Attach downloadable files (PDFs, Docs, etc.) to your posts which are automatically saved to `public/files/` and linked via markdown.
- **Edit Posts**: Instantly open a live Markdown editor for any existing post.
- **Delete Posts**: Cleanly wipe a post along with its images and attachments.

*Note: If newly created content does not appear immediately on the local server, run `npx astro dev stop` followed by `npx astro dev --background` to restart the file watcher.*

## Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run manage-posts`    | Opens the Local CMS Dashboard to manage posts    |
| `npx astro dev --background` | Starts local dev server in the background   |
| `npx astro dev stop`      | Stops the background dev server                  |
| `npm run build`           | Build your production site to `./dist/`          |

## Tech Stack

- [Astro](https://astro.build)
- [Starlight](https://starlight.astro.build)
