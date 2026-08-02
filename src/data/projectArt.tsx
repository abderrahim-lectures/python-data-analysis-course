import type {ProjectMeta} from '@site/src/data/projects';

/**
 * Deterministic, dependency-free "generated" card thumbnails. Every project
 * gets a stable inline SVG: a dark on-brand gradient (picked by hashing the
 * id, so renames shuffle nothing), a subtle dot pattern, and a large emoji
 * derived from its tags. No binary assets — works offline, in the PWA, and
 * regenerates instantly if the palette or tag map changes.
 */

interface GradientPair {
  from: string;
  to: string;
}

const GRADIENTS: GradientPair[] = [
  {from: '#2a11c0', to: '#7c3aed'},
  {from: '#171428', to: '#4f46e5'},
  {from: '#0f2440', to: '#0ea5b7'},
  {from: '#241a3d', to: '#b45309'},
  {from: '#16213e', to: '#533483'},
  {from: '#2b1038', to: '#db2777'},
];

/** Tags with higher visual specificity are listed first — the first match wins. */
const TAG_EMOJI: Array<[string, string]> = [
  ['Playwright', '🎭'],
  ['Speech-to-Text', '🎙️'],
  ['Fine-tuning', '🎛️'],
  ['Computer Vision', '👁️'],
  ['Web Scraping', '🕷️'],
  ['Knowledge Graphs', '🕸️'],
  ['RAG', '📚'],
  ['Multi-Agent', '🧩'],
  ['Tool Calling', '🧰'],
  ['Chatbots', '💬'],
  ['Discord', '💬'],
  ['Games', '🎮'],
  ['Data Visualization', '📈'],
  ['pandas', '🐼'],
  ['Pandas', '🐼'],
  ['Machine Learning', '🧠'],
  ['scikit-learn', '🧪'],
  ['MCP', '🔌'],
  ['Git', '🌿'],
  ['CLI Tools', '⌨️'],
  ['APIs', '🌐'],
  ['FastAPI', '🚀'],
  ['SQL', '🗄️'],
  ['Databases', '🗄️'],
  ['PDFs', '📄'],
  ['Embeddings', '🧲'],
  ['OpenCV', '📷'],
  ['Finance', '💰'],
  ['Education', '🎓'],
  ['Search', '🔍'],
  ['AI Agents', '🤖'],
  ['Automation', '⚙️'],
  ['Productivity', '✅'],
  ['Developer Tools', '🛠️'],
  ['Static Analysis', '🔬'],
  ['LangChain', '⛓️'],
  ['LLMs', '🧠'],
];

const FALLBACK_EMOJI = '💻';

/** Stable per-id hash so a project keeps its gradient across re-renders. */
function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Emoji picked from the project's most distinctive tag. */
export function projectArtEmoji(tags: string[]): string {
  for (const [tag, emoji] of TAG_EMOJI) {
    if (tags.includes(tag)) {
      return emoji;
    }
  }
  return FALLBACK_EMOJI;
}

/** On-brand dark gradient (as stop colors) picked by hashing the project id. */
export function projectArtGradient(id: string): GradientPair {
  return GRADIENTS[hashString(id) % GRADIENTS.length];
}

interface Props {
  project: Pick<ProjectMeta, 'id' | 'tags'>;
  /** Optional class name for sizing (width/height/aspect-ratio live in CSS). */
  className?: string;
}

/**
 * Inline-SVG thumbnail for a project card. `viewBox` is fixed; the element
 * stretches to whatever size the card gives it (crisp at any resolution).
 */
export default function ProjectArt({project, className}: Props): React.JSX.Element {
  const gradient = projectArtGradient(project.id);
  const emoji = projectArtEmoji(project.tags);
  // ids must be unique per rendered instance (same project can appear on the
  // homepage and the docs page in one session).
  const uid = project.id.replace(/[^a-zA-Z0-9-]/g, '-');
  const gradientId = `project-art-${uid}`;
  const dotsId = `project-art-dots-${uid}`;

  return (
    <svg
      className={className}
      viewBox="0 0 320 160"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={gradient.from} />
          <stop offset="100%" stopColor={gradient.to} />
        </linearGradient>
        <pattern id={dotsId} width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="1.5" fill="rgba(255,255,255,0.13)" />
        </pattern>
      </defs>
      <rect width="320" height="160" fill={`url(#${gradientId})`} />
      <rect width="320" height="160" fill={`url(#${dotsId})`} />
      <circle cx="274" cy="22" r="64" fill="rgba(255,255,255,0.09)" />
      <circle cx="36" cy="148" r="72" fill="rgba(0,0,0,0.18)" />
      <circle cx="160" cy="80" r="42" fill="rgba(0,0,0,0.22)" />
      <text
        x="160"
        y="88"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="52">
        {emoji}
      </text>
    </svg>
  );
}
