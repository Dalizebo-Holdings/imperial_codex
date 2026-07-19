import { getStore } from '@/lib/store/InMemoryStore';
import type { LibraryEntry, LibrarySearchResult } from './types';

function withTimeout<T>(promise: Promise<T>, ms: number, code: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject({ code, message: `Operation timed out after ${ms}ms` }), ms)
    ),
  ]);
}

export class LibraryService {
  getById(id: string): LibraryEntry | null {
    return getStore().library.get(id) ?? null;
  }

  async search(query: string): Promise<LibrarySearchResult[]> {
    if (!query.trim()) return [];
    return withTimeout(
      Promise.resolve(
        getStore().librarySearchIndex.search(query).map((r) => ({ entry: r.item, score: r.score ?? 1 }))
      ),
      1000,
      'LIBRARY_SEARCH_TIMEOUT'
    );
  }

  findBySlug(slug: string): LibraryEntry[] {
    return [...getStore().library.values()].filter((e) => e.osModuleSlugs.includes(slug));
  }

  getAll(): LibraryEntry[] {
    return [...getStore().library.values()];
  }
}

export const libraryService = new LibraryService();
