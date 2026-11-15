// Who contributed what, in one place.
//
// Contributors are declared, not derived. Git history is the obvious source
// and it does not work here: every one of the 135 English project files was
// added in a single commit by the maintainer, and students who write a
// project outside GitHub (or submit it as a file, or get it merged on their
// behalf) leave no author trail at all. So the site reads authorship from
// project frontmatter (`author: <id>`) and resolves the person here.
//
// `github` is optional on purpose: a student without a GitHub account can
// still be credited by name, which is the common case for a course like this.
// A handle, when present, is used only to build a profile link; nothing is
// fetched at build time, so the page builds offline and cannot break because
// an account was renamed.
//
// Adding a contributor: append an entry with a stable `id`, then put that id
// in the `author:` field of the projects they wrote. Unknown ids are reported
// by tests/unit/contributors.test.ts rather than rendering as a blank card.

export interface Contributor {
  /** Stable id used in project frontmatter. Lowercase, hyphenated. */
  id: string;
  /** Display name as the person wants it shown. */
  name: string;
  /** GitHub handle, without the @. Optional. */
  github?: string;
  /** One line on what they did, shown under their name. Optional. */
  role?: string;
  /** Personal site or profile, if they have one and want it linked. */
  url?: string;
}

export const CONTRIBUTORS: Contributor[] = [
  {
    id: 'abderrahim-adrabi',
    name: 'Abderrahim Adrabi',
    github: 'abderrahim-lectures',
    role: 'Course author and maintainer',
    url: 'https://pyda-course.online/',
  },
];

/** Look up a contributor by id. Returns undefined for an unknown id so callers
 *  can decide (the page skips it, the test fails on it). */
export function contributorById(id: string): Contributor | undefined {
  return CONTRIBUTORS.find((c) => c.id === id);
}

/** GitHub profile URL for a contributor, or null when they have no handle. */
export function contributorProfileUrl(c: Contributor): string | null {
  if (c.url) return c.url;
  if (c.github) return `https://github.com/${c.github}`;
  return null;
}
