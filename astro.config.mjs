import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://learn.jithurx.dev',
  integrations: [
    starlight({
      title: 'learn.jithurx.dev',
      favicon: '/favicon.ico',
      head: [
        { tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.googleapis.com' } },
        { tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: true } },
        { tag: 'link', attrs: { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400..700&display=swap' } },
        { tag: 'link', attrs: { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' } },
        { tag: 'link', attrs: { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' } },
        { tag: 'link', attrs: { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' } },
        { tag: 'link', attrs: { rel: 'manifest', href: '/site.webmanifest' } }
      ],
      customCss: ['./src/styles/custom.css'],
      components: {
        PageTitle: './src/components/PageTitleOverride.astro',
        Sidebar: './src/components/SidebarOverride.astro',
        Pagination: './src/components/PaginationOverride.astro',
      },
      sidebar: [
        {
          label: 'Posts',
          items: [{ autogenerate: { directory: 'posts' } }],
        },
      ],
    }),
  ],
});
