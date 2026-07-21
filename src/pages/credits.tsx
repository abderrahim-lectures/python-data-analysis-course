import type {ReactNode} from 'react';
import Translate, {translate} from '@docusaurus/Translate';
import Layout from '@theme/Layout';

export default function CreditsPage(): ReactNode {
  return (
    <Layout
      title={translate({id: 'credits.pageTitle', message: 'Credits'})}
      description={translate({
        id: 'credits.pageDescription',
        message: 'Datasets and tools used in this course.',
      })}>
      <main className="container margin-vert--lg">
        <h1>
          <Translate id="credits.heading">Credits</Translate>
        </h1>
        <p>
          <Translate id="credits.intro">
            Datasets and third-party tools this course relies on:
          </Translate>
        </p>
        <ul>
          <li>
            <a href="https://trinket.io" target="_blank" rel="noreferrer">
              Trinket
            </a>{' '}
            —{' '}
            <Translate id="credits.trinket">
              In-browser Python editor used throughout Python 101.
            </Translate>
          </li>
          <li>
            <a href="https://jupyterlite.readthedocs.io" target="_blank" rel="noreferrer">
              JupyterLite
            </a>{' '}
            —{' '}
            <Translate id="credits.jupyterlite">
              In-browser Jupyter Notebook (via Pyodide) used throughout Data Analysis.
            </Translate>
          </li>
          <li>
            <a href="https://pyodide.org" target="_blank" rel="noreferrer">
              Pyodide
            </a>{' '}
            —{' '}
            <Translate id="credits.pyodide">
              WebAssembly Python runtime powering JupyterLite in this course.
            </Translate>
          </li>
          <li>
            <a href="https://www.kaggle.com/c/titanic" target="_blank" rel="noreferrer">
              Titanic dataset
            </a>{' '}
            —{' '}
            <Translate id="credits.titanic">
              Week 10 Normal-track guided EDA reproduction uses a small synthetic dataset modeled
              on this well-known Kaggle dataset's schema (same columns, generated passenger
              data), bundled locally so it works offline in JupyterLite.
            </Translate>
          </li>
          <li>
            <a
              href="https://www.kaggle.com/datasets/spscientist/students-performance-in-exams"
              target="_blank"
              rel="noreferrer">
              Students Performance in Exams
            </a>{' '}
            —{' '}
            <Translate id="credits.studentsPerformance">
              Week 10 Hard-track final EDA deliverable uses a small synthetic dataset modeled on
              this Kaggle dataset's schema, bundled locally so it works offline in JupyterLite.
            </Translate>
          </li>
        </ul>
      </main>
    </Layout>
  );
}
