/**
 * InMemoryStore — singleton in-memory data store for Imperial Codex v16.
 *
 * Populated once during startup (instrumentation.ts → DataLoader).
 * Read-only at runtime. All Maps are keyed by their primary identifier:
 *   pillars      → code (e.g. "001")
 *   osModules    → slug (e.g. "TAX-OS")
 *   integrations → id
 *   loops        → id
 *   library      → id
 */

import Fuse, { type IFuseOptions } from 'fuse.js';
import type { KernelState } from '@/lib/kernel/types';
import type { Pillar } from '@/lib/pillars/types';
import type { OSModule } from '@/lib/os-modules/types';
import type { Integration } from '@/lib/integrations/types';
import type { RecursiveLoop } from '@/lib/loops/types';
import type { LibraryEntry } from '@/lib/library/types';

export interface InMemoryStore {
  kernel: KernelState;
  pillars: Map<string, Pillar>;
  osModules: Map<string, OSModule>;
  integrations: Map<string, Integration>;
  loops: Map<string, RecursiveLoop>;
  library: Map<string, LibraryEntry>;
  pillarSearchIndex: Fuse<Pillar>;
  librarySearchIndex: Fuse<LibraryEntry>;
  osModuleSearchIndex: Fuse<OSModule>;
}

// ---------------------------------------------------------------------------
// Default (empty) Fuse options — loaders will rebuild with real data.
// ---------------------------------------------------------------------------

const DEFAULT_PILLAR_FUSE_OPTIONS: IFuseOptions<Pillar> = {
  keys: [
    { name: 'title', weight: 0.6 },
    { name: 'body', weight: 0.3 },
    { name: 'cluster', weight: 0.1 },
  ],
  includeScore: true,
  threshold: 0.4,
};

const DEFAULT_LIBRARY_FUSE_OPTIONS: IFuseOptions<LibraryEntry> = {
  keys: [
    { name: 'title', weight: 0.6 },
    { name: 'body', weight: 0.3 },
    { name: 'tags', weight: 0.1 },
  ],
  includeScore: true,
  threshold: 0.4,
};

const DEFAULT_OS_MODULE_FUSE_OPTIONS: IFuseOptions<OSModule> = {
  keys: [
    { name: 'title', weight: 0.5 },
    { name: 'description', weight: 0.4 },
    { name: 'slug', weight: 0.1 },
  ],
  includeScore: true,
  threshold: 0.4,
};

// ---------------------------------------------------------------------------
// Singleton instance
// ---------------------------------------------------------------------------

let _store: InMemoryStore | null = null;

/**
 * Returns the singleton InMemoryStore, creating it with empty collections
 * if it has not yet been initialised. The DataLoader (called from
 * instrumentation.ts) will populate the store before any request is served.
 */
export function getStore(): InMemoryStore {
  if (_store === null) {
    _store = {
      kernel: {
        version: 'v16.2',
        status: 'halted', // halted until KernelLoader validates and sets active
        osModuleSlugs: [],
        loadedAt: new Date().toISOString(),
      },
      pillars: new Map<string, Pillar>(),
      osModules: new Map<string, OSModule>(),
      integrations: new Map<string, Integration>(),
      loops: new Map<string, RecursiveLoop>(),
      library: new Map<string, LibraryEntry>(),
      pillarSearchIndex: new Fuse<Pillar>([], DEFAULT_PILLAR_FUSE_OPTIONS),
      librarySearchIndex: new Fuse<LibraryEntry>([], DEFAULT_LIBRARY_FUSE_OPTIONS),
      osModuleSearchIndex: new Fuse<OSModule>([], DEFAULT_OS_MODULE_FUSE_OPTIONS),
    };
  }
  return _store;
}

/**
 * Replaces the singleton store with a fully-populated instance.
 * Called by the DataLoader after all loaders have completed.
 * Should not be called outside of startup or test setup.
 */
export function setStore(store: InMemoryStore): void {
  _store = store;
}

/**
 * Resets the singleton to null. Intended for use in tests only.
 */
export function resetStore(): void {
  _store = null;
}
