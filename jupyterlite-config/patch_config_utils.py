#!/usr/bin/env python3
"""Inject a per-URL interface language override into JupyterLite's config-utils.js.

JupyterLite serves one shared static app (under /lite/) for every Docusaurus
locale. The site's playground embed deep-links into it with a `?locale=` query
string (see src/utils/playgroundUrls.ts and JupyterLiteEmbed.tsx). Vanilla
JupyterLite ignores that query string — the interface locale comes only from the
`@jupyterlab/translation-extension` setting. This patch teaches the app's
load-time config reader to honour the `?locale=` param by writing it into that
extension's `settingsOverrides` before the app boots, so each embedded locale
renders in its own language.

`config-utils.js` is a prebuilt static file shipped inside the `@jupyterlite/app`
package tarball (jupyterlite-core) and copied verbatim into the build output, so
we patch the emitted file rather than the vendored source. Run this AFTER
`jupyter lite build` and BEFORE merging _output into build/lite.
"""
import sys
from pathlib import Path

MARKER = "pda-locale-override"


def main() -> None:
    path = Path(sys.argv[1] if len(sys.argv) > 1 else "_output/config-utils.js")
    src = path.read_text(encoding="utf-8")
    if MARKER in src:
        print(f"config-utils.js already patched: {path}")
        return

    hook = """  // [pda-locale-override] honour the site's per-URL ?locale= deep-link
  const pdaParams = new URLSearchParams(window.location.search);
  const pdaRequested = pdaParams.get('locale');
  if (pdaRequested) {
    const locale = pdaRequested.replace('-', '_');
    const overrides = (config.settingsOverrides = config.settingsOverrides || {});
    overrides['@jupyterlab/translation-extension:plugin'] = {
      ...(overrides['@jupyterlab/translation-extension:plugin'] || {}),
      locale,
    };
  }
  // rewrite the config"""
    anchor = "  // rewrite the config"
    if anchor not in src:
        print(f"WARNING: anchor not found in {path}; skipping patch", file=sys.stderr)
        sys.exit(1)

    patched = src.replace(anchor, hook, 1)
    path.write_text(patched, encoding="utf-8")
    print(f"patched locale override into {path}")


if __name__ == "__main__":
    main()
