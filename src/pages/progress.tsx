import type {ReactNode} from 'react';
import Layout from '@theme/Layout';
import BadgeCase from '@site/src/components/BadgeCase';

export default function ProgressPage(): ReactNode {
  return (
    <Layout title="My Progress" description="Track your course progress and badges.">
      <main className="container margin-vert--lg">
        <h1>My Progress</h1>
        <BadgeCase />
      </main>
    </Layout>
  );
}
