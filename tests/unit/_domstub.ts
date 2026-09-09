import {describe, expect, test, vi} from 'vitest';

export interface FakeEl {
  id: string;
  dataset: Record<string, string>;
  style: Record<string, string>;
  classSet: Set<string>;
  classList: { add(c: string): void; remove(c: string): void; contains(c: string): boolean; has(c: string): boolean; toggle(c: string, force?: boolean): boolean };
  textContent: string;
  innerHTML: string;
  hidden: boolean;
  value: string;
  listeners: Record<string, (ev?: any) => void>;
  querySelectorAllFor: Record<string, FakeEl[]>;
  querySelectorFor: Record<string, FakeEl>;
  addEventListener(kind: string, fn: (ev?: any) => void): void;
  dispatchEvent(ev: any): void;
  querySelectorAll(sel: string): FakeEl[];
  querySelector(sel: string): FakeEl | null;
  hasAttribute(k: string): boolean;
  setAttribute(k: string, v: string): void;
  getAttribute(k: string): string | null;
  removeAttribute(k: string): void;
}

export function fakeEl(id?: string): FakeEl {
  const classSet = new Set<string>();
  return {
    id: id ?? '',
    dataset: {},
    style: {},
    classSet,
    textContent: '',
    innerHTML: '',
    hidden: false,
    value: '',
    listeners: {},
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
    addEventListener(kind, fn) { this.listeners[kind] = fn; },
    dispatchEvent() {},
    querySelectorAll(sel) { return this.querySelectorAllFor[sel] ?? []; },
    querySelectorFor: {},
    querySelector(sel: string) { return this.querySelectorFor[sel] ?? null; },
    hasAttribute(k: string) { return k in this.dataset; },
    setAttribute(k, v) { this.dataset[k] = v; },
    getAttribute(k) { return this.dataset[k] ?? null; },
    removeAttribute(k) { delete this.dataset[k]; },
  };
}

export interface DomStub {
  elements: Map<string, FakeEl>;
  queryAll: Record<string, FakeEl[]>;
  listeners: Record<string, (ev?: any) => void>;
  restore(): void;
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