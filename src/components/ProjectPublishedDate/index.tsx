import React from 'react';
import Translate from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {PROJECTS, formatProjectDate} from '@site/src/data/projects';
import type {ProjectId} from '@site/src/types/progress';

interface Props {
  projectId: ProjectId;
}

/** Small "Published Month Year" line shown near the top of a project's own page. */
export default function ProjectPublishedDate({projectId}: Props): React.JSX.Element {
  const {
    i18n: {currentLocale},
  } = useDocusaurusContext();
  const meta = PROJECTS.find((p) => p.id === projectId);
  if (!meta) {
    throw new Error(`No PROJECTS entry for id "${projectId}" — add one to src/data/projects.ts`);
  }

  return (
    <p>
      <em>
        <Translate
          id="projectPublishedDate.label"
          description="Published-date line on a project's own page"
          values={{date: formatProjectDate(meta.date, currentLocale)}}>
          {'Published {date}.'}
        </Translate>
      </em>
    </p>
  );
}
