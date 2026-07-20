import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Python & Data Analysis Course',
  tagline: 'Learn Python and data analysis in your browser — no installs needed',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://abderrahim-lectures.github.io',
  baseUrl: '/python-data-analysis-course/',

  organizationName: 'abderrahim-lectures',
  projectName: 'python-data-analysis-course',
  trailingSlash: false,

  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ar', 'es', 'fr'],
    localeConfigs: {
      en: {label: 'English', direction: 'ltr'},
      ar: {label: 'العربية', direction: 'rtl'},
      es: {label: 'Español', direction: 'ltr'},
      fr: {label: 'Français', direction: 'ltr'},
    },
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl:
            'https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/',
          remarkPlugins: [require('remark-math')],
          rehypePlugins: [require('rehype-katex')],
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  stylesheets: [
    {
      href: 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css',
      type: 'text/css',
      integrity:
        'sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV',
      crossorigin: 'anonymous',
    },
  ],

  themes: ['@easyops-cn/docusaurus-search-local'],

  themeConfig: {
    image: 'img/social-card.jpg',
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: true,
    },
    docs: {
      sidebar: {
        hideable: false,
        autoCollapseCategories: true,
      },
    },
    navbar: {
      title: 'PyDA Course',
      logo: {
        alt: 'Python & Data Analysis Course logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'python101Sidebar',
          position: 'left',
          label: 'Python 101',
        },
        {
          type: 'docSidebar',
          sidebarId: 'dataAnalysisSidebar',
          position: 'left',
          label: 'Data Analysis',
        },
        {to: '/docs/bonus/capstone-ai-agent', label: 'Capstone Bonus', position: 'left'},
        {to: '/progress', label: 'My Progress', position: 'right'},
        {to: '/credits', label: 'Credits', position: 'right'},
        {
          type: 'localeDropdown',
          position: 'right',
        },
        {
          href: 'https://github.com/abderrahim-lectures/python-data-analysis-course',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Course',
          items: [
            {label: 'Python 101', to: '/docs/python-101'},
            {label: 'Data Analysis', to: '/docs/data-analysis'},
            {label: 'Capstone Bonus', to: '/docs/bonus/capstone-ai-agent'},
          ],
        },
        {
          title: 'Site',
          items: [
            {label: 'My Progress', to: '/progress'},
            {label: 'Credits', to: '/credits'},
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/abderrahim-lectures/python-data-analysis-course',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Python & Data Analysis Course. Code MIT-licensed, content CC-BY 4.0.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['python', 'bash'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
