// Builds the lesson search index at compile time.
//
// 272 lessons across four locales and three sections had no search at all:
// the projects listing has a filter, the lessons have nothing, so finding
// "the lesson that explained confidence intervals" meant remembering which
// module it lived in. The index is titles and descriptions only -- 52 KB of
// JSON for the whole site -- so it ships inline rather than as a fetch.
//
// Each entry carries the canonical id plus a precomputed href, so the client
// does no path building: localized routes differ per locale (تعلم / aprender /
// apprendre, and normal is عادي in Arabic), and duplicating that logic in a
// browser script is exactly how the localized-link bugs happened.
import {readdirSync, readFileSync} from 'node:fs';
import {join} from 'node:path';

/** The locale of a content id: EN ids are unprefixed. */
function localeOf(id) {
  const m = /^(ar|es|fr)\//.exec(id);
  return m ? m[1] : 'en';
}

function frontmatter(src) {
  return /^---\r?\n([\s\S]*?)\r?\n---/.exec(src)?.[1] ?? '';
}

function field(fm, key) {
  const m = new RegExp(`^${key}:\\s*(.+)$`, 'm').exec(fm);
  if (!m) return '';
  return m[1].trim().replace(/^['"]|['"]$/g, '');
}

export function buildLessonIndex(lessonsDir) {
  const entries = [];
  const walk = (dir) => {
    for (const e of readdirSync(dir, {withFileTypes: true})) {
      const p = join(dir, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      if (!e.name.endsWith('.md')) continue;

      const src = readFileSync(p, 'utf8');
      const fm = frontmatter(src);
      const title = field(fm, 'title');
      if (!title) continue;

      // id is relative to the lessons root, without .md: the canonical key the
      // game state and routing already use.
      const id = p.slice(lessonsDir.length + 1).replace(/\.md$/, '');
      const locale = localeOf(id);
      const bare = id.replace(/^(ar|es|fr)\//, '');
      const [section, track, ...rest] = bare.split('/');
      const slug = rest[rest.length - 1];

      entries.push({
        id,
        locale,
        section,
        track,
        slug,
        title,
        description: field(fm, 'description'),
        module: field(fm, 'module'),
        // Everything below is matched, not shown, so the reader can find a
        // lesson by a tag or by its learning objectives.
        tags: field(fm, 'tags').replace(/[[\]"]/g, '').split(',').map((t) => t.trim()).filter(Boolean),
      });
    }
  };
  walk(lessonsDir);
  return entries;
}
