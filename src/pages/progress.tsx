import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import BadgeCase from '@site/src/components/BadgeCase';
import ShareProgress from '@site/src/components/ShareProgress';
import DataTransfer from '@site/src/components/DataTransfer';
import {useCourseComplete} from '@site/src/hooks/useUnlockCondition';

export default function ProgressPage(): ReactNode {
  const courseComplete = useCourseComplete();

  return (
    <Layout title="My Progress" description="Track your course progress and badges.">
      <main className="container margin-vert--lg">
        <h1>My Progress</h1>
        {courseComplete && (
          <div className="alert alert--success margin-bottom--lg" role="alert">
            🎓 You've finished the whole course! Your Capstone Bonus is unlocked —{' '}
            <Link to="/docs/bonus/capstone-ai-agent">
              <strong>install Python for real and build your first AI agent</strong>
            </Link>
            .
          </div>
        )}
        <BadgeCase />
        <ShareProgress />
        <DataTransfer />
      </main>
    </Layout>
  );
}
