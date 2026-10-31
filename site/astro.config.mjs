// @ts-check
import { fileURLToPath } from 'node:url';

import { unified } from '@astrojs/markdown-remark';
import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import remarkDirective from 'remark-directive';

import remarkContentLint from './src/plugins/remark-content-lint.mjs';
import remarkInlineFigures from './src/plugins/remark-inline-figures.mjs';
import remarkLearnBlocks from './src/plugins/remark-learn-blocks.mjs';

/** The repository root, so pages can embed tested files from lab/, platform/, checks/ and case/. */
const repoRoot = fileURLToPath(new URL('..', import.meta.url));

export default defineConfig({
  // GitHub Pages of the repository, the custom domain follows later
  site: 'https://ndum.github.io',
  // Pull request previews are built under their own path
  base: process.env.SITE_BASE ?? '/cc/',
  trailingSlash: 'always',

  markdown: {
    processor: unified({
      gfm: true,
      // Smartypants would turn quotes into English curly quotes, wrong for Swiss German
      smartypants: false,
      remarkPlugins: [remarkDirective, remarkContentLint, [remarkLearnBlocks, { root: repoRoot }], remarkInlineFigures],
    }),
  },

  integrations: [
    starlight({
      title: 'CC',
      description: 'Cloud Computing mit einer eigenen Private Cloud, ein zweisprachiger Kurs für die höhere Fachschule.',
      defaultLocale: 'root',
      locales: {
        root: { label: 'Deutsch', lang: 'de-CH' },
        en: { label: 'English', lang: 'en' },
      },
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/ndum/cc' }],
      sidebar: [
        // The parts come first and without a gap, the blocks without numbers follow them
        { label: 'Start', translations: { en: 'Getting started' }, collapsed: true, items: [{ autogenerate: { directory: 'start' } }] },
        { label: 'Cloud-Grundlagen', translations: { en: 'Cloud basics' }, collapsed: true, items: [{ autogenerate: { directory: 'basics' } }] },
        { label: 'IaaS aufbauen', translations: { en: 'Building IaaS' }, collapsed: true, items: [{ autogenerate: { directory: 'iaas' } }] },
        {
          label: 'Ergänzungen',
          translations: { en: 'Supplements' },
          collapsed: true,
          items: [{ autogenerate: { directory: 'extras' } }],
        },
        {
          label: 'Leistungsbeurteilung',
          translations: { en: 'Assessment' },
          collapsed: true,
          items: [{ slug: 'assessment', label: 'Übersicht', translations: { en: 'Overview' } }],
        },
        {
          label: 'Nachschlagen',
          translations: { en: 'Reference' },
          collapsed: true,
          items: [{ slug: 'glossary' }],
        },
      ],
      disable404Route: true,
      // Numbers of parts and chapters in the navigation
      routeMiddleware: './src/route-data.js',
      customCss: ['./src/styles/course.css'],
      components: {
        Head: './src/components/Head.astro',
        Pagination: './src/components/Pagination.astro',
        Footer: './src/components/Footer.astro',
      },
    }),
  ],
});
