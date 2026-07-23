import React, {useEffect, useState} from 'react';
import Translate, {translate} from '@docusaurus/Translate';
import {useLocalStorage} from '@site/src/hooks/useLocalStorage';
import {STORAGE_KEYS} from '@site/src/utils/storageKeys';

const GUEST_NAME = translate({
  id: 'projectGreeting.guestName',
  message: 'Guest',
  description: 'Fallback name used in the project greeting when no student name is set',
});

/**
 * Warm, empathetic opening line at the top of every real-world project page —
 * installing Python for real and building something on your own is a genuine
 * step up from the in-browser playground, worth acknowledging honestly, not
 * just "here are the steps". Personalized with the student's name when set
 * at onboarding; falls back to generic phrasing if empty, same convention as
 * every other name-aware component in this course.
 *
 * Every project page mounts this, so it's worth being careful about
 * hydration: useLocalStorage reads real browser state as early as the first
 * client render, which differs from the server-rendered "Guest" fallback and
 * would otherwise trigger a hydration-mismatch warning on every single page
 * load. Rendering the same "Guest" fallback until after mount — then
 * swapping to the real name in a plain post-hydration re-render — keeps the
 * first client render identical to the server output.
 */
export default function ProjectGreeting(): React.JSX.Element {
  const [storedName] = useLocalStorage<string>(STORAGE_KEYS.studentName, '');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const name = mounted && storedName ? storedName : GUEST_NAME;

  return (
    <p>
      <Translate
        id="projectGreeting.named"
        description="Warm, empathetic greeting with the student's name (or 'Guest' if none set) at the top of a project page"
        values={{name}}>
        {
          "Hi {name} — nice work getting this far. Installing Python for real and building something on your own can feel like a big jump from the in-browser playground, but you have what you need for it. Let's get started."
        }
      </Translate>
    </p>
  );
}
