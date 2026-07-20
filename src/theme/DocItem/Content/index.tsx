import React, {useEffect, type ReactNode} from 'react';
import Content from '@theme-original/DocItem/Content';
import type ContentType from '@theme/DocItem/Content';
import type {WrapperProps} from '@docusaurus/types';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import {useCurrentDoc} from '@site/src/context/CurrentDocContext';
import type {SectionId, TrackId} from '@site/src/types/progress';

type Props = WrapperProps<typeof ContentType>;

const VALID_SECTIONS: SectionId[] = ['python-101', 'data-analysis'];
const VALID_TRACKS: TrackId[] = ['normal', 'hard'];

/** Our course-specific frontmatter fields, not part of Docusaurus's built-in DocFrontMatter type. */
interface CourseFrontMatter {
  section?: string;
  track?: string;
  week?: number;
}

/**
 * Reads this doc's `section`/`track`/`week` frontmatter and pushes it into
 * CurrentDocContext, which PlaygroundFab (mounted higher up, in Root) reads
 * to decide Trinket vs. JupyterLite and which notebook to deep-link to.
 */
export default function ContentWrapper(props: Props): ReactNode {
  const {frontMatter} = useDoc();
  const courseFrontMatter = frontMatter as CourseFrontMatter;
  const {setDoc} = useCurrentDoc();

  useEffect(() => {
    const section = VALID_SECTIONS.includes(courseFrontMatter.section as SectionId)
      ? (courseFrontMatter.section as SectionId)
      : null;
    const track = VALID_TRACKS.includes(courseFrontMatter.track as TrackId)
      ? (courseFrontMatter.track as TrackId)
      : null;
    const week = typeof courseFrontMatter.week === 'number' ? courseFrontMatter.week : null;
    setDoc({section, track, week});
    return () => setDoc({section: null, track: null, week: null});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseFrontMatter.section, courseFrontMatter.track, courseFrontMatter.week]);

  return (
    <>
      <Content {...props} />
    </>
  );
}
