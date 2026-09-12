import {describe, expect, test, vi} from 'vitest';

export interface FakeEl {
  id: string;
  dataset: Record<string, string>;
  style: Record<string, string>;
  classSet: Set<string>;
  classList: { add(c: string): void; remove(c: string): void; contains(c: string): boolean; has(c: string): boolean; toggle(c: string, force?: boolean): boolean };
  className: string;
  textContent: string;
  innerHTML: string;
  hidden: boolean;
  value: string;
  disabled: boolean;
  children: FakeEl[];
  parentElement: FakeEl | null;
  listeners: Record<string, (ev?: any) => void>;
  allListeners: Record<string, Array<(ev?: any) => void>>;
  querySelectorAllFor: Record<string, FakeEl[]>;
  querySelectorFor: Record<string, FakeEl>;
  addEventListener(kind: string, fn: (ev?: any) => void): void;
  dispatchEvent(ev: any): void;
  click(): void;
  appendChild(child: FakeEl): void;
  insertBefore(child: FakeEl, ref: FakeEl | null): void;
  remove(): void;
  querySelectorAll(sel: string): FakeEl[];
  querySelector(sel: string): FakeEl | null;
  hasAttribute(k: string): boolean;
  setAttribute(k: string, v: string): void;
  getAttribute(k: string): string | null;
  removeAttribute(k: string): void;
}

export function fakeEl(id?: string): FakeEl {
  const classSet = new Set<string>();
  const children: FakeEl[] = [];
  const style: Record<string, string> = {};
  // setProperty is what CSS custom properties (`--dx`, `--particle`) need;
  // adding it via defineProperty keeps `style` a plain string map for TS.
  Object.defineProperty(style, 'setProperty', {
    value(key: string, val: string) { (this as Record<string, string>)[key] = val; },
    enumerable: false,
  });
  const el: FakeEl = {
    id: id ?? '',
    dataset: {},
    style,
    classSet,
    className: '',
    textContent: '',
    innerHTML: '',
    hidden: false,
    value: '',
    disabled: false,
    children,
    parentElement: null,
    listeners: {},
    allListeners: {},
    querySelectorAllFor: {},
    classList: {
      add: (c: string) => { classSet.add(c); },
      remove: (c: string) => { classSet.delete(c); },
      contains: (c: string) => classSet.has(c),
      has: (c: string) => classSet.has(c),
      toggle: (c: string, force?: boolean) => {
        const on = force ?? !classSet.has(c);
        if (on) classSet.add(c); else classSet.delete(c);
        return on;
      },
    },
    addEventListener(kind: string, fn: (ev?: any) => void) {
      this.listeners[kind] = fn;
      (this.allListeners[kind] ??= []).push(fn);
    },
    dispatchEvent(ev: any) {
      const kind = ev?.type;
      for (const fn of this.allListeners[kind] ?? []) fn(ev);
    },
    click() { this.dispatchEvent({type: 'click'}); },
    appendChild(child: FakeEl) {
      children.push(child);
      child.parentElement = this;
    },
    insertBefore(child: FakeEl, _ref: FakeEl | null) {
      children.push(child);
      child.parentElement = this;
    },
    remove() {},
    querySelectorAll(sel: string) { return this.querySelectorAllFor[sel] ?? []; },
    querySelectorFor: {},
    querySelector(sel: string) { return this.querySelectorFor[sel] ?? null; },
    hasAttribute(k: string) { return k in this.dataset; },
    setAttribute(k: string, v: string) { this.dataset[k] = v; },
    getAttribute(k: string) { return this.dataset[k] ?? null; },
    removeAttribute(k: string) { delete this.dataset[k]; },
  };
  // `className` is a live view of the class list (initCell and friends set
  // className, other modules read classList).
  Object.defineProperty(el, 'className', {
    get: () => Array.from(classSet).join(' '),
    set: (v: string) => {
      classSet.clear();
      for (const c of String(v).split(/\s+/).filter(Boolean)) classSet.add(c);
    },
  });
  // Setting innerHTML replaces the child subtree, like the real DOM (the
  // output pane is emptied with `lines.innerHTML = ''`). textContent stays an
  // independent property so source-code edits survive re-highlighting.
  let markup = '';
  Object.defineProperty(el, 'innerHTML', {
    get: () => markup,
    set: (v: string) => { markup = v; children.length = 0; },
  });
  return el;
}

export interface DomStub {
  elements: Map<string, FakeEl>;
  queryAll: Record<string, FakeEl[]>;
  listeners: Record<string, (ev?: any) => void>;
  restore(): Record<string, any>;
}

// Stub the document surface these client modules use (getElementById,
// querySelectorAll, body/head append, createElement).
export function stubDom(): DomStub {
  const elements = new Map<string, FakeEl>();
  const queryAll: Record<string, FakeEl[]> = {};
  const listeners: Record<string, (ev?: any) => void> = {};
  const doc: Record<string, any> = {
    getElementById: (id: string) => elements.get(id) ?? null,
    querySelectorAll: (sel: string) => queryAll[sel] ?? [],
    querySelector: () => null,
    createElement: () => fakeEl(),
    addEventListener: (kind: string, fn: (ev?: any) => void) => { listeners[kind] = fn; },
    removeEventListener: (kind: string, _fn?: (ev?: any) => void) => { delete listeners[kind]; },
    readyState: 'complete',
    body: fakeEl('body'),
    head: fakeEl('head'),
    execCommand: vi.fn(),
  };
  vi.stubGlobal('document', doc);
  return {
    elements,
    queryAll,
    listeners,
    restore: () => doc,
  };
}

export function el(id: string, stub: DomStub): FakeEl {
  if (!stub.elements.has(id)) stub.elements.set(id, fakeEl(id));
  return stub.elements.get(id)!;
}