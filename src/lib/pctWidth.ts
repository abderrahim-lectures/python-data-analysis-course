// Sets a progress-bar fill width via the .w-pct-N classes in global.css
// instead of el.style.width. CSP's style-src can't allow-list an inline
// style with a hash when the value changes at runtime (a hash only matches
// one exact string), so every fill-width update in the app goes through
// this instead of a direct style mutation.
export function setPctWidth(el: Element | null, pct: number): void {
  if (!el) return;
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  for (const cls of Array.from(el.classList)) {
    if (cls.startsWith('w-pct-')) el.classList.remove(cls);
  }
  el.classList.add(`w-pct-${clamped}`);
  // A role="progressbar" with no aria-valuenow is exposed as *indeterminate*,
  // which is what every XP bar on the site was: the percentage to the next
  // level is the only thing the widget conveys and assistive tech never got it.
  // The fill element is the one whose width changes, so the value is derived
  // here rather than at each of the five call sites.
  const bar = (el as Element & {closest?: (sel: string) => Element | null}).closest?.('[role="progressbar"]');
  if (bar) {
    bar.setAttribute('aria-valuemin', '0');
    bar.setAttribute('aria-valuemax', '100');
    bar.setAttribute('aria-valuenow', String(clamped));
  }
}
