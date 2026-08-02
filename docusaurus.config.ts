import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const {version: pkgVersion} = require('./package.json');

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Python & Data Analysis Course',
  tagline: 'Learn Python and data analysis in your browser — no installs needed',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
    // Git-backed "last updated" timestamps — feeds the sitemap's per-page
    // <lastmod> (a real freshness signal for crawlers) and a "Last updated"
    // line on docs pages.
    experimental_vcs: true,
  },

  url: 'https://pyda-course.online',
  baseUrl: '/',

  organizationName: 'abderrahim-lectures',
  projectName: 'python-data-analysis-course',

  headTags: [
    {
      tagName: 'meta',
      attributes: {name: 'author', content: 'Abderrahim Adrabi'},
    },
    {
      tagName: 'meta',
      attributes: {property: 'og:site_name', content: 'Python & Data Analysis Course'},
    },
    {
      tagName: 'script',
      attributes: {type: 'application/ld+json'},
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebSite',
            '@id': 'https://pyda-course.online/#website',
            url: 'https://pyda-course.online/',
            name: 'Python & Data Analysis Course',
            description:
              'A free, browser-based Python and data analysis course — no installs required.',
            inLanguage: ['en', 'ar', 'es', 'fr'],
            publisher: {'@id': 'https://pyda-course.online/#organization'},
          },
          {
            '@type': 'Organization',
            '@id': 'https://pyda-course.online/#organization',
            name: 'Python & Data Analysis Course',
            url: 'https://pyda-course.online/',
            logo: {
              '@type': 'ImageObject',
              url: 'https://pyda-course.online/img/logo.svg',
            },
            sameAs: ['https://github.com/abderrahim-lectures/python-data-analysis-course'],
          },
          {
            '@type': 'Course',
            '@id': 'https://pyda-course.online/#course',
            name: 'Python & Data Analysis Course',
            description:
              'A free, browser-based Python and data analysis course covering Python fundamentals and pandas/EDA across two 5-week sections, each with Normal and Hard tracks, plus a growing library of real-world projects to build after you graduate from the playground.',
            url: 'https://pyda-course.online/',
            isAccessibleForFree: true,
            inLanguage: ['en', 'ar', 'es', 'fr'],
            learningResourceType: 'Course',
            educationalLevel: 'Beginner',
            coursePrerequisites: 'None — no prior programming experience needed.',
            teaches: [
              'Python fundamentals',
              'Pandas and data analysis',
              'Exploratory data analysis',
              'Building real-world Python projects',
            ],
            offers: {
              '@type': 'Offer',
              category: 'Free',
              price: '0',
              priceCurrency: 'USD',
            },
            provider: {'@id': 'https://pyda-course.online/#organization'},
            author: {
              '@type': 'Person',
              name: 'Abderrahim Adrabi',
            },
            hasCourseInstance: {
              '@type': 'CourseInstance',
              courseMode: 'Online',
              courseWorkload: 'PT20H',
              inLanguage: ['en', 'ar', 'es', 'fr'],
              isAccessibleForFree: true,
            },
          },
        ],
      }),
    },
  ],
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
          // Git-backed "Last updated" line on docs pages + the data that feeds
          // the sitemap's per-page <lastmod> (see future.experimental_vcs).
          showLastUpdateTime: true,
          remarkPlugins: [require('remark-math')],
          rehypePlugins: [require('rehype-katex')],
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
        sitemap: {
          // /share renders per-student, query-string-driven content with no
          // canonical SEO value of its own — keep it out of the sitemap
          // (it's also disallowed in static/robots.txt and marked noindex).
          ignorePatterns: ['/share'],
          changefreq: 'weekly',
          priority: 0.5,
          // Include a per-page lastmod so crawlers see when each doc changes.
          lastmod: 'datetime',
        },
        gtag: {
          trackingID: 'G-FTR585C5BX',
          anonymizeIP: true,
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

  plugins: [
    [
      '@docusaurus/plugin-client-redirects',
      {
        // The Capstone Projects feature was renamed/reorganized into an
        // open, ongoing "Real-World Projects" library — these keep old
        // shared links, search results, and README references working.
        redirects: [
          {to: '/docs/projects', from: '/docs/bonus'},
          {to: '/docs/projects/ai-agent', from: '/docs/bonus/2026-ai-agent'},
          {to: '/docs/projects/finetune-llm-unsloth', from: '/docs/bonus/2027-finetune-llm'},
        ],
      },
    ],
    [
      '@docusaurus/plugin-pwa',
      {
        debug: false,
        // 'always' (not just 'appInstalled'/'standalone'/'queryString', the
        // plugin's own default) so precaching and offline serving work for
        // every visitor, not only students who installed the app — this
        // course's whole pitch is "works offline", and the precached
        // manifest is just the Docusaurus build output (HTML/JS/CSS), not
        // the much heavier JupyterLite/Pyodide payload, which lives outside
        // this manifest and is loaded lazily/separately, so this doesn't
        // meaningfully add to first-visit mobile data cost.
        offlineModeActivationStrategies: ['always'],
        pwaHead: [
          {tagName: 'link', rel: 'icon', href: '/img/pwa/icon-192.png'},
          {tagName: 'link', rel: 'manifest', href: '/manifest.json'},
          {tagName: 'meta', name: 'theme-color', content: '#3ecc5f'},
          {tagName: 'meta', name: 'apple-mobile-web-app-capable', content: 'yes'},
          {tagName: 'meta', name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent'},
          {tagName: 'link', rel: 'apple-touch-icon', href: '/img/pwa/apple-icon-180.png'},
        ],
      },
    ],
  ],

  themeConfig: {
    image: 'img/social-card.jpg',
    metadata: [
      {
        name: 'keywords',
        content:
          'python course, learn python, data analysis course, pandas tutorial, free python course, python for beginners, exploratory data analysis, jupyter, in-browser python',
      },
    ],
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
        {
          type: 'docSidebar',
          sidebarId: 'projectsSidebar',
          position: 'left',
          label: 'Projects',
        },
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
            {label: 'Projects', to: '/docs/projects'},
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
            {
              label: 'Changelog',
              href: 'https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/CHANGELOG.md',
            },
          ],
        },
      ],
      // This English string is computed fresh on every build (year, version).
      // Its translated counterparts in i18n/{ar,es,fr}/docusaurus-theme-classic/footer.json
      // are static text (Docusaurus's i18n JSON files can't embed a dynamic
      // template like this one) — bump those three "copyright" messages by
      // hand whenever the version or year changes here, or they'll drift.
      copyright: `Copyright © ${new Date().getFullYear()} Abderrahim Adrabi. Code MIT-licensed, content CC-BY 4.0. v${pkgVersion}`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['python', 'bash'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
