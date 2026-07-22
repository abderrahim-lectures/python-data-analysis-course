import React, {useEffect, useState} from 'react';
import Head from '@docusaurus/Head';
import Translate, {translate} from '@docusaurus/Translate';
import Layout from '@theme/Layout';
import {decodeSharePayload} from '@site/src/utils/shareEncoding';
import SharedProgressCard from '@site/src/components/ShareProgress/SharedProgressCard';
import type {SharePayload} from '@site/src/types/share';

export default function SharePage(): React.JSX.Element {
  const [payload, setPayload] = useState<SharePayload | null>(null);

  // Deliberately not read from Docusaurus's useLocation()/synchronously
  // during render: this page is statically generated with no query string
  // (the ?data= only ever exists on a real visitor's actual URL), and
  // reading it inline produced a hydration bug — the SSR pass renders the
  // "invalid link" branch, and re-computing the same way on the client
  // during hydration doesn't reliably replace it (confirmed: the decoded
  // payload was provably correct, but the DOM stayed stuck on the SSR
  // output). Reading the real browser URL in an effect after mount instead
  // triggers an ordinary client-side state update, which React always
  // re-renders for, sidestepping the hydration-reconciliation edge case.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get('data');
    setPayload(encoded ? decodeSharePayload(encoded) : null);
  }, []);

  return (
    <Layout
      title={translate({id: 'sharePage.pageTitle', message: 'Shared Progress'})}
      description={translate({
        id: 'sharePage.pageDescription',
        message: "A student's shared course progress.",
      })}>
      {/* Ephemeral, query-string-driven, per-student content — no canonical
          SEO value, so keep it out of search results (also excluded in
          robots.txt and the sitemap). */}
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <main className="container margin-vert--lg" style={{display: 'flex', justifyContent: 'center'}}>
        {payload ? (
          <SharedProgressCard payload={payload} />
        ) : (
          <p>
            <Translate id="sharePage.invalidLink">
              This link doesn't contain a valid progress summary.
            </Translate>
          </p>
        )}
      </main>
    </Layout>
  );
}
