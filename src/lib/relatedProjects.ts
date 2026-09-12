// Curated lesson -> related project mapping. Lesson tags are syntax concepts
// while project tags are coarse domains ("AI Agents", "CLI Tools") so a bare
// tag-overlap would mostly miss; hand-picked pairing is the reliable signal.
// Key: `${section}/${track}/${lesson-slug}`. Values: EN project slugs (the
// same slug is used across all locales; locale lookup happens at render time).
export const RELATED_PROJECTS: Record<string, string[]> = {
  // python-101 / normal — fundamentals
  'python-101/normal/01-printing': ['cli-framework', 'config-manager'],
  'python-101/normal/02-variables': ['expense-tracker', 'password-generator'],
  'python-101/normal/03-data-types': ['json-swiss-army-knife', 'url-shortener'],
  'python-101/normal/04-type-conversion': ['invoice-generator', 'qr-code-studio'],
  'python-101/normal/05-arithmetic': ['carbon-tracker', 'expense-tracker'],
  'python-101/normal/06-comparison-operators': ['habit-streak-visualizer', 'task-manager'],
  'python-101/normal/07-boolean-operators': ['firewall-rules', 'secret-manager'],
  'python-101/normal/08-if-elif-else': ['quiz-engine', 'survey-builder'],
  'python-101/normal/09-for-while-loops': ['web-scraper-api', 'log-analyzer'],
  'python-101/normal/10-range-enumerate-zip': ['report-builder', 'gradebook'],
  'python-101/normal/11-defining-functions': ['api-mock-server', 'cli-framework'],
  'python-101/normal/12-scope-and-lambdas': ['json-swiss-army-knife', 'data-catalog'],
  'python-101/normal/13-string-methods': ['markdown-blog-engine', 'email-campaign'],
  'python-101/normal/14-string-slicing': ['plagiarism-checker', 'citation-manager'],
  'python-101/normal/15-lists-and-tuples': ['task-manager', 'audio-editor'],
  'python-101/normal/16-dicts-and-sets': ['inventory-manager', 'crm-system'],
  'python-101/normal/17-comprehensions': ['data-masker', 'etl-pipeline'],
  'python-101/normal/18-reading-files': ['log-analyzer', 'markdown-blog-engine'],
  'python-101/normal/19-writing-files-csv': ['spreadsheet-tool', 'data-quality-monitor'],

  // python-101 / hard — corpus to tiny language model
  'python-101/hard/01-csv-loading': ['scrape-analyze', 'ai-data-cleaner'],
  'python-101/hard/02-exploring-corpus': ['ai-data-cleaner', 'data-catalog'],
  'python-101/hard/03-tokenization-basics': ['sentiment-dashboard', 'research-paper-parser'],
  'python-101/hard/04-word-frequency': ['sentiment-dashboard', 'plagiarism-checker'],
  'python-101/hard/05-building-bigrams': ['ai-story-writer', 'meeting-notes-summarizer'],
  'python-101/hard/06-normalizing-bigrams': ['ai-story-writer', 'study-buddy-agent'],
  'python-101/hard/07-sampling-next-word': ['ai-story-writer', 'image-caption-generator'],
  'python-101/hard/08-generate-text-impl': ['ai-story-writer', 'image-caption-generator'],
  'python-101/hard/09-temperature-tuning': ['ai-tutor', 'ai-story-writer'],
  'python-101/hard/10-cli-generator': ['cli-framework', 'config-manager'],

  // data-analysis / normal — pandas fundamentals
  'data-analysis/normal/01-series-basics': ['spreadsheet-tool', 'gradebook'],
  'data-analysis/normal/02-dataframe-creation': ['spreadsheet-tool', 'data-catalog'],
  'data-analysis/normal/03-selecting-columns': ['data-visualization', 'spreadsheet-tool'],
  'data-analysis/normal/04-filtering-rows': ['lead-scoring', 'data-quality-monitor'],
  'data-analysis/normal/05-indexing-loc-iloc': ['time-series-analyzer', 'geospatial-analyzer'],
  'data-analysis/normal/06-missing-values': ['ai-data-cleaner', 'data-quality-monitor'],
  'data-analysis/normal/07-groupby-basics': ['lead-scoring', 'survey-builder'],
  'data-analysis/normal/08-merging-dataframes': ['etl-pipeline', 'data-lineage-tracker'],
  'data-analysis/normal/09-titanic-loading': ['ml-classifier', 'data-visualization'],
  'data-analysis/normal/10-titanic-analysis': ['ml-classifier', 'report-builder'],

  // data-analysis / hard — EDA + storytelling
  'data-analysis/hard/01-framing-questions': ['data-visualization', 'report-builder'],
  'data-analysis/hard/02-dataset-profiling': ['data-quality-monitor', 'ai-data-cleaner'],
  'data-analysis/hard/03-univariate-numerical': ['time-series-analyzer', 'data-visualization'],
  'data-analysis/hard/04-univariate-categorical': ['survey-builder', 'lead-scoring'],
  'data-analysis/hard/05-bivariate-numerical': ['sentiment-dashboard', 'data-visualization'],
  'data-analysis/hard/06-correlation-analysis': ['recommendation-engine', 'lead-scoring'],
  'data-analysis/hard/07-advanced-plots': ['data-visualization', 'report-builder'],
  'data-analysis/hard/08-storytelling-principles': ['report-builder', 'data-visualization'],
  'data-analysis/hard/09-students-profiling': ['gradebook', 'data-visualization'],
  'data-analysis/hard/10-students-final-report': ['report-builder', 'ml-classifier'],
};

/** Project slugs related to a lesson, ordered by hand-ranked relevance. */
export function relatedProjectSlugs(section: string, track: string, lessonSlug: string): string[] {
  return RELATED_PROJECTS[`${section}/${track}/${lessonSlug}` as keyof typeof RELATED_PROJECTS] ?? [];
}