'use client';

/**
 * GlobalSearchBar — debounced cross-entity search across Pillars, OS Modules, and Library.
 * Queries all three APIs in parallel and renders consolidated results.
 */

import { useState, useCallback, useRef } from 'react';

interface SearchResult {
  type: 'pillar' | 'os-module' | 'library';
  id: string;
  title: string;
  href: string;
}

export function GlobalSearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const [pillarsRes, modulesRes, libraryRes] = await Promise.allSettled([
        fetch(`/api/pillars?q=${encodeURIComponent(q)}`).then((r) => r.json()),
        fetch(`/api/os-modules?q=${encodeURIComponent(q)}`).then((r) => r.json()),
        fetch(`/api/library?q=${encodeURIComponent(q)}`).then((r) => r.json()),
      ]);

      const combined: SearchResult[] = [];

      if (pillarsRes.status === 'fulfilled' && pillarsRes.value?.pillars) {
        for (const p of pillarsRes.value.pillars.slice(0, 3)) {
          combined.push({ type: 'pillar', id: p.code, title: p.title, href: `/pillars/${p.code}` });
        }
      }

      if (modulesRes.status === 'fulfilled' && modulesRes.value?.osModules) {
        for (const m of modulesRes.value.osModules.slice(0, 3)) {
          combined.push({ type: 'os-module', id: m.slug, title: m.slug, href: `/os-modules/${m.slug}` });
        }
      }

      if (libraryRes.status === 'fulfilled' && libraryRes.value?.entries) {
        for (const e of libraryRes.value.entries.slice(0, 3)) {
          combined.push({ type: 'library', id: e.id, title: e.title, href: `/library/${e.id}` });
        }
      }

      setResults(combined);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
  };

  return (
    <div className="relative w-full max-w-2xl">
      <label htmlFor="global-search" className="sr-only">Search Pillars, OS Modules, and Library</label>
      <input
        id="global-search"
        type="search"
        value={query}
        onChange={handleChange}
        placeholder="Search Pillars, OS Modules, Library…"
        className="w-full bg-gray-800 text-white placeholder-gray-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        autoComplete="off"
        aria-label="Global search"
        aria-expanded={results.length > 0}
        aria-haspopup="listbox"
      />
      {isSearching && (
        <span className="absolute right-3 top-3 text-gray-400 text-xs" aria-live="polite">Searching…</span>
      )}
      {results.length > 0 && (
        <ul
          role="listbox"
          className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10 overflow-hidden"
          aria-label="Search results"
        >
          {results.map((result) => (
            <li key={`${result.type}-${result.id}`} role="option" aria-selected={false}>
              <a
                href={result.href}
                className="flex items-center gap-3 px-4 py-2 hover:bg-gray-700 text-sm"
              >
                <span className="text-xs text-gray-400 uppercase w-16 shrink-0">{result.type}</span>
                <span className="text-white truncate">{result.title}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
