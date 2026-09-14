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
}
