import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Translate, {translate} from '@docusaurus/Translate';
import Layout from '@theme/Layout';
import BadgeCase from '@site/src/components/BadgeCase';
import ShareProgress from '@site/src/components/ShareProgress';
import DataTransfer from '@site/src/components/DataTransfer';
import {useCourseComplete} from '@site/src/hooks/useUnlockCondition';

export default function ProgressPage(): ReactNode {
  const courseComplete = useCourseComplete();

  return (
    <Layout
      title={translate({id: 'progressPage.pageTitle', message: 'My Progress'})}
      description={translate({
        id: 'progressPage.pageDescription',
        message: 'Track your course progress and badges.',
      })}>
      <main className="container margin-vert--lg">
        <h1>
          <Translate id="progressPage.heading">My Progress</Translate>
        </h1>
        {courseComplete && (
          <div className="alert alert--success margin-bottom--lg" role="alert">
            🎓{' '}
            <Translate
              id="progressPage.courseComplete"
              values={{
                link: (
                  <Link to="/docs/bonus">
                    <strong>
                      <Translate id="progressPage.courseComplete.linkText">
                        choose a Capstone project to build
                      </Translate>
                    </strong>
                  </Link>
                ),
              }}>
              {"You've finished the whole course! Your Capstone projects are unlocked — {link}."}
            </Translate>
          </div>
        )}
        <BadgeCase />
        <ShareProgress />
        <DataTransfer />
      </main>
    </Layout>
  );
}
