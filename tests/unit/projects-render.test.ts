import {beforeEach, describe, expect, test, vi} from 'vitest';
import {el, fakeEl, stubDom} from './_domstub.ts';
import {initProjectsFinder} from '../../src/lib/projectsRender.ts';

function stubChrome(initialSearch: string) {
  const location = {search: initialSearch, pathname: '/projects'};
  const history = {replaceState: vi.fn(), pushState: vi.fn()};
  vi.stubGlobal('location', location);
  vi.stubGlobal('history', history);
  return {location, history};
}

function makeCard(tags: string, diff: string, search: string) {
  const c = fakeEl();
  c.dataset.tags = tags;
  c.dataset.diff = diff;
  c.dataset.search = search;
  return c;
}

function setup(initialSearch = '') {
  stubChrome(initialSearch);
  const stub = stubDom();

  const search = el('project-search', stub) as any;
  search.value = '';

  const grid = el('project-grid', stub) as any;
  grid.className = 'list';

  const count = el('project-count', stub) as any;
  const emptyEl = el('project-empty', stub) as any;
  const emptyQuery = el('project-empty-query', stub) as any;

  const tagAll = fakeEl(); tagAll.dataset.tag = '';
  const tagPython = fakeEl(); tagPython.dataset.tag = 'python';
  const tagSql = fakeEl(); tagSql.dataset.tag = 'sql';
  const diffEasy = fakeEl(); diffEasy.dataset.diff = 'easy';
  const diffHard = fakeEl(); diffHard.dataset.diff = 'hard';
  const viewGrid = fakeEl(); viewGrid.dataset.view = 'grid';
  const viewList = fakeEl(); viewList.dataset.view = 'list';

  stub.queryAll['.tag-pill'] = [tagAll, tagPython, tagSql];
  stub.queryAll['.diff-pill'] = [diffEasy, diffHard];
  stub.queryAll['.view-btn'] = [viewGrid, viewList];

  const cards = [
    makeCard('python|stats', 'easy', 'armstrong cipher csv'),
    makeCard('sql', 'hard', 'queries joins'),
    makeCard('python', 'easy', 'pandas dataframe'),
  ];
  stub.queryAll['[data-project]'] = cards;

  return {search, grid, count, emptyEl, emptyQuery, tagAll, tagPython, tagSql, diffEasy, diffHard, viewGrid, viewList, cards, history: history, location};
}

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe('initProjectsFinder', () => {
  test('initializes from URL params: tag, q, view', () => {
    const s = setup('?tag=python&q=cipher&view=grid');
    initProjectsFinder();
    expect(s.search.value).toBe('cipher');
    expect(s.tagPython.classSet.has('is-active')).toBe(true);
    expect(s.tagAll.classSet.has('is-active')).toBe(false);
    expect(s.grid.className).toBe('grid');
    expect(s.cards[0].hidden).toBe(false);
    expect(s.cards[1].hidden).toBe(true);
    expect(s.cards[2].hidden).toBe(true);
    expect(s.count.textContent).toBe('1 of 3 projects');
    expect(s.emptyEl.hidden).toBe(true);
  });

  test('empty results flip the empty state and echo the query', () => {
    const s = setup('?q=nope');
    initProjectsFinder();
    expect(s.emptyEl.hidden).toBe(false);
    expect(s.emptyQuery.textContent).toBe('nope');
  });

  test('typing in search filters and rewrites the URL', () => {
    const s = setup();
    initProjectsFinder();
    s.search.value = 'pandas';
    s.search.listeners.input();
    expect(s.cards[2].hidden).toBe(false);
    expect(s.cards[0].hidden).toBe(true);
    expect(s.count.textContent).toBe('1 of 3 projects');
    expect(s.history.replaceState).toHaveBeenCalledWith(null, '', '?q=pandas');
  });

  test('clicking a tag pill narrows to that tag', () => {
    const s = setup();
    initProjectsFinder();
    s.tagSql.listeners.click();
    expect(s.cards[1].hidden).toBe(false);
    expect(s.cards[0].hidden).toBe(true);
    expect(s.tagSql.classSet.has('is-active')).toBe(true);
    expect(s.tagAll.classSet.has('is-active')).toBe(false);
  });

  test('clicking the all-tag pill resets the filter and echoes it in the empty state', () => {
    const s = setup();
    initProjectsFinder();
    s.tagSql.listeners.click();
    s.diffHard.listeners.click();
    s.tagAll.listeners.click();
    expect(s.tagAll.classSet.has('is-active')).toBe(true);
    expect(s.cards.filter((c: any) => !c.hidden).length).toBeGreaterThan(0);
    expect(s.emptyQuery.textContent).toBe('hard');
  });

  test('clicking a diff pill filters by difficulty', () => {
    const s = setup();
    initProjectsFinder();
    s.diffEasy.listeners.click();
    expect(s.cards[0].hidden).toBe(false);
    expect(s.cards[2].hidden).toBe(false);
    expect(s.cards[1].hidden).toBe(true);
    expect(s.history.replaceState).toHaveBeenCalledWith(null, '', '?diff=easy');
  });

  test('view buttons toggle grid/list mode', () => {
    const s = setup();
    initProjectsFinder();
    s.viewGrid.listeners.click();
    expect(s.grid.className).toBe('grid');
    expect(s.viewGrid.classSet.has('is-active')).toBe(true);
    expect(s.viewList.classSet.has('is-active')).toBe(false);
    s.viewList.listeners.click();
    expect(s.grid.className).toBe('list');
    expect(s.viewList.classSet.has('is-active')).toBe(true);
  });

  test('combined filter, empty-query falls back to the filter label', () => {
    const s = setup('?diff=extreme');
    initProjectsFinder();
    expect(s.emptyEl.hidden).toBe(false);
    expect(s.emptyQuery.textContent).toBe('extreme');
  });
});