# Guided-Project Content Guide (gold standard)

Every project in `src/content/projects/` that is part of the guided tier must
follow this exact structure. It is the single spec for rewriting the remaining
30 partial + 77 pitch-only EN projects (and, later, the 134-per-locale pitch
files). The gold reference is `src/content/projects/agentic-code-reviewer.md`.

## Why this shape

- **Setup before any Step.** A learner must be able to run **something** before
  step 1. `## Setup` comes first, always (site philosophy; see
  `plan/capstones.md`).
- **Short chunks of code + explanation.** Each step teaches one idea. Code
  blocks are 5–40 lines; each is followed by 2–6 sentences explaining *why*,
  not just *what*. No single code wall over ~50 lines without a checkpoint.
- **Gamified markers.** The shared `ProjectDetail.astro` turns every
  `## Step N:` (or `## Step N —`) heading into a click-to-clear tile
  (`recordProjectStep`, +15 XP) and the page bottom into a "Mark as done"
  button (`completeProject`, +100 XP). The ✅ checklists give the learner a
  concrete "I did it" trigger for each step.
- **Learner-first tone.** Second person, motivational, concrete. The learner can
  follow it with zero prior knowledge beyond its stated prerequisites.

## Required structure (in order)

```markdown
---
title: "Build a <Thing>"          # imperative, concrete
description: "One-sentence pitch: what you build + the one skill it teaches."
# optional frontmatter:
# difficulty: "beginner" | "intermediate" | "advanced"
# estimatedMinutes: 45
# xpReward: 100                    # display hint only; real award is XP.PROJECT_COMPLETE
# tags: ["cli", "data-viz"]
# learningObjectives: [...]
# prerequisites: [...]
---

# 🛠️ <Emoji> Build a <Thing>

2–4 sentence intro: the real-world problem, what the tool does, why it matters.

This assumes <prerequisites> — nothing beyond. Optional and ungraded; see
[Real-World Projects](/docs/projects) for the full list.

## 🎯 What you'll do

Numbered list, 4–6 items, present tense, outcomes ("capture a real git diff",
"build a system prompt that…").

## Where to run this

Options + the plain truth about where it shines (mirror agentic-code-reviewer):
primary path (local with uv, codespaces, etc.), the badges for Colab/Kaggle/
Binder pointing at `examples/<slug>/notebook.ipynb`, and an honest note about
which paths are "try it" vs "run it for real".

## Setup

Everything needed before a line of the real build: install tooling, scaffold
project, get keys — each with a short code chunk and explanation.

**✅ Checklist**

- ✅ <verifiable check 1>
- ✅ <verifiable check 2>
- ✅ <verifiable check 3>

## Step 1: <One Teachable Concept>

3–6 sentence setup paragraph: what the concept is and how it maps to the final
tool.

### 1.1 <Micro-step>

**👟 Starter hint:** <how to start, deliberately small>.

```python
# <short, complete, runnable chunk — 5–40 lines>
```

<2–6 sentences explaining the key line(s)/idea(s), why this shape, hidden
traps>.

**🎯 Expected output:** <exact observable result when it works>.

**🩹 If it's off:** <the two or three most likely failure modes + fixes>.

### 1.2 <Next micro-step> (repeat pattern)

### 1.3 Verify

**✅ Checklist**

- ✅ <verifiable check>
- ✅ <verifiable check>

**🤔 Socratic Question(s)**

- <open question forcing explanation, not regurgitation>
- <question about a design tradeoff or edge case>

## Step 2: <Next Concept> … (repeat)

> Each `## Step N:` header becomes a clickable step tile on the project page.
> Keep the count reasonable: 4–7 steps for beginner/intermediate, up to 8 for
> advanced. Every step ends with a **✅ Checklist** + **🤔 Socratic Question(s)**.

## ⚠️ Common pitfalls

Bulleted list of the 3–5 ways this build goes wrong in practice — each tied to
a concept in the steps, each with the fix.

## What you just built

2–4 sentence celebration of the concrete artifact + the transferable skill.

:::tip[Run a fuller version without any local setup]
Link to `examples/<slug>/` in the course repo + [GitHub Codespaces] path when
the project has a richer runnable version.
:::

## Where to go from here

2–4 concrete extensions, each a logical next feature, each with the tiny hint
that makes it feel achievable.

## Share your project with the class

Link to `examples/student-projects/` + the beginner-friendly PR walkthrough.
Close with an encouraging sign-off ("Welcome to writing Python outside the
browser. 🎓" style).
```

## Marker vocabulary (exact strings)

| Marker | Meaning | Required |
|---|---|---|
| `## 🎯 What you'll do` | Outcomes list before any build | ✅ |
| `## Where to run this` | Honest run-location guide + badges to notebook | ✅ |
| `## Setup` + `**✅ Checklist**` | Pre-build requisites, verifiable | ✅ |
| `## Step N:` | One teachable concept, click-to-clear tile | ✅ |
| `**👟 Starter hint:**` | Small first move for that step | ✅ per step |
| `**🎯 Expected output:**` | Observable "it works" signal | ✅ per step |
| `**🩹 If it's off:**` | Most likely failures + fixes | ✅ per step |
| `**✅ Checklist**` | Verifiable completion triggers | ✅ per step (end) |
| `**🤔 Socratic Question(s)**` | Explanation-forcing questions | ✅ per step (end) |
| `## ⚠️ Common pitfalls` | 3–5 real failure modes | ✅ |
| `## What you just built` | Recap + transferable skill | ✅ |
| `## Where to go from here` | 2–4 next features | ✅ |
| `## Share your project with the class` | Student-projects gallery + PR walkthrough | ✅ |

## Style rules

- **Code first, talk after.** Lead each micro-step with the chunk, then explain.
- **Complete, runnable chunks.** `import` what the chunk needs; no `...` or
  half-written functions except when a *deliberate* gap is the teaching move
  (name it).
- **Explain why, in 2–6 sentences.** After each chunk, no more than ~6
  sentences. Highlight the one or two lines that carry the idea.
- **Expected output is observable.** "prints X", "returns Y", "raises a clear
  error", never "should work".
- **"If it's off" is specific.** 2–3 named failures with named fixes, tied to
  the concepts just taught.
- **Socratic questions force reasoning.** No "what is X?" — instead "what would
  change about Y if you used Z instead?"
- **Prerequisites are honest.** Name the Python-101 / Data Analysis modules a
  learner needs; the "This assumes … nothing from Data Analysis is required"
  pattern is the model.
- **Difficulty from `projectArt.ts` when absent.** Frontmatter `difficulty` may
  be omitted; the route falls back to `projectDifficulty(slug)`.

## Notebook contract (`examples/<slug>/notebook.ipynb`)

Each guided project must ship a runnable notebook (`nbformat` 4.5) mirroring
the steps, handwritten (no generator), following the pattern in
`examples/agentic-code-reviewer/notebook.ipynb`:

- Markdown cells restate each `## Step N:` with its short intro.
- Code cells are the same chunks, in order, runnable end to end.
- Secrets/keyed chunks use `getpass()`/`!pip install` and an honest note when
  the notebook runs a fixed example instead of the learner's own data.
- Badges in "Where to run this" point at
  `examples/<slug>/notebook.ipynb`.

## Conversion checklist (pitch → guided)

- [ ] Add guided frontmatter (`difficulty`, `estimatedMinutes`, `tags`,
      `learningObjectives`, `prerequisites`) where missing.
- [ ] `## 🎯 What you'll do` list.
- [ ] `## Where to run this` with notebook badges.
- [ ] `## Setup` with its own `**✅ Checklist**`.
- [ ] 4–7 `## Step N:` each with `👟`/`🎯`/`🩹` and a closing `✅` + `🤔`.
- [ ] `## ⚠️ Common pitfalls`.
- [ ] `## What you just built` / `## Where to go from here` /
      `## Share your project with the class`.
- [ ] Ship `examples/<slug>/` + `examples/<slug>/notebook.ipynb`; badge links
      resolve.
- [ ] Zero dead `slug:` collisions (EN route normalizes legacy
      `slug: /projects/<name>`).