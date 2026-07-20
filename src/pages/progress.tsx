import type {ReactNode} from 'react';
import Layout from '@theme/Layout';

export default function ProgressPage(): ReactNode {
  return (
    <Layout title="My Progress" description="Track your course progress and badges.">
      <main className="container margin-vert--lg">
        <h1>My Progress</h1>
        <p>
          Your badges and progress will show up here once you start the course. This page is
          being built out — check back soon.
        </p>
      </main>
    </Layout>
  );
}
