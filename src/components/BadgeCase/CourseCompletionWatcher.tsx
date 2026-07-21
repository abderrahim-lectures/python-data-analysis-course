import {useEffect} from 'react';
import {useBadges} from '@site/src/hooks/useBadges';
import {useCourseComplete} from '@site/src/hooks/useUnlockCondition';
import {COURSE_GRADUATE_BADGE} from '@site/src/utils/badges';

/** Global, invisible: awards course-graduate the moment every chosen week is complete. */
export default function CourseCompletionWatcher(): null {
  const complete = useCourseComplete();
  const {awardBadge, hasBadge} = useBadges();

  useEffect(() => {
    if (complete && !hasBadge(COURSE_GRADUATE_BADGE)) {
      awardBadge(COURSE_GRADUATE_BADGE);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complete]);

  return null;
}
