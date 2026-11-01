import {afterEach, describe, expect, test, vi} from 'vitest';
import {stubDom} from './_domstub.ts';
import {copyToClipboard} from '../../src/lib/clipboard.ts';

describe('copyToClipboard', () => {
  afterEach(() => vi.unstubAllGlobals());

  test('uses the async clipboard API when the browser allows it', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', {clipboard: {writeText}});
    stubDom();
    expect(await copyToClipboard('print(1)')).toBe(true);
    expect(writeText).toHaveBeenCalledWith('print(1)');
  });

  test('falls back to the selection copy when the API is refused', async () => {
    vi.stubGlobal('navigator', {clipboard: {writeText: vi.fn().mockRejectedValue(new Error('denied'))}});
    const doc = stubDom();
    (doc.restore().execCommand as ReturnType<typeof vi.fn>).mockReturnValue(true);
    expect(await copyToClipboard('x = 1')).toBe(true);
    expect(doc.restore().execCommand).toHaveBeenCalledWith('copy');
  });

  test('reports failure when the legacy path is refused too', async () => {
    vi.stubGlobal('navigator', {clipboard: {writeText: vi.fn().mockRejectedValue(new Error('denied'))}});
    const doc = stubDom();
    (doc.restore().execCommand as ReturnType<typeof vi.fn>).mockReturnValue(false);
    expect(await copyToClipboard('x')).toBe(false);
  });
});
