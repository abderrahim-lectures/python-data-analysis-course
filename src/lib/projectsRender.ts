export function initProjectsFinder() {
  // This is bound to the global `astro:page-load` event, which fires on
  // every soft navigation site-wide, not just navigations to /projects --
  // and since `document` persists across soft navs, that binding stays
  // registered for the rest of the session once first loaded. Without this
  // guard, every subsequent navigation to any other page throws here (the
  // old `!` non-null assertion crashed immediately in setView()'s
  // `grid.className = ...`), and — because the throw happens mid-callback —
  // leaves the ClientRouter's own transition sequencing half-finished too.
  const gridEl = document.getElementById('project-grid');
  if (!gridEl) return;
  // Re-bound to a fresh `const` with a non-nullable declared type: TypeScript's
  // control flow narrowing from the guard above doesn't persist into the
  // setView() closure defined below (it's scoped to this function, not
  // propagated into nested function bodies), so `grid` inside that closure
  // would still type as `HTMLElement | null` without this.
  const grid: HTMLElement = gridEl;
  const search = document.getElementById('project-search') as HTMLInputElement | null;
  const tagButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('.tag-pill'));
  const diffButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('.diff-pill'));
  const viewButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('.view-btn'));
  const cards = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-project]'));
  const countEl = document.getElementById('project-count');
  const emptyEl = document.getElementById('project-empty');
  const emptyQueryEl = document.getElementById('project-empty-query');
  // The finder's own copy comes from the locale's messages, the same way the
  // static markup around it does: both strings used to be English literals in
  // this module, so /es/proyectos, /fr/projets and /ar/مشاريع printed
  // "1 of 12 projects" and '"that filter"' in English.
  const finderEl = document.querySelector<HTMLElement>('.finder');
  const countTemplate = finderEl?.dataset.countTemplate || '{visible} of {total} projects';
  const thatFilter = finderEl?.dataset.thatFilter || 'that filter';

  const params = new URLSearchParams(location.search);
  let activeTag = params.get('tag') ?? '';
  let activeDiff = params.get('diff') ?? '';
  let viewMode = params.get('view') ?? 'list';
  if (search) search.value = params.get('q') ?? '';

  // Every one of these controls is a toggle whose selected state used to live
  // only in the `is-active` class: a screen reader read "Python button" before
  // and after activating it, with no way to tell which filter was narrowing the
  // list or which view was current. `aria-pressed` carries the same state for
  // assistive tech, set everywhere the class is.
  function setPressed(btns: HTMLButtonElement[], isOn: (b: HTMLButtonElement) => boolean) {
    for (const b of btns) {
      const on = isOn(b);
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    }
  }

  function setView(mode: string) {
    viewMode = mode;
    grid.className = mode === 'grid' ? 'grid' : 'list';
    setPressed(viewButtons, (b) => b.dataset.view === mode);
  }

  function apply() {
    const q = (search?.value ?? '').trim().toLowerCase();
    let visible = 0;
    for (const card of cards) {
      const matchesTag = !activeTag || (card.dataset.tags ?? '').split('|').includes(activeTag);
      const matchesDiff = !activeDiff || card.dataset.diff === activeDiff;
      const matchesQuery = !q || (card.dataset.search ?? '').includes(q);
      const show = matchesTag && matchesDiff && matchesQuery;
      card.hidden = !show;
      if (show) visible++;
    }
    if (countEl) {
      countEl.textContent = countTemplate
        .replace('{visible}', String(visible))
        .replace('{total}', String(cards.length));
    }
    if (emptyEl) emptyEl.hidden = visible > 0;
    if (emptyQueryEl) emptyQueryEl.textContent = q || (activeTag || activeDiff || thatFilter);

    const next = new URLSearchParams();
    if (viewMode !== 'list') next.set('view', viewMode);
    if (q) next.set('q', q);
    if (activeTag) next.set('tag', activeTag);
    if (activeDiff) next.set('diff', activeDiff);
    const qs = next.toString();
    // `history.replaceState(null, …)` used to be passed here, which destroys
    // the ClientRouter's own state on this history entry: Astro keeps its
    // position in `history.state.index` and `onPopState` returns immediately
    // when `ev.state === null` (transitions/router.js). Since apply() also runs
    // on init, simply visiting /projects nulled it -- so after clicking through
    // to a project and pressing Back, the URL changed to /projects and the
    // project page stayed on screen. Carry the existing state through, and only
    // touch the URL when the filter actually changed it.
    const target = qs ? `?${qs}` : location.pathname;
    if (target !== `${location.pathname}${location.search}`) {
      history.replaceState(history.state, '', target);
    }
  }

  for (const btn of viewButtons) {
    btn.addEventListener('click', () => setView(btn.dataset.view ?? 'list'));
  }

  setPressed(tagButtons, (b) => (b.dataset.tag ?? '') === activeTag);
  for (const btn of tagButtons) {
    btn.addEventListener('click', () => {
      activeTag = btn.dataset.tag ?? '';
      setPressed(tagButtons, (b) => (b.dataset.tag ?? '') === activeTag);
      apply();
    });
  }

  setPressed(diffButtons, (b) => (b.dataset.diff ?? '') === activeDiff);
  for (const btn of diffButtons) {
    btn.addEventListener('click', () => {
      activeDiff = btn.dataset.diff ?? '';
      setPressed(diffButtons, (b) => (b.dataset.diff ?? '') === activeDiff);
      apply();
    });
  }

  search?.addEventListener('input', apply);
  setView(viewMode);
  apply();
}
