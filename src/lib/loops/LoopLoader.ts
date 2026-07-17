import fs from 'fs';
import path from 'path';
import { getStore } from '@/lib/store/InMemoryStore';
import type { RecursiveLoop } from './types';

const LOOPS_FILE = path.join(process.cwd(), 'core', 'LOOPS.json');

export async function loadLoops(): Promise<void> {
  const store = getStore();

  if (!fs.existsSync(LOOPS_FILE)) {
    console.warn('[LoopLoader] LOOPS.json not found — skipping');
    return;
  }

  try {
    const raw = fs.readFileSync(LOOPS_FILE, 'utf-8');
    const records: RecursiveLoop[] = JSON.parse(raw);
    const loops = new Map<string, RecursiveLoop>();

    for (const loop of records) {
      if (!loop.id || !loop.condition || !loop.actionLabel) {
        console.warn(`[LoopLoader] Invalid loop record: ${loop.id ?? 'unknown'} — skipping`);
        continue;
      }

      const hasValidSlug = loop.referencedSlugs?.some((slug) => store.osModules.has(slug));
      if (!hasValidSlug) {
        console.error(`[LoopLoader] LOOP_BROKEN_REFERENCE: Loop ${loop.id} references no registered slugs`);
      }

      loops.set(loop.id, { ...loop, enabled: loop.enabled ?? true });
    }

    store.loops = loops;
    console.log(`[LoopLoader] Loaded ${loops.size} loops`);
  } catch (err) {
    console.warn('[LoopLoader] Failed to load loops:', err);
  }
}
