import type {ReactNode} from 'react';
import Layout from '@theme/Layout';

interface Credit {
  name: string;
  url: string;
  note: string;
}

const credits: Credit[] = [
  {
    name: 'Trinket',
    url: 'https://trinket.io',
    note: 'In-browser Python editor used throughout Python 101.',
  },
  {
    name: 'JupyterLite',
    url: 'https://jupyterlite.readthedocs.io',
    note: 'In-browser Jupyter Notebook (via Pyodide) used throughout Data Analysis.',
  },
  {
    name: 'Pyodide',
    url: 'https://pyodide.org',
    note: 'WebAssembly Python runtime powering JupyterLite in this course.',
  },
  {
    name: 'Titanic dataset',
    url: 'https://www.kaggle.com/c/titanic',
    note: 'Used for the Week 10 Normal-track guided EDA reproduction.',
  },
  {
    name: 'Students Performance in Exams',
    url: 'https://www.kaggle.com/datasets/spscientist/students-performance-in-exams',
    note: 'Used for the Week 10 Hard-track final EDA deliverable.',
  },
];

export default function CreditsPage(): ReactNode {
  return (
    <Layout title="Credits" description="Datasets and tools used in this course.">
      <main className="container margin-vert--lg">
        <h1>Credits</h1>
        <p>Datasets and third-party tools this course relies on:</p>
        <ul>
          {credits.map((credit) => (
            <li key={credit.name}>
              <a href={credit.url} target="_blank" rel="noreferrer">
                {credit.name}
              </a>{' '}
              — {credit.note}
            </li>
          ))}
        </ul>
      </main>
    </Layout>
  );
}
