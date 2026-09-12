# Professional Course Improvement Plan

> **Status:** this is the original improvement plan that motivated the redesign. It describes the *Docusaurus-era* site (Monaco inline editor + JupyterLite FAB) as "current". The redesign moved the site to **Astro with inline Pyodide runnable cells** — see [`astro-rebuild.md`](./astro-rebuild.md) for the current architecture and what superseded each item below (most of the editor/playground gaps it catalogs were resolved by the inline-cell runtime + `/playground` page).

> **Pattern sources:** This plan draws on patterns from the `research-ideas` repo's skill system — particularly `conceptual-framework-design` (framework rigor), `lifelong-learning` (mistake memory + strategy capture), `adversarial-review` (honest review gates), `grilling` (pre-commitment stress-testing), and `wait-what` (plain-language re-explanation). These are adapted from research/workflow skills into course-design improvements.

## Executive Summary

This plan addresses three critical gaps in the current course design that directly impact beginner retention:

1. **No guided onboarding to the web editor** — absolute beginners face the editor cold, with no walkthrough of how to type, run, and debug code in the browser
2. **JupyterLite UI is not localized** — while lesson content is translated, the JupyterLite notebook/REPL interface remains in English, breaking immersion for Arabic/Spanish/French learners
3. **Missing beginner-safety patterns** — no progressive disclosure of editor features, no error recovery guidance, and no "first success" guarantee within 2 minutes of opening the course

### Key design principles (borrowed from research-ideas skills)

| Principle | Source | Application here |
|-----------|--------|-----------------|
| **Every criticism must be specific and located** | `adversarial-review` | Error messages name the exact line and the exact mistake, not generic "something went wrong" |
| **Name every excluded boundary explicitly** | `conceptual-framework-design` | The tutorial explicitly says what the editor does NOT do (no file management, no package install) so beginners don't worry about invisible complexity |
| **Explain to your future self why it works** | `lifelong-learning` | Every challenge answer explains WHY, not just WHAT — the Socratic questions already do this; extend it to error hints |
| **Facts vs. decisions** | `grilling` | Tutorial separates "this is how the editor works" (fact) from "choose your track" (decision) — never mix them |
| **Mistake memory** | `lifelong-learning` | The "Stuck?" panel captures common mistakes per week, growing over time as real student data comes in |
| **Pointers, not copies** | `handoff` | The tutorial links to lesson sections for deeper explanation, doesn't duplicate content |

---

## Part 0: Web Editor & Pyodide — How It All Works

### What the Student Sees

When a student opens any lesson page, the screen splits into two areas:

```
┌─────────────────────────────┬─────────────────────────────┐
│                             │  pyda-course · Playground    │
│     LESSON CONTENT          │  ┌───┬───┬───┐              │
│     (markdown, math,        │  │ ● │ ◑ │ ◑ │  main.py    │
│      challenges, etc.)      │  ├───┴───┴───┤  [Run ▶]    │
│                             │  │           │              │
│                             │  │  EDITOR   │  (Monaco)    │
│                             │  │           │              │
│                             │  │           │              │
│                             │  ├───────────┤              │
│                             │  │ TERMINAL  │  (Pyodide)   │
│                             │  │           │              │
│                             │  └───────────┘              │
│                             │  Python 3.12 · Pyodide(WASM)│
└─────────────────────────────┴─────────────────────────────┘
```

- **Left side:** the lesson you're reading (text, math formulas, challenges)
- **Right side:** a VS Code-style panel with two zones:
  - **Editor (top):** where you type Python code — this is the Monaco code editor, the same editor that powers VS Code in the browser. It provides syntax highlighting, auto-indent, and bracket matching — all running locally, no server needed.
  - **Terminal (bottom):** where output and errors appear after you click Run. Styled like a real terminal window.

On **mobile** (phone screens), the editor panel is hidden by default. A floating "❯ Open editor" button at the bottom-right opens it **full-screen** — the entire phone screen becomes the editor, because a tiny split-view would be unusable on a 375px-wide display.

### What Is Pyodide? (The "Magic" Behind It)

Pyodide is a full CPython interpreter compiled to WebAssembly (WASM) — it runs **inside your browser**, not on a server. When you click "Run":

1. The code you typed in the Monaco editor is sent to Pyodide
2. Pyodide executes it using a real Python 3.12 runtime that lives in your browser's memory
3. Any `print()` output or errors are sent back to the terminal panel
4. Variables persist between runs — like a real Python REPL, if you set `x = 5` and then run `print(x)` in a separate Run, it works

**Why this matters for beginners:**
- **Zero setup:** no Python install, no terminal command, no account needed
- **Works offline:** after the first load (~10 MB), the Python runtime is cached by your browser and works without internet
- **Safe to experiment:** you can't break anything — if code fails, you just fix it and Run again
- **Real Python:** this isn't a toy simulator — it's the actual Python language, including `import`, `for` loops, functions, and (in Section 2) pandas, matplotlib, and numpy

**First-load cost:** The first time you click Run on a new device, Pyodide downloads ~10 MB (the Python runtime + standard library). This takes 5-15 seconds on Wi-Fi, longer on mobile data. After that, it's cached and loads in under 1 second. The editor shows a progress message during this first load so you know it's working.

### The Editor (Monaco) — What You Can Do

The Monaco editor is the same code editor that powers Visual Studio Code. Here's what you need to know:

| Action | How |
|--------|-----|
| **Type code** | Click in the editor area and start typing |
| **Run code** | Click the **▶ Run** button in the top-right of the panel, or press **Ctrl+Enter** (Cmd+Enter on Mac) |
| **Clear & start over** | Select all text (Ctrl+A), delete, and type new code |
| **Auto-indent** | Press Enter — Python indentation is handled automatically |
| **Bracket matching** | Type a `(` or `[` and the closing bracket highlights when you type it |

**What you DON'T need to worry about:**
- Saving files — your code is kept in browser memory; you don't need to save anything
- File paths — there's just one `main.py`, no folders to manage
- Installing packages — Pyodide handles `import` automatically (pandas, numpy, etc. are loaded on demand)

### The Terminal — Reading Output and Errors

The terminal panel (bottom half) shows two things:

**1. Output** (what your code prints):
```
$ python main.py
Hello, World!
Your score is 87.5%
```

**2. Errors** (when something goes wrong):
```
$ python main.py
TypeError: can only concatenate str (not "int") to str
```

Errors include a **friendly explanation** below the raw message (new in this plan — see Part 3), so you don't need to understand Python tracebacks to fix your code.

### How Pyodide Handles `input()`

`input()` works differently in the browser than in a real terminal. When your code calls `input("What's your name? ")`:

1. A browser prompt dialog appears at the top of the page
2. You type your answer in the dialog
3. The value is passed back to your Python code

This is a known limitation of the in-browser environment — it can't show a custom inline prompt the way a real terminal would. The browser prompt is functional but less polished. **This is only relevant for Week 1** (which covers `input()`); from Week 2 onward, most exercises use pre-defined variables, not interactive input.

### How JupyterLite Differs (Section 2)

In **Section 2: Data Analysis**, the editor panel switches from the Monaco editor to **JupyterLite** — a full Jupyter Notebook environment running in the browser. Key differences:

| Feature | Monaco Editor (Section 1) | JupyterLite Notebook (Section 2) |
|---------|--------------------------|----------------------------------|
| Interface | Single code file (`main.py`) | Notebook with cells |
| Run code | Click Run button | Click ▶ next to a cell, or Shift+Enter |
| Output | Appears in terminal panel | Appears below each cell |
| Persistence | In-memory, resets on page reload | IndexedDB — saved automatically |
| Best for | Simple scripts, learning syntax | Data analysis, plots, pandas |

JupyterLite also has its own toolbar (File, Edit, View, Run, etc.) which will be localized to match the course language (see Part 2).

### Problem

Week 1 drops students into a Monaco editor + Pyodide terminal with zero guidance on:
- How to type code in the editor pane
- How to click "Run" and see output
- What the terminal panel is and why output appears there
- How to recover when code fails (the most common dropout trigger)

Research from CS50, Udemy's beginner courses, and UX onboarding best practices shows that **learners who don't achieve their first successful code execution within 2 minutes are 3x more likely to abandon the course**.

### Solution: Interactive Editor Walkthrough Component

Create a `EditorTutorial` component that appears **only on the first lesson page visited** (tracked via `pda-course:editor-tutorial-seen` in localStorage). It uses a step-by-step coach-mark pattern (like GitHub's product tours) overlaid on the actual editor:

```
Step 1: "This is your code editor — type Python here"
        [highlight: Monaco editor pane]
        
Step 2: "Click Run to execute your code"
        [highlight: Run button]
        
Step 3: "Your output appears here in the terminal"
        [highlight: Terminal panel]
        
Step 4: "Try it! Type: print('Hello, World!')" 
        [pre-filled code, guided run]
        
Step 5: "Nice! You just ran Python in your browser."
        [dismiss tutorial, mark complete]

Step 6 (on error): "Don't worry — errors are normal!"
        "When something goes wrong, Python shows an error message in red.
         Read the last line — it tells you what went wrong and where.
         Fix your code and click Run again. That's how programming works."
        [Got it →]
```

#### What Each Step Teaches

| Step | Skill learned | Why it matters |
|------|--------------|----------------|
| 1 | Locate the editor | Know where to type |
| 2 | Find and click Run | Know how to execute |
| 3 | Read the terminal | Know where output appears |
| 4 | Run pre-filled code | First success — proves the system works |
| 5 | Mental model complete | Understand the type → run → read cycle |
| 6 | Error is normal | Normalize failure as part of learning |

#### Why Step 6 matters (from `lifelong-learning`)

The `lifelong-learning` skill's core insight is: **mistakes must be captured immediately, not later**. Step 6 applies this to beginners: the moment they see an error, the tutorial explains it's normal AND shows them how to recover. Without this, the first error becomes a dropout trigger instead of a learning moment.

The tutorial also seeds the "mistake memory" pattern: after the student dismisses the tutorial, the `StuckHelp` panel (Part 3, Solution C) captures the most common errors for that week, growing over time as real student data accumulates — exactly like `ledger/lessons-learned.md` in the research-ideas repo.

### Implementation Details

**New component:** `src/components/EditorTutorial/index.tsx`
- Uses `react-joyride` or a lightweight custom coach-mark system (CSS + absolute positioning)
- Steps are anchored to DOM elements via `data-tutorial-target` attributes on `VsCodePlayground`'s existing elements
- Steps are translatable via `<Translate>` (all 4 locales)
- localStorage key: `pda-course:editor-tutorial-seen` — once dismissed, never shown again
- On mobile: steps render as a bottom-sheet overlay (not a floating tooltip that obscures the editor)
- On desktop: steps render as anchored callouts pointing at the relevant UI element

**Modified components:**
- `src/components/VsCodePlayground/index.tsx` — add `data-tutorial-target` attributes to:
  - `data-tutorial-target="editor"` on the MonacoPane container
  - `data-tutorial-target="run-button"` on the Run button
  - `data-tutorial-target="terminal"` on the terminal container
- `src/components/VsCodePlayground/PyodideTerminal.tsx` — add `data-tutorial-target="terminal"` to terminal body

**Modified content:**
- `docs/python-101/normal/week-1.md` — add a `:::tip[First time here?]` admonition at the very top (before Learning Objectives) linking to the tutorial:
  ```markdown
  :::tip[First time here?]
  This course runs Python right in your browser — no install needed. 
  **[Take a 30-second tour of the editor →](#editor-tutorial)**
  :::
  ```
  This admonition is hidden on subsequent weeks (via the same localStorage check).

**New content pattern addition** (update `plan/content-pattern.md`):
```markdown
6. **Editor tutorial (Week 1 only, both tracks)** — a one-time interactive 
   walkthrough of the code editor, shown on first lesson visit, dismissed 
   permanently after completion. Ensures every student achieves their first 
   successful `print("Hello")` within 2 minutes of opening the course.
```

### Acceptance Criteria

- [ ] A new student on Week 1 sees the tutorial within 1 second of the editor loading
- [ ] Tutorial completes in ≤60 seconds for a fast reader, ≤3 minutes for a careful one
- [ ] After completing the tutorial, student has successfully run `print("Hello, World!")`
- [ ] Tutorial never reappears once dismissed (survives page navigation and browser reload)
- [ ] Tutorial is fully translated in all 4 locales
- [ ] Tutorial works on mobile (375px viewport) without obscuring the editor
- [ ] Returning students who already saw the tutorial are never prompted again

---

## Part 2: JupyterLite UI Localization

### Problem

JupyterLite (the notebook/REPL UI) has its own i18n system via JupyterLab language packs, but the current deployment ships with English-only UI. This means:
- Arabic students see Arabic lesson content but an English JupyterLite toolbar/menu
- The language mismatch creates cognitive dissonance and undermines the professional feel
- Students who don't read English may not understand JupyterLite's menu options (File, Edit, View, Run, etc.)

### Solution: Install JupyterLite Language Packs

JupyterLite supports localization natively via `jupyterlab-language-pack-*` packages. The build configuration (`jupyterlite-config/jupyter_lite_config.json`) needs to include these packs.

**Changes to `jupyterlite-config/`:**

1. Update `requirements.txt` (or create one if it doesn't exist):
```
jupyterlite-core[translation]
jupyterlab-language-pack-fr-FR
jupyterlab-language-pack-es
jupyterlab-language-pack-ar
jupyterlab_server
```

2. Update `jupyter_lite_config.json` to ensure translation is not ignored:
```json
{
  "LiteBuildConfig": {
    "ignore_sys_prefix": []
  }
}
```

3. **Pass the student's locale to the JupyterLite iframe** via the URL query parameter. JupyterLite respects the `?locale=fr-FR` parameter to override the display language. Modify `JupyterLiteEmbed.tsx` to read the current Docusaurus locale and pass it:

```tsx
// In JupyterLiteEmbed.tsx
import {useCurrentLocale} from '@docusaurus/theme-common';

const locale = useCurrentLocale();
// Map Docusaurus locale codes to JupyterLite locale codes
const LOCALE_MAP: Record<string, string> = {
  en: 'en-US',
  ar: 'ar',
  es: 'es',
  fr: 'fr-FR',
};
const jupyterLocale = LOCALE_MAP[locale] ?? 'en-US';
const src = mode === 'repl' 
  ? `${replSrc}?locale=${jupyterLocale}`
  : `${notebookSrc}?locale=${jupyterLocale}`;
```

4. **Add a locale-aware loading message** in `JupyterLiteEmbed.tsx`:
```tsx
const loadingMessages: Record<string, string> = {
  en: 'Loading the Python environment — first load can take a moment, faster on Wi-Fi.',
  ar: 'جاري تحميل بيئة Python — قد يستغرق التحميل الأول لحظة، أسرع عبر Wi-Fi.',
  es: 'Cargando el entorno de Python — la primera carga puede tardar un momento, es más rápida por Wi-Fi.',
  fr: 'Chargement de l\'environnement Python — le premier chargement peut prendre un moment, plus rapide en Wi-Fi.',
};
```

### Acceptance Criteria

- [ ] JupyterLite REPL toolbar/menu renders in Arabic when the course locale is Arabic
- [ ] JupyterLite Notebook toolbar/menu renders in Spanish when the course locale is Spanish
- [ ] JupyterLite toolbar/menu renders in French when the course locale is French
- [ ] Loading message appears in the correct language
- [ ] No increase in bundle size for the English locale (language packs are lazy-loaded)
- [ ] RTL layout in JupyterLite works correctly for Arabic (toolbar mirrors, etc.)

---

## Part 3: Beginner-Safety Patterns

### Problem

Absolute beginners face several friction points that cause dropout:
1. **Error messages are intimidating** — Pyodide's tracebacks look like developer errors
2. **No "safe failure" pathway** — when code fails, students don't know what to do next
3. **No progress scaffolding** — the jump from "type print('hi')" to "write a tip calculator" is too steep
4. **No contextual help** — students must leave the lesson to search for help when stuck

### Solution A: Friendlier Error Messages

**Modified component:** `src/components/VsCodePlayground/PyodideTerminal.tsx`

Add an error prettifier that catches common beginner errors and replaces intimidating tracebacks with friendly guidance. **Design principle from `adversarial-review`: every criticism must be specific and located** — the error message names the exact mistake, not a vague "something went wrong."

```tsx
const BEGINNER_ERROR_HELP: Record<string, {friendly: string; hint: string; example: string}> = {
  'SyntaxError: invalid syntax': {
    friendly: 'Python can\'t understand that line.',
    hint: 'Check for missing colons (:), unmatched parentheses, or quotes.',
    example: '# Wrong:\nif x > 5\n# Right:\nif x > 5:',
  },
  'TypeError: can only concatenate str': {
    friendly: 'You\'re trying to add text and a number together.',
    hint: 'Use int() or float() to convert the number first.',
    example: '# Wrong:\nprint("Score: " + 87)\n# Right:\nprint("Score: " + str(87))',
  },
  'NameError: name \'...\' is not defined': {
    friendly: 'Python doesn\'t recognize that name.',
    hint: 'Did you spell it correctly? Names are case-sensitive (score ≠ Score).',
    example: '# "age" was never created:\nage = int(input("Age? "))',
  },
  'IndentationError: unexpected indent': {
    friendly: 'This line has extra spaces at the start.',
    hint: 'Python uses indentation to group code. Only indent after : (colon).',
    example: '# Wrong:\n  print("hello")\n# Right:\nprint("hello")',
  },
  'ZeroDivisionError: division by zero': {
    friendly: 'You tried to divide by zero.',
    hint: 'Check if the denominator could be 0 before dividing.',
    example: '# Wrong:\nresult = 10 / 0\n# Right:\nif divisor != 0:\n    result = 10 / divisor',
  },
  // ... 10-15 most common beginner errors
};
```

When an error matches, the terminal renders:
1. **The friendly message** (what went wrong, in plain language)
2. **A "Try this" hint** (how to fix it)
3. **An example** (showing wrong → right code)
4. **The full traceback** in a collapsible `<details>` for students who want to learn to read it

This follows the `adversarial-review` principle: **"Theorem 4.2 assumes char k = 0 but Lemma 3.1 needs char k ≠ 2"** is useful; "the proof could be clearer" is not. Similarly, "You're trying to add text and a number" is useful; "Error occurred" is not.

### Solution B: Progressive Complexity in Week 1

**Modified content:** `docs/python-101/normal/week-1.md`

Restructure the Lesson section to follow a "micro-steps" pattern:

```
Step 1: Open the editor (tutorial handles this)
Step 2: Type: print("Hello") → Run → See "Hello"  
Step 3: Type: x = 5 → Run → (nothing happens — that's OK!)
Step 4: Type: print(x) → Run → See "5"
Step 5: Type: x = x + 1 → print(x) → See "6"
Step 6: Now try the Challenges
```

Each micro-step has:
- A one-sentence instruction
- A pre-fillable code snippet (via `starterCode` mechanism)
- A "Run this" prompt
- An expected output shown after a 2-second delay (or on click)

This is NOT a separate tutorial — it's the lesson itself, restructured so the first 5 minutes are guaranteed-success interactions before any abstract concepts.

### Solution C: "Stuck?" Help Panel

**New component:** `src/components/StuckHelp/index.tsx`

A collapsible panel that appears at the bottom of every lesson page (below the quiz), containing:
1. **"Common mistakes this week"** — curated list of the 3-5 most frequent errors students hit, with fixes
2. **"Still stuck? Try these:"** — links to:
   - The relevant Challenge answer (if they're stuck on a specific one)
   - A Stack Overflow search pre-filled with the error message
   - The course's GitHub Discussions (if enabled)
3. **"Report a bug"** — link to open a GitHub issue pre-filled with the page URL and error

This panel is always visible (not gated behind anything) and uses the `:::info[Stuck?]` admonition style for consistency.

### Solution D: "First Success" Guarantee Component

**New component:** `src/components/FirstSuccess/index.tsx`

A one-time celebration that fires the FIRST time a student successfully runs code in the editor (tracked via `pda-course:first-success` in localStorage). It shows:

```
🎉 You just ran Python! 
No install. No setup. Just you and code.
[Continue to the lesson →]
```

This fires ONCE in the student's entire course lifetime, on whichever page they first run code. It's a small psychological win that confirms "I can do this" — the most important moment in beginner retention.

---

## Part 4: Professional Polish Improvements

### 4.1 Enhanced Onboarding Flow

**Current flow:** Welcome → LearningStylePicker (name + gamified/classical) → Section page → Track choice → Week 1

**Improved flow:** Welcome → LearningStylePicker → **Editor Tutorial (first lesson only)** → Section page → Track choice → Week 1 with micro-steps

The key change: the editor tutorial is triggered by the first lesson visit, not the onboarding modal. This keeps onboarding lightweight (just name + style) and defers the editor tour to the moment it's actually needed.

### 4.2 Improved Welcome Page

**Modified:** `src/pages/index.tsx`

Add a "How it works" section between the hero and the section cards:

```tsx
function HowItWorks() {
  return (
    <section className={styles.howItWorks}>
      <Heading as="h2">How this course works</Heading>
      <div className={styles.howItWorksGrid}>
        <HowItWorksCard 
          icon="💻"
          title="Code in your browser"
          description="No installs needed. Type Python, click Run, see results instantly."
        />
        <HowItWorksCard 
          icon="📱"
          title="Works on your phone"
          description="Designed for mobile-first. Learn anywhere, anytime."
        />
        <HowItWorksCard 
          icon="🎮"
          title="Choose your path"
          description="Normal track for fundamentals, Hard track for a challenge."
        />
        <HowItWorksCard 
          icon="🏆"
          title="Track your progress"
          description="Badges, quizzes, and a certificate when you finish."
        />
      </div>
    </section>
  );
}
```

### 4.3 Loading State Improvements

**Modified:** `src/components/VsCodePlayground/JupyterLiteEmbed.tsx`

Replace the generic loading message with a progress-aware one:

```tsx
const [loadPhase, setLoadPhase] = useState<'idle' | 'downloading' | 'booting' | 'ready'>('idle');

// Show phase-specific messages:
// downloading: "Downloading Python (10 MB) — this only happens once..."
// booting: "Starting Python engine..."
// ready: (hide loading overlay)
```

This gives students visibility into what's happening, reducing anxiety during the 5-15 second first-load.

### 4.4 Error Recovery Quick-Actions

**Modified:** `src/components/VsCodePlayground/PyodideTerminal.tsx`

When an error is detected, show a quick-action bar below the error:

```
❌ TypeError: unsupported operand type(s) for +: 'int' and 'str'

💡 You're trying to add a number and text. Try: int("42") to convert.

[🔄 Reset code]  [📖 See this in the lesson]  [🔍 Search for this error]
```

- "Reset code" reverts the editor to the week's starter code
- "See this in the lesson" scrolls to the relevant section (if the error matches a known pitfall)
- "Search" opens a pre-filled Google/Stack Overflow search

---

## Part 5: Implementation Priority

| Priority | Change | Effort | Impact |
|----------|--------|--------|--------|
| **P0** | Editor Tutorial component | 2-3 days | Critical — directly prevents beginner dropout |
| **P0** | Week 1 micro-steps restructure | 1 day | Critical — ensures first success within 2 minutes |
| **P1** | JupyterLite language packs | 0.5 day | High — completes the i18n promise |
| **P1** | Friendlier error messages | 1-2 days | High — reduces intimidation |
| **P1** | FirstSuccess celebration | 0.5 day | High — psychological win |
| **P2** | "How it works" homepage section | 0.5 day | Medium — sets expectations |
| **P2** | "Stuck?" help panel | 1 day | Medium — reduces friction |
| **P2** | Error recovery quick-actions | 1 day | Medium — speeds up debugging |
| **P3** | Loading phase progress | 0.5 day | Low — reduces anxiety |

---

## Part 6: Testing Checklist

- [ ] New student (no localStorage) opens Week 1 Normal → tutorial appears
- [ ] Tutorial completes successfully → never appears again
- [ ] Student runs `print("Hello")` within 2 minutes of first visit
- [ ] Student sees FirstSuccess celebration on first code execution
- [ ] JupyterLite shows Arabic UI when locale is `ar`
- [ ] JupyterLite shows French UI when locale is `fr`
- [ ] JupyterLite shows Spanish UI when locale is `es`
- [ ] Error message for `int("hello")` shows friendly guidance, not raw traceback
- [ ] "Stuck?" panel is visible on every lesson page
- [ ] "How it works" section renders on homepage
- [ ] All new components are translatable (4 locales)
- [ ] Mobile (375px): tutorial is usable, editor is reachable, JupyterLite is full-screen
- [ ] Lighthouse performance score remains ≥90 on mobile
- [ ] Returning student (with localStorage) does NOT see tutorial again

---

## Part 7: Evidence-Based Improvements (from 2025-2026 Research)

### 7.1 Adaptive Gamification (reduces dropout by 64.7%)

**Research:** Khatri (2026) found that adaptive gamification reduced dropout from 34% to 12% in introductory programming courses. The key mechanism: **dynamic task difficulty, feedback scaffolding, and motivational incentives adapted to each learner's profile**.

**Application to this course:**

The current gamification system (badges, quizzes, bonus content) is **static** — every student gets the same challenges at the same difficulty. Research shows this causes:
- **Novices**: cognitive overload, frustration, dropout
- **Experienced students**: boredom, disengagement, dropout

**Proposed adaptive layer:**

```tsx
// New component: src/components/AdaptiveDifficulty/index.tsx
// Tracks student performance and adjusts challenge difficulty

interface StudentProfile {
  weekId: string;
  quizScore: number;
  challengeAttempts: number;
  timeOnTask: number; // seconds
  errorRate: number;
}

// If student passes quiz on first try → offer harder challenges
// If student fails quiz → offer scaffolded hints before challenges
// If student takes >10min on a challenge → offer a worked example
```

This is NOT a separate system — it's an enhancement to the existing `Challenge` and `WeeklyQuiz` components that uses the same `localStorage` data.

### 7.2 Time-to-Value Under 2 Minutes

**Research:** SaaS onboarding best practices (2026) show that onboarding accounts for 30-50% of churn variance. Target time-to-value: under 5 minutes. For coding courses, the equivalent is: **first successful code execution within 2 minutes of opening the course**.

**Current gap:** The editor tutorial is good, but it's not guaranteed to complete within 2 minutes. The first-load Pyodide download (5-15 seconds) eats into this budget.

**Proposed solution:**

1. **Pre-warm Pyodide on homepage** — when the student lands on the homepage (before they click "Start Python 101"), begin downloading Pyodide in the background. By the time they complete onboarding and reach Week 1, Pyodide is already loaded.

```tsx
// In src/pages/index.tsx, add a hidden iframe or service worker prefetch:
useEffect(() => {
  // Pre-warm Pyodide on homepage visit
  const link = document.createElement('link');
  rel = 'prefetch';
  href = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.mjs';
  document.head.appendChild(link);
}, []);
```

2. **Show a "While Python loads..." micro-lesson** — instead of a blank loading screen, show a 30-second animated explanation of what Pyodide is and why it takes a moment on first load. This turns dead time into learning time.

### 7.3 Progress Bars Everywhere

**Research:** Progress bars increase completion rates by 30-50%. The current course has progress tracking but doesn't show a persistent progress bar during the onboarding flow.

**Proposed changes:**

1. **Add a progress bar to the editor tutorial** — "Step 2 of 6" with a visual bar
2. **Add a progress bar to Week 1** — "You've completed 3 of 5 micro-steps"
3. **Add a progress bar to the placement quiz** — "Question 4 of 8"

### 7.4 Contextual Tooltips (not scheduled tours)

**Research:** Contextual tooltips generate 4x higher engagement than linear overlay tours. The current editor tutorial is a scheduled tour (fires on page load). Research shows this causes users to dismiss all guidance on the first screen and never see it again.

**Proposed change:**

Instead of a full-screen tutorial overlay, use **contextual hotspots** that appear only when the student reaches a relevant moment:

- **First time student clicks in the editor**: tooltip says "Type Python code here"
- **First time student clicks Run**: tooltip says "Your output will appear in the terminal below"
- **First time student sees an error**: tooltip says "Read the last line — that's what went wrong"

This is more like GitHub's product tour (contextual) than Duolingo's (scheduled).

### 7.5 Micro-Survey for Track Selection

**Research:** Personalization based on user role/intent lifts 7-day retention by 35%. The current track selection is a comparison table. Research shows a 2-3 question micro-survey before track selection improves outcomes.

**Proposed addition to onboarding:**

```tsx
// After LearningStylePicker, before track selection:
<MicroSurvey
  questions={[
    {
      q: "Have you ever written code before?",
      options: ["No, this is my first time", "A little (HTML/CSS)", "Yes, I know some Python"],
    },
    {
      q: "How do you learn best?",
      options: ["Step by step, with examples", "By building something real", "By reading and thinking"],
    },
  ]}
  onResult={(profile) => {
    // Recommend a track based on answers
    // Store in localStorage for future personalization
  }}
/>
```

### 7.6 Error Messages with Links to Lesson Content

**Research:** Developer onboarding best practices (Skene, 2026) show that "specific error messages with links to docs" reduce support burden and frustration. The current error prettifier shows a friendly message but doesn't link to the relevant lesson section.

**Proposed enhancement:**

```tsx
const BEGINNER_ERROR_HELP: Record<string, {
  friendly: string;
  hint: string;
  example: string;
  lessonLink?: string; // NEW: link to relevant lesson section
}> = {
  'SyntaxError: invalid syntax': {
    friendly: 'Python can\'t understand that line.',
    hint: 'Check for missing colons (:), unmatched parentheses, or quotes.',
    example: '# Wrong:\nif x > 5\n# Right:\nif x > 5:',
    lessonLink: '/docs/python-101/normal/week-2#if-statements', // Week 2 covers if/else
  },
  // ...
};
```

The error message now shows: "📖 See this in the lesson" which scrolls to the relevant section.

### 7.7 "Still Stuck?" Escalation Path

**Research:** The `wait-what` skill from research-ideas applies here: when a student says "I don't understand," the system should re-explain with the missing premise restored, using the vocabulary already established.

**Proposed component:**

```tsx
// src/components/StillStuck/index.tsx
// Appears after 3 failed attempts on the same challenge

<StillStuck
  challengeId="python101-normal-w1-c3"
  errorHistory={[
    'TypeError: can only concatenate str (not "int") to str',
    'TypeError: can only concatenate str (not "int") to str',
  ]}
/>
// Shows:
// 1. "You've tried this 3 times. Let's break it down."
// 2. The challenge broken into 3 micro-steps
// 3. A worked example for the first micro-step
// 4. Links to similar challenges that were easier
```

---

## Part 8: Implementation Priority (updated with research evidence)

| Priority | Change | Effort | Impact | Research basis |
|----------|--------|--------|--------|----------------|
| **P0** | Editor Tutorial (contextual, not scheduled) | 2-3 days | Critical | SaaS onboarding: 30-50% churn variance |
| **P0** | Week 1 micro-steps with progress bar | 1 day | Critical | Progress bars: +30-50% completion |
| **P0** | Pre-warm Pyodide on homepage | 0.5 day | Critical | Time-to-value <2min target |
| **P1** | JupyterLite language packs | 0.5 day | High | Completes i18n promise |
| **P1** | Friendlier error messages with lesson links | 1-2 days | High | Developer onboarding: specific errors |
| **P1** | FirstSuccess celebration | 0.5 day | High | Psychological win moment |
| **P1** | Adaptive difficulty layer | 2-3 days | High | Adaptive gamification: -64.7% dropout |
| **P2** | "How it works" homepage section | 0.5 day | Medium | Expectations setting |
| **P2** | "Stuck?" help panel | 1 day | Medium | wait-what: re-explain with missing premise |
| **P2** | Error recovery quick-actions | 1 day | Medium | Developer onboarding: speed to first success |
| **P2** | Micro-survey for track selection | 1 day | Medium | Personalization: +35% 7-day retention |
| **P3** | Loading phase progress | 0.5 day | Low | Reduces anxiety |

---

## Appendix: File Changes Summary

### New files
- `src/components/EditorTutorial/index.tsx` — interactive walkthrough
- `src/components/EditorTutorial/styles.module.css`
- `src/components/FirstSuccess/index.tsx` — first-run celebration
- `src/components/FirstSuccess/styles.module.css`
- `src/components/StuckHelp/index.tsx` — contextual help panel
- `src/components/StuckHelp/styles.module.css`
- `src/components/StillStuck/index.tsx` — escalation after3 failed attempts
- `src/components/StillStuck/styles.module.css`
- `src/components/AdaptiveDifficulty/index.tsx` — dynamic challenge difficulty
- `src/components/MicroSurvey/index.tsx` — track selection survey

### Modified files
- `src/components/VsCodePlayground/index.tsx` — add `data-tutorial-target` attrs
- `src/components/VsCodePlayground/PyodideTerminal.tsx` — error prettifier + recovery actions + lesson links
- `src/components/VsCodePlayground/JupyterLiteEmbed.tsx` — locale passthrough + loading phases
- `src/pages/index.tsx` — "How it works" section + Pyodide pre-warm
- `docs/python-101/normal/week-1.md` — tutorial tip admonition + micro-steps
- `docs/python-101/hard/week-1.md` — same tutorial tip
- `plan/content-pattern.md` — add step 6 (editor tutorial)
- `jupyterlite-config/requirements.txt` — add language packs
- `jupyterlite-config/jupyter_lite_config.json` — ensure translation enabled

### New localStorage keys
- `pda-course:editor-tutorial-seen` — boolean, tracks tutorial completion
- `pda-course:first-success` — boolean, tracks first successful code execution
- `pda-course:student-profile` — object, stores micro-survey results for personalization
- `pda-course:error-history` — array, tracks error patterns for adaptive hints
