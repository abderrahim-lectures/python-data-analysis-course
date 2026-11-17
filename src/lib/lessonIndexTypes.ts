// Shape of one lesson-search index entry. Kept separate from the .mjs builder
// so the client module can import the type without pulling node:fs into the
// browser bundle.
export interface LessonIndexEntry {
  /** Canonical content id: `python-101/normal/01-printing`, locale-prefixed. */
  id: string;
  locale: 'en' | 'ar' | 'es' | 'fr';
  section: string;
  track: 'normal' | 'hard';
  slug: string;
  title: string;
  description: string;
  module: string;
  tags: string[];
}
