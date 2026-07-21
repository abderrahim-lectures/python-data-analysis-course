import React from 'react';
import {useLocation} from '@docusaurus/router';
import Layout from '@theme/Layout';
import {decodeSharePayload} from '@site/src/utils/shareEncoding';
import SharedProgressCard from '@site/src/components/ShareProgress/SharedProgressCard';

export default function SharePage(): React.JSX.Element {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const encoded = params.get('data');
  const payload = encoded ? decodeSharePayload(encoded) : null;

  return (
    <Layout title="Shared Progress" description="A student's shared course progress.">
      <main className="container margin-vert--lg" style={{display: 'flex', justifyContent: 'center'}}>
        {payload ? (
          <SharedProgressCard payload={payload} />
        ) : (
          <p>This link doesn't contain a valid progress summary.</p>
        )}
      </main>
    </Layout>
  );
}
