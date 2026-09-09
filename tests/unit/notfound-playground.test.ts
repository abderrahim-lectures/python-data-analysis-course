import {beforeEach, describe, expect, test, vi} from 'vitest';
import {el, fakeEl, stubDom} from './_domstub.ts';

const decodeShareCode = vi.fn(async (segment: string) => `decoded:${segment}`);
vi.mock('../../src/lib/codeShare.ts', () => ({decodeShareCode}));

function pgFixture(path: string, referrer = '') {
  const stub = stubDom();
  const notfound = el('notfound', stub);
  const pgHead = el('pg-head', stub);
  const pgSection = el('pg-section', stub);
  const pgCode = el('pg-code', stub);
  const pgBack = el('pg-back', stub);

  for (const e of [notfound, pgHead, pgSection, pgCode, pgBack]) {
    e.setAttribute('hidden', '');
  }

  const eyebrow = fakeEl('eyebrow');
  const h1 = fakeEl('h1');
  const lead = fakeEl('lead');
  pgHead.querySelectorFor['.head__eyebrow span'] = eyebrow;
  pgHead.querySelectorFor['h1'] = h1;
  pgHead.querySelectorFor['p'] = lead;

  const dispatched: string[] = [];
  pgCode.dispatchEvent = (ev: any) => { dispatched.push(ev.type); };

  const doc = stub.restore() as any;
  doc.referrer = referrer;

  vi.stubGlobal('location', {pathname: path, origin: 'http://localhost:4321'});
  const win = {__PDA404_I18N__: {notfound_play_title: 'PyDA', playground_title: 'PG'}, __PDA404_LOCALE__: 'en'};
  vi.stubGlobal('window', win);

  return {notfound, pgHead, pgSection, pgCode, pgBack, eyebrow, h1, lead, dispatched};
}

// Reset module cache so the client module's top-level init() runs again, with
// the option to shape decodeShareCode's behavior before the page loads.
async function loadPage(path: string, referrer = '', shape?: (m: typeof decodeShareCode) => void) {
  const f = pgFixture(path, referrer);
  shape?.(decodeShareCode);
  vi.resetModules();
  const client = await import('../../src/lib/notFoundPlayground.client.ts');
  expect(client).toBeTruthy();
  await new Promise((r) => setTimeout(r, 0));
  return f;
}

beforeEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  decodeShareCode.mockImplementation(async (s: string) => `decoded:${s}`);
});

describe('notFoundPlayground', () => {
  test('lifts the 404, fills the editor, and links home for offline referrer', async () => {
    const f = await loadPage('/playground/ABC123');
    expect(decodeShareCode).toHaveBeenCalledWith('ABC123');
    expect(f.notfound.hasAttribute('hidden')).toBe(true);
    expect(f.pgHead.hasAttribute('hidden')).toBe(false);
    expect(f.pgSection.hasAttribute('hidden')).toBe(false);
    expect(f.pgCode.textContent).toBe('decoded:ABC123');
    expect(f.dispatched).toContain('input');
    expect(f.h1.textContent).toBe('PG');
    expect(f.pgBack.getAttribute('href')).toBe('/learn');
    expect(f.pgBack.hasAttribute('hidden')).toBe(false);
  });

  test('same-origin referrer links back to the lesson', async () => {
    const f = await loadPage('/playground/ABC123', 'http://localhost:4321/learn/python-101/01-intro');
    expect(f.pgBack.getAttribute('href')).toBe('http://localhost:4321/learn/python-101/01-intro');
    expect(f.pgBack.textContent).toBe('← Back to the lesson');
  });

  test('non-playground paths leave the 404 alone', async () => {
    const f = await loadPage('/learn/python-101');
    expect(decodeShareCode).not.toHaveBeenCalled();
    expect(f.notfound.hasAttribute('hidden')).toBe(true);
  });

  test('oversized segment aborts before decoding', async () => {
    const f = await loadPage(`/playground/${'a'.repeat(20001)}`);
    expect(decodeShareCode).not.toHaveBeenCalled();
    expect(f.notfound.hasAttribute('hidden')).toBe(true);
  });

  test('decompression-bomb result aborts after decoding', async () => {
    const f = await loadPage('/playground/ABC123', '', (m) => m.mockResolvedValueOnce('X'.repeat(200001)));
    expect(f.notfound.hasAttribute('hidden')).toBe(true);
    expect(f.pgCode.textContent).toBe('');
  });

  test('malformed segment (decode throws) keeps the plain 404', async () => {
    const f = await loadPage('/playground/%21%21bad%21%21', '', (m) => m.mockRejectedValueOnce(new Error('bad base64url')));
    expect(f.notfound.hasAttribute('hidden')).toBe(true);
    expect(f.pgCode.textContent).toBe('');
  });

  test('i18n copy drives the head when provided', async () => {
    const f = await loadPage('/playground/abc');
    expect(f.pgHead.hasAttribute('hidden')).toBe(false);
    expect(f.h1.textContent).toBe('PG');
  });

  test('deferred init runs on DOMContentLoaded when the page is still loading', async () => {
    const stub = stubDom();
    (stub.restore() as any).readyState = 'loading';
    vi.stubGlobal('location', {pathname: '/playground/ZZZ', origin: 'http://localhost:4321'});
    vi.stubGlobal('window', {
      __PDA404_I18N__: {notfound_play_title: 'PyDA', playground_title: 'PG'},
      __PDA404_LOCALE__: 'en',
    });
    vi.resetModules();
    await import('../../src/lib/notFoundPlayground.client.ts');
    expect(stub.listeners['DOMContentLoaded']).toBeDefined();
  });
});