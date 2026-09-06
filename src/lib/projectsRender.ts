export function initProjectsFinder() {
  const search = document.getElementById('project-search') as HTMLInputElement | null;
  const tagButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('.tag-pill'));
  const diffButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('.diff-pill'));
  const viewButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('.view-btn'));
  const cards = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-project]'));
  const grid = document.getElementById('project-grid')!;
  const countEl = document.getElementById('project-count');
  const emptyEl = document.getElementById('project-empty');
  const emptyQueryEl = document.getElementById('project-empty-query');

  const params = new URLSearchParams(location.search);
  let activeTag = params.get('tag') ?? '';
  let activeDiff = params.get('diff') ?? '';
  let viewMode = params.get('view') ?? 'list';
  if (search) search.value = params.get('q') ?? '';

  function setView(mode: string) {
    viewMode = mode;
    grid.className = mode === 'grid' ? 'grid' : 'list';
    for (const b of viewButtons) b.classList.toggle('is-active', b.dataset.view === mode);
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
    if (countEl) countEl.textContent = `${visible} of ${cards.length} project${cards.length === 1 ? '' : 's'}`;
    if (emptyEl) emptyEl.hidden = visible > 0;
    if (emptyQueryEl) emptyQueryEl.textContent = q || (activeTag || activeDiff || 'that filter');

    const next = new URLSearchParams();
    if (viewMode !== 'list') next.set('view', viewMode);
    if (q) next.set('q', q);
    if (activeTag) next.set('tag', activeTag);
    if (activeDiff) next.set('diff', activeDiff);
    const qs = next.toString();
    history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
  }

  for (const btn of viewButtons) {
    btn.addEventListener('click', () => setView(btn.dataset.view ?? 'list'));
  }

  for (const btn of tagButtons) {
    if (btn.dataset.tag === activeTag) btn.classList.add('is-active');
    else if (btn.dataset.tag !== '') btn.classList.remove('is-active');
    btn.addEventListener('click', () => {
      activeTag = btn.dataset.tag ?? '';
      for (const b of tagButtons) b.classList.toggle('is-active', b === btn);
      apply();
    });
  }
  if (activeTag) {
    for (const b of tagButtons) b.classList.toggle('is-active', b.dataset.tag === activeTag);
  }

  for (const btn of diffButtons) {
    if (btn.dataset.diff === activeDiff) btn.classList.add('is-active');
    else if (btn.dataset.diff !== '') btn.classList.remove('is-active');
    btn.addEventListener('click', () => {
      activeDiff = btn.dataset.diff ?? '';
      for (const b of diffButtons) b.classList.toggle('is-active', b === btn);
      apply();
    });
  }
  if (activeDiff) {
    for (const b of diffButtons) b.classList.toggle('is-active', b.dataset.diff === activeDiff);
  }

  search?.addEventListener('input', apply);
  setView(viewMode);
  apply();
}
