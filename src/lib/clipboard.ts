// Copy-to-clipboard with the fallback every browser needs.
//
// `navigator.clipboard.writeText` can be refused (private browsing, a
// permission prompt the learner dismissed, a non-secure context), so the
// legacy selection copy stays as the second path — it works everywhere but
// needs a real, visible-enough textarea in the document.
//
// Extracted from runnable-cell.client.ts so the copy button reads as one
// line and this can be tested on its own.
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // fall through to the legacy path
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.className = 'pda-clipboard-helper';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}
