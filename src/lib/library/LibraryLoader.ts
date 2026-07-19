/**
 * LibraryLoader — parses /core/LIBRARY.md and populates the InMemoryStore.
 *
 * LIBRARY.md uses a multi-document format where each entry is delimited by
 * --- front-matter blocks containing id, title, and tags fields.
 */

import fs from 'fs';
import path from 'path';
import Fuse from 'fuse.js';
import { getStore } from '@/lib/store/InMemoryStore';
import { CANONICAL_SLUGS } from '@/lib/kernel/KernelLoader';
import type { LibraryEntry } from './types';

const LIBRARY_FILE = path.join(process.cwd(), 'core', 'LIBRARY.md');

/**
 * Parses the multi-document LIBRARY.md format.
 * Each entry: ---\nid/title/tags fields\n---\n\nbody text\n
 */
function parseLibraryMarkdown(content: string): LibraryEntry[] {
  const entries: LibraryEntry[] = [];
  const blocks = content.split(/^---$/m).map((b) => b.trim()).filter(Boolean);

  let i = 0;
  while (i < blocks.length) {
    const frontMatter = blocks[i];
    const body = blocks[i + 1] ?? '';

    if (frontMatter.includes('id:')) {
      const idMatch = frontMatter.match(/^id:\s*"?([^"\n]+)"?/m);
      const titleMatch = frontMatter.match(/^title:\s*"?([^"\n]+)"?/m);
      // tags: ["TAG-OS", "OTHER-OS"]
      const tagsMatch = frontMatter.match(/^tags:\s*\[([^\]]*)\]/m);

      if (idMatch && titleMatch) {
        const id = idMatch[1].trim();
        const title = titleMatch[1].trim();
        const entryBody = body.trim();

        let tags: string[] = [];
        if (tagsMatch) {
          tags = tagsMatch[1]
            .split(',')
            .map((t) => t.trim().replace(/^"|"$/g, ''))
            .filter(Boolean);
        }

        // At least one tag must be a registered OS_Module slug
        const osModuleSlugs = tags.filter((t) => CANONICAL_SLUGS.has(t));
        const sanitize = (s: string) => s.replace(/[\r\n]/g, '');
        if (osModuleSlugs.length === 0) {
          console.warn(`[LibraryLoader] Entry ${sanitize(id)} has no registered OS_Module slug tags — skipping`);
          i += 2;
          continue;
        }

        entries.push({ id, title, body: entryBody, osModuleSlugs, tags });
      }
      i += 2;
    } else {
      i += 1;
    }
  }

  return entries;
}

export async function loadLibrary(): Promise<void> {
  const store = getStore();

  if (!fs.existsSync(LIBRARY_FILE)) {
    console.warn('[LibraryLoader] LIBRARY.md not found — skipping');
    return;
  }

  const raw = fs.readFileSync(LIBRARY_FILE, 'utf-8');
  const parsed = parseLibraryMarkdown(raw);
  const library = new Map<string, LibraryEntry>();

  for (const entry of parsed) {
    const sanitize = (s: string) => s.replace(/[\r\n]/g, '');
    if (library.has(entry.id)) {
      console.warn(`[LibraryLoader] Duplicate library entry ID ${sanitize(entry.id)} — skipping`);
      continue;
    }
    library.set(entry.id, entry);
  }

  const librarySearchIndex = new Fuse<LibraryEntry>([...library.values()], {
    keys: [
      { name: 'title', weight: 0.6 },
      { name: 'body', weight: 0.3 },
      { name: 'tags', weight: 0.1 },
    ],
    includeScore: true,
    threshold: 0.4,
  });

  store.library = library;
  store.librarySearchIndex = librarySearchIndex;

  console.log(`[LibraryLoader] Loaded ${library.size} library entries`);
}
