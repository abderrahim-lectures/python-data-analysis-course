---
title: Pandas & Data Analysis
slug: /data-analysis
description: "Pandas and Data Analysis: learn to load, clean, and analyze real datasets with pandas, from fundamentals to a full exploratory data analysis project."
---

<div style={{
  background: 'linear-gradient(135deg, #1e3a5f 0%, #2d6a9f 100%)',
  borderRadius: 'var(--pda-radius-lg)',
  padding: '2.5rem 2rem',
  marginBottom: '2rem',
  color: 'white',
  position: 'relative',
  overflow: 'hidden',
}}>
  <div style={{
    position: 'absolute',
    top: '-50%',
    right: '-20%',
    width: '300px',
    height: '300px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.08)',
    pointerEvents: 'none',
  }} />
  <h1 style={{margin: '0 0 0.5rem', fontSize: '2.2rem', color: 'white'}}>
    📊 Pandas & Data Analysis
  </h1>
  <p style={{margin: 0, fontSize: '1.15rem', opacity: 0.9, maxWidth: '600px'}}>
    Master the tools that data scientists use every day. Load, clean, and analyze real datasets right in your browser.
  </p>
</div>

<div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '1rem',
  marginBottom: '2rem',
}}>
  <div style={{
    background: 'var(--ifm-background-surface-color)',
    border: '1px solid var(--ifm-color-emphasis-200)',
    borderRadius: 'var(--pda-radius-lg)',
    padding: '1.25rem',
    textAlign: 'center',
  }}>
    <div style={{fontSize: '2rem', marginBottom: '0.5rem'}}>⚡</div>
    <div style={{fontWeight: 700, fontSize: '1.1rem'}}>100x Faster</div>
    <div style={{color: 'var(--ifm-color-emphasis-600)', fontSize: '0.9rem'}}>than pure Python</div>
  </div>
  <div style={{
    background: 'var(--ifm-background-surface-color)',
    border: '1px solid var(--ifm-color-emphasis-200)',
    borderRadius: 'var(--pda-radius-lg)',
    padding: '1.25rem',
    textAlign: 'center',
  }}>
    <div style={{fontSize: '2rem', marginBottom: '0.5rem'}}>📈</div>
    <div style={{fontWeight: 700, fontSize: '1.1rem'}}>Real Datasets</div>
    <div style={{color: 'var(--ifm-color-emphasis-600)', fontSize: '0.9rem'}}>work with real data</div>
  </div>
  <div style={{
    background: 'var(--ifm-background-surface-color)',
    border: '1px solid var(--ifm-color-emphasis-200)',
    borderRadius: 'var(--pda-radius-lg)',
    padding: '1.25rem',
    textAlign: 'center',
  }}>
    <div style={{fontSize: '2rem', marginBottom: '0.5rem'}}>🎯</div>
    <div style={{fontWeight: 700, fontSize: '1.1rem'}}>Kaggle Skills</div>
    <div style={{color: 'var(--ifm-color-emphasis-600)', fontSize: '0.9rem'}}>industry-standard tools</div>
  </div>
  <div style={{
    background: 'var(--ifm-background-surface-color)',
    border: '1px solid var(--ifm-color-emphasis-200)',
    borderRadius: 'var(--pda-radius-lg)',
    padding: '1.25rem',
    textAlign: 'center',
  }}>
    <div style={{fontSize: '2rem', marginBottom: '0.5rem'}}>🔬</div>
    <div style={{fontWeight: 700, fontSize: '1.1rem'}}>Explore & Visualize</div>
    <div style={{color: 'var(--ifm-color-emphasis-600)', fontSize: '0.9rem'}}>uncover insights</div>
  </div>
</div>

## Why Pandas?

If you did Python 101, you already felt how pure Python loops get slow on large data. Pandas fixes that — it does the heavy lifting in fast C code under the hood.

**🎯 What you'll master in 5 weeks:**
- 📥 **Load and explore** tabular data with pandas
- 🔍 **Filter, group, and aggregate** real datasets
- 📊 **Reproduce a Kaggle notebook** end to end

---

## Choose Your Path

Both tracks cover the same 5 weeks. Pick the one that fits your goals:

<TrackSelector
  section="data-analysis"
  requiresPlacementQuizForHard
  normal={{
    title: '📚 Pandas Basics',
    description: 'Learn pandas fundamentals, then reproduce a classic Kaggle notebook.',
    bullets: [
      'Series & DataFrame basics, reading CSV',
      'Selection, filtering, indexing',
      'Cleaning: missing values, dtypes, string ops',
      'Groupby, aggregation, merging',
      'Guided reproduction of a Titanic EDA notebook',
    ],
    timeCommitment: '~3–4 hours/week',
    startUrl: '/docs/data-analysis/normal/week-6',
  }}
  hard={{
    title: '🚀 Full EDA Project',
    description:
      'Run a complete exploratory data analysis — from framing questions to delivering insights.',
    bullets: [
      'EDA framework: framing questions, profiling a dataset',
      'Univariate analysis + visualizations',
      'Bivariate/multivariate analysis, correlation',
      'Advanced, storytelling visualizations',
      'Final deliverable: a full EDA report on a real dataset',
    ],
    timeCommitment: '~4–6 hours/week',
    startUrl: '/docs/data-analysis/hard/week-6',
  }}
/>

<div style={{
  background: 'var(--ifm-color-emphasis-100)',
  borderRadius: 'var(--pda-radius-lg)',
  padding: '1.5rem',
  marginTop: '2rem',
  textAlign: 'center',
}}>
  <p style={{margin: 0, fontSize: '0.95rem', color: 'var(--ifm-color-emphasis-700)'}}>
    🎯 <strong>Prerequisite:</strong> Complete Python 101 first, or take the placement quiz to jump straight into the Hard track!
  </p>
</div>
