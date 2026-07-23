# Student Agents

A gallery of agents students have built for the [Capstone Bonus](../../docs/bonus/2026-ai-agent/index.md) — browse the folders below to see what other students built, or add your own.

Each submission gets its own folder, named after you (or a project name), containing your `agent.py` and a short `README.md` explaining what it does. [`_template/`](./_template/) is a ready-to-copy starting point.

## Browsing what's here

Folders are added over time as students submit pull requests — just look through the subfolders in this directory on GitHub, or clone the repo and `ls examples/student-projects/`. Each one's `README.md` says what the agent's objective is and what tools it uses, so you can skim without running anything.

## Adding your own agent

You don't need any prior git experience for this — every step is below. If you get stuck, ask in the course's issue tracker; someone will help.

### 1. Fork the repository

Go to the [course repo on GitHub](https://github.com/abderrahim-lectures/python-data-analysis-course) and click the **Fork** button (top-right of the page). This makes your own copy of the repo under your GitHub account — you can't accidentally break anything in the original by working in your fork.

### 2. Clone your fork to your computer

On your fork's GitHub page, click the green **Code** button and copy the URL. Then, in a terminal:

```bash
git clone https://github.com/YOUR-USERNAME/python-data-analysis-course.git
cd python-data-analysis-course
```

(Replace `YOUR-USERNAME` with your actual GitHub username.)

### 3. Create a branch for your change

A branch is just a named, isolated place to make your changes without touching the main version yet:

```bash
git checkout -b add-my-agent
```

Pick any short, descriptive name instead of `add-my-agent` if you like (no spaces).

### 4. Copy the template and build your agent

```bash
cp -r examples/student-projects/_template examples/student-projects/your-name
```

Replace `your-name` with your actual name or a short project name (lowercase, hyphens instead of spaces — e.g. `amina-recipe-agent`). Then edit the two files inside your new folder:

- **`agent.py`** — your actual agent code. Start from the [capstone example](../capstone-agent/agent.py) and change the tools to do whatever you want it to do.
- **`README.md`** — fill in the template's sections: what your agent's objective is, which tools it has, and how to run it.

**Never commit a real API key.** Your `agent.py` should read it from an environment variable (e.g. `os.environ["GITHUB_TOKEN"]`), exactly like the capstone example — never paste a real key into any file you commit. Use whichever free-tier provider you like; the template defaults to GitHub Models, but the [Capstone Bonus doc](../../docs/bonus/2026-ai-agent/index.md#step-2-get-a-free-ai-api-key) lists other options.

### 5. Save your changes with git

```bash
git add examples/student-projects/your-name
git commit -m "Add my capstone agent"
```

`git add` stages the files you want to save; `git commit` actually saves that snapshot, with a short message describing what you did.

### 6. Push your branch to your fork

```bash
git push origin add-my-agent
```

This uploads your branch (and its commit) to your fork on GitHub.

### 7. Open a Pull Request

Go back to your fork's page on GitHub — you'll usually see a banner offering to "Compare & pull request" for the branch you just pushed. Click it (or go to the **Pull requests** tab and click **New pull request**). Make sure it's comparing your branch against the *original* course repo's `main` branch, write a short title and description, and click **Create pull request**.

That's it — your submission is now visible to the maintainers (and, once merged, to every other student browsing this folder). Someone may leave comments asking for small changes before it merges; that's normal and not a rejection.

### Keeping your fork up to date (optional, for later)

If you want to submit more than one agent over time, your fork can drift behind the original repo. To catch up:

```bash
git checkout main
git pull https://github.com/abderrahim-lectures/python-data-analysis-course.git main
git push origin main
```

Then start a new branch (step 3) for your next change.
