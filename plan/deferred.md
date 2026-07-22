# Deliberately deferred (flagged, not built in this pass)
- **Real push notifications while away from the site** (Duolingo-style) — would need a minimal server component (scheduled job + Web Push/VAPID) that this plan's fully-static architecture deliberately doesn't include; `WelcomeBackBanner`'s on-visit nudge is the chosen no-infrastructure alternative.
- **Docusaurus versioned docs** if the course gets re-run for a future cohort and old content needs to stay addressable — not needed for a first run.
