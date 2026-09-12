// Astro's content-collection cache (.astro/ and node_modules/.astro/) does not
// reliably invalidate when a remark/rehype plugin or the content config changes
// on a warm build; a stale data store silently runs the old plugin with zero
// errors. Run this before build/dev/check so the content layer always starts
// cold. See plan/astro-rebuild.md and plan/testing-and-verification.md.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
for (const dir of ['.astro', 'node_modules/.astro']) {
  fs.rmSync(path.join(root, dir), {recursive: true, force: true});
}