/**
 * Library types for Imperial Codex v16
 *
 * 345 Library_Entry records — the Imperial Knowledge Base.
 */

export interface LibraryEntry {
  id: string;
  title: string;
  body: string;
  /** OS_Module slugs this entry is tagged with (at least one) */
  osModuleSlugs: string[];
  /** Optional slug alias for URL-friendly access */
  slug?: string;
  tags?: string[];
  /** Slug tags for library entries */
  slugTags?: string[];
}

export interface LibrarySearchResult {
  entry: LibraryEntry;
  /** Fuse.js relevance score (lower = more relevant) */
  score: number;
}
