import React, {useState} from 'react';
import Link from '@docusaurus/Link';
import {useHistory} from '@docusaurus/router';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Translate from '@docusaurus/Translate';
import {useLocalStorage} from '@site/src/hooks/useLocalStorage';
import {STORAGE_KEYS} from '@site/src/utils/storageKeys';
import PlacementQuiz from '@site/src/components/PlacementQuiz';
import type {PerSectionTrack, SectionId} from '@site/src/types/progress';
import styles from './styles.module.css';

export interface TrackInfo {
  title: string;
  description: string;
  bullets: string[];
  timeCommitment: string;
  startUrl: string;
}

interface Props {
  section: SectionId;
  normal: TrackInfo;
  hard: TrackInfo;
  /** Only true for Data Analysis — Python 101's Hard track has no prerequisite to check. */
  requiresPlacementQuizForHard?: boolean;
}

export default function TrackSelector({
  section,
  normal,
  hard,
  requiresPlacementQuizForHard = false,
}: Props): React.JSX.Element {
  const [tracks, setTracks] = useLocalStorage<PerSectionTrack>(STORAGE_KEYS.track, {});
  const [showPlacementGate, setShowPlacementGate] = useState(false);
  const history = useHistory();
  // useHistory().push() takes a path relative to the router's root, not this
  // site's baseUrl — unlike <Link>, it doesn't resolve baseUrl automatically,
  // so the target path must be resolved through useBaseUrl first or this
  // navigates outside /python-data-analysis-course/ entirely.
  const hardStartUrl = useBaseUrl(hard.startUrl);

  const chooseNormal = () => {
    setTracks((prev) => ({...prev, [section]: 'normal'}));
  };

  const chooseHard = (event: React.MouseEvent) => {
    if (requiresPlacementQuizForHard) {
      event.preventDefault();
      setShowPlacementGate(true);
      return;
    }
    setTracks((prev) => ({...prev, [section]: 'hard'}));
  };

  const proceedToHard = () => {
    setTracks((prev) => ({...prev, [section]: 'hard'}));
    history.push(hardStartUrl);
  };

  if (showPlacementGate) {
    return <PlacementQuiz onProceed={proceedToHard} />;
  }

  return (
    <div className={styles.grid}>
      <TrackCard track={normal} label="Normal" emoji="🟢" onSelect={chooseNormal} />
      <TrackCard track={hard} label="Hard" emoji="🔴" onSelect={chooseHard} />
    </div>
  );
}

function TrackCard({
  track,
  label,
  emoji,
  onSelect,
}: {
  track: TrackInfo;
  label: string;
  emoji: string;
  onSelect: (event: React.MouseEvent) => void;
}): React.JSX.Element {
  return (
    <div className={styles.card}>
      <h3>
        {emoji} {label}: {track.title}
      </h3>
      <p>{track.description}</p>
      <ul>
        {track.bullets.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>
      <p className={styles.timeCommitment}>
        ⏱️ <Translate id="trackSelector.timeCommitment">Time commitment:</Translate>{' '}
        {track.timeCommitment}
      </p>
      <Link className="button button--primary button--block" to={track.startUrl} onClick={onSelect}>
        <Translate id="trackSelector.start" values={{label}}>
          {'Start {label} →'}
        </Translate>
      </Link>
    </div>
  );
}
