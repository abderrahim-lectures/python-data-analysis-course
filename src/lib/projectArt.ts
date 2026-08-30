// Deterministic, dependency-free per-project card art: a stable on-brand
// gradient (hashed from the project slug) plus an emoji picked from the
// project's most distinctive tag. Ported from the old Docusaurus
// src/data/projectArt.tsx + src/data/projects.ts (tag data) before those
// were removed in the Astro root restructure — see git history at or
// before that commit if the source needs revisiting.
export interface GradientPair {
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

/** Tags per project slug (matches src/content/projects/<slug>.md), carried
 *  over from the old PROJECTS metadata array — only the tags survive here,
 *  since level/tools/date aren't used by the card art. */
export const PROJECT_TAGS: Record<string, string[]> = {
  'dependency-freshness-checker': ['CLI Tools', 'Automation'],
  'commit-message-agent': ['CLI Tools', 'Git', 'AI Agents'],
  'mcp-sqlite-server': ['MCP', 'SQL', 'Databases'],
  'trivia-bot': ['Discord', 'Chatbots', 'Games'],
  'chat-with-pdfs': ['RAG', 'PDFs', 'Embeddings'],
  'mcp-notes-server': ['MCP', 'Claude Desktop', 'Search'],
  'recipe-planner-agent': ['AI Agents', 'Tool Calling', 'Productivity'],
  'meeting-notes-summarizer': ['AI Agents', 'Productivity', 'Automation'],
  'github-issue-triage-agent': ['AI Agents', 'Developer Tools', 'Automation'],
  'voice-to-task-agent': ['AI Agents', 'Speech-to-Text', 'Automation'],
  'study-buddy-agent': ['AI Agents', 'Education', 'Productivity'],
  'codebase-knowledge-graph': ['Knowledge Graphs', 'Static Analysis', 'Developer Tools'],
  'docs-qa-bot': ['AI Agents', 'RAG', 'Chatbots'],
  'email-triage-agent': ['AI Agents', 'Automation', 'Productivity'],
  'multi-agent-research': ['AI Agents', 'Multi-Agent', 'LangChain'],
  'agentic-code-reviewer': ['AI Agents', 'Developer Tools', 'Automation'],
  'mcp-server': ['MCP', 'AI Agents'],
  'ml-classifier': ['Machine Learning', 'scikit-learn', 'Data Analysis'],
  'rag-notes': ['RAG', 'Embeddings', 'LLMs'],
  'scrape-analyze': ['Web Scraping', 'Data Analysis', 'pandas'],
  'job-aggregator': ['Web Scraping', 'Pandas', 'Automation'],
  'finetune-llm-unsloth': ['Fine-tuning', 'LoRA', 'LLMs'],
  'rate-limited-api': ['APIs', 'FastAPI', 'Web Services'],
  'webcam-object-counter': ['Computer Vision', 'OpenCV'],
  'ai-agent': ['AI Agents', 'LangChain'],
  'finance-agent': ['AI Agents', 'Pandas', 'Finance'],
  'browser-automation-agent': ['AI Agents', 'Automation', 'Playwright'],
  'wordle-clone': ['Games', 'CLI Tools'],
  'habit-streak-visualizer': ['Data Visualization', 'Pandas', 'Productivity'],
};

/** Stable per-slug hash so a project keeps its gradient across re-renders. */
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
    if (tags.includes(tag)) return emoji;
  }
  return FALLBACK_EMOJI;
}

/** On-brand dark gradient (as stop colors) picked by hashing the project slug. */
export function projectArtGradient(slug: string): GradientPair {
  return GRADIENTS[hashString(slug) % GRADIENTS.length];
}
