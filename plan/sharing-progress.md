# Sharing Progress (scoped back — dropped from the redesign)

The Docusaurus-era plan described a `ShareProgress` link + `/share` route, client-side "Download certificate" (html-to-image + jsPDF + qrcode), and per-student IDs. **None of that shipped in the Astro redesign** — no `ShareProgress`, no `/share` route, no certificate/QR libraries in `package.json`, and `public/robots.txt` still carries a stale `Disallow: /share` line from that era. Progress visibility now works differently:

- Students share results **by linking what exists**: each lesson/module/project has a permanent, locale-neutral URL, and notebooks are openable via `NotebookCell`'s Colab/Kaggle/nbviewer/Binder/Deepnote/GitHub badges — the shareable unit is the content itself, not a per-student read-only snapshot.
- The `/progress` page is the student's local "trail" (XP, streaks, quests, activity log) — visible only to the owning browser, no link to send.
- Cross-device/certificate sharing stays **deferred** (see [`deferred.md`](./deferred.md)): it needs server-side rendering of personalized preview images or a small verification service, which the fully-static no-backend architecture deliberately avoids.

If it returns, the original design is preserved in git history; the two cheap wins worth re-doing first are deleting the stale `/share` line from `robots.txt` and re-adding client-side rendering with dynamic imports so the heavy libs don't hit first load.