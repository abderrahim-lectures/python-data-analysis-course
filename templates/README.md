# Project authoring templates

These files help students write a project for the course. They are excluded
from `src/content/` and publish no project page themselves.

- `project.md`: copy this to `src/content/projects/<your-slug>.md`. It follows
  the same section order as published project pages: outcomes, where to run
  this (with Colab/Kaggle/Binder badges), setup, numbered steps, common
  pitfalls, recap, next steps, sharing, and a credit and licence section.
  Replace the sample grade calculator and every authoring comment with your own
  project. Its `author` field is for the English entry only; reuse an existing
  id or add a new one in `src/lib/contributors.ts`.
- `project.translated.md`: copy this under `src/content/projects/{ar,es,fr}/`
  with the same filename as the English page. Translate the title, description,
  and every learner-facing section. Keep `difficulty` as the exact schema enum
  (`beginner`, `intermediate`, or `advanced`), keep `author` out, and point each
  locale's badges at its own notebook.

## Notebooks and badges

Every published project page shows Colab, Kaggle, and Binder badges, so the
notebook they link to must exist. English pages point at
`examples/<slug>/notebook.ipynb`; Arabic, Spanish, and French pages point at
`notebook.ar.ipynb`, `notebook.es.ipynb`, and `notebook.fr.ipynb`.

Run `node scripts/generate-notebooks.mjs` after the Markdown is final. It
generates a missing English notebook from the English page and regenerates the
localized notebooks from each translated page. Commit the generated files with
the project.

## Credit and licence

The final section of a project page names its author with their contributor id
and states both licences:

- lesson text is CC BY 4.0;
- companion code is MIT.

Translators keep that section and name themselves as the translator. The full
policy is in [`../LICENSE-CONTENT.md`](../LICENSE-CONTENT.md).

Read [`../plan/guided-project-guide.md`](../plan/guided-project-guide.md) for
the full content specification. Use `npm run dev` to inspect every localized
page. All four languages belong in one pull request, and the generated
`src/lib/projectSlugs.data.json` belongs with them.
