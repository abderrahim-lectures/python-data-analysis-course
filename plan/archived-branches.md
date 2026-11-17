# Archived branches — unported project drafts

> These eleven branches were written for the **Docusaurus** tree, before the
> Astro migration deleted `docs/`. Their project pages are complete drafts
> (329–611 lines of prose each) built on MDX components that no longer exist
> (`<ProjectGreeting>`, `<StepChecklist>`, `<ProjectProgressCheckbox>`), and
> their frontmatter uses the old `id`/`slug` shape rather than the current
> content-collection schema.
>
> Nothing here is lost. Each branch was deleted after being tagged, so the
> full history is one command away:
>
> ```bash
> git show archive/add-hybrid-search:docs/projects/hybrid-search/index.md
> git checkout -b my-port archive/add-hybrid-search
> ```
>
> **To port one**: copy the prose into `src/content/projects/<slug>.md`,
> drop every `import` and custom MDX element (the Astro pipeline supplies
> progress tracking, step checklists and the published date itself), rewrite
> the frontmatter to the current schema, and add `author:` so the
> contributors page credits it. The guide at /contributors-guide covers the
> file layout.

| Branch tag | Issue | Project | Draft |
|---|---|---|---|
| `archive/add-blog-post-generator` | #268 | Build an Outline→Blog Post Generator | 329 lines |
| `archive/add-bookmarks-semantic-search` | #272 | Build Semantic Search Over Your Browser Bookmarks | 393 lines |
| `archive/add-changelog-from-git` | #276 | Build a Changelog Generator from Git History | 329 lines |
| `archive/add-codebase-qa` | #274 | Build a Codebase Q&A Tool — Where Is X Implemented? | 428 lines |
| `archive/add-folder-knowledge-graph` | #278 | Turn a Folder of PDFs, Configs, and SQL Schemas Into a Queryable Knowledge Graph | 435 lines |
| `archive/add-github-repo-rag` | #270 | Build a RAG App Over a GitHub Repo | 474 lines |
| `archive/add-hybrid-search` | #286 | Build a Hybrid Search Demo (Keyword + Embedding) | 389 lines |
| `archive/add-journal-search` | #282 | Search and Summarize Your Own Journal | 406 lines |
| `archive/add-multihop-qa` | #285 | Build a Multi-Hop Question-Answering Tool Over a Small Wikipedia Sample | 611 lines |
| `archive/add-reranking-pipeline` | #280 | Build a Re-Ranking Pipeline | 399 lines |
| `archive/add-resume-tailor-agent` | #266 | Build a Resume & Cover-Letter Tailoring Agent | 344 lines |

The matching open issues are the place to coordinate — a port should reference
its issue the same way any other change does (see `plan/development-workflow.md`).
