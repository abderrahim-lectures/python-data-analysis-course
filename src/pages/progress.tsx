import type {ReactNode} from 'react';
import Layout from '@theme/Layout';
import BadgeCase from '@site/src/components/BadgeCase';
import ShareProgress from '@site/src/components/ShareProgress';
import DataTransfer from '@site/src/components/DataTransfer';

export default function ProgressPage(): ReactNode {
  return (
    <Layout title="My Progress" description="Track your course progress and badges.">
      <main className="container margin-vert--lg">
        <h1>My Progress</h1>
        <BadgeCase />
        <ShareProgress />
        <DataTransfer />
      </main>
    </Layout>
  );
}
