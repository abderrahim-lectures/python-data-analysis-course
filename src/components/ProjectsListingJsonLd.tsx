import Head from '@docusaurus/Head';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {PROJECTS} from '@site/src/data/projects';

/**
 * ItemList structured data for the projects library listing page. Each item
 * is a plain url+position entry (no name — translated titles live outside the
 * shared metadata), which is enough for crawlers to discover every project
 * page and understand the collection's order as the library grows well past
 * a hundred entries. Rendered per-locale so it points at each locale's own
 * project pages.
 */
export default function ProjectsListingJsonLd() {
  const {
    siteConfig: {url},
    i18n: {currentLocale},
  } = useDocusaurusContext();

  const base = currentLocale === 'en' ? url : `${url}/${currentLocale}`;

  // Same newest-first order the gallery uses, so positions match what users see.
  const sorted = [...PROJECTS].sort((a, b) => {
    if (a.date !== b.date) {
      return a.date < b.date ? 1 : -1;
    }
    return a.id < b.id ? -1 : 1;
  });

  const itemListElement = sorted.map((p, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    url: `${base}${p.url}`,
  }));

  return (
    <Head>
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'Real-World Python Projects',
          itemListElement,
        })}
      </script>
    </Head>
  );
}
