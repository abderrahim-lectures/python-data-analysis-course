import React, {useRef, useState} from 'react';
import Translate from '@docusaurus/Translate';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import {ALL_STORAGE_KEYS} from '@site/src/utils/storageKeys';
import styles from './styles.module.css';

type BackupFile = Record<string, unknown>;

function isValidBackup(data: unknown): data is BackupFile {
  if (typeof data !== 'object' || data === null) return false;
  return Object.keys(data).every((key) => (ALL_STORAGE_KEYS as string[]).includes(key));
}

/** "Export my data" / "Import my data" — manual multi-device carry-over, not live sync. */
export default function DataTransfer(): React.JSX.Element {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = () => {
    if (!ExecutionEnvironment.canUseDOM) return;
    const backup: BackupFile = {};
    for (const key of ALL_STORAGE_KEYS) {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) {
        try {
          backup[key] = JSON.parse(raw);
        } catch {
          backup[key] = raw;
        }
      }
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `pda-course-backup-${date}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const text = await file.text();
      const data: unknown = JSON.parse(text);
      if (!isValidBackup(data)) {
        setError('That file doesn\'t look like a PyDA Course backup — nothing was imported.');
        return;
      }
      const confirmed = window.confirm(
        'Importing will overwrite your current progress on this device. Continue?',
      );
      if (!confirmed) return;

      Object.entries(data).forEach(([key, value]) => {
        window.localStorage.setItem(key, JSON.stringify(value));
      });
      window.location.reload();
    } catch {
      setError('Could not read that file — make sure it\'s a PyDA Course backup JSON file.');
    }
  };

  return (
    <div className={styles.wrapper}>
      <h3>
        <Translate id="dataTransfer.heading">Move to Another Device</Translate>
      </h3>
      <p>
        <Translate id="dataTransfer.intro">
          No accounts here, so this is manual: export a backup file on this device, then import
          it on another to carry your progress over.
        </Translate>
      </p>
      <div className={styles.actions}>
        <button className="button button--secondary" type="button" onClick={handleExport}>
          <Translate id="dataTransfer.export">Export my data</Translate>
        </button>
        <button className="button button--secondary" type="button" onClick={handleImportClick}>
          <Translate id="dataTransfer.import">Import my data</Translate>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className={styles.hiddenInput}
          onChange={handleFileSelected}
        />
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
