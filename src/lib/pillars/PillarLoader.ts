/**
 * PillarLoader — parses /core/PILLARS.md and populates the InMemoryStore.
 *
 * PILLARS.md uses a multi-document format where each pillar is delimited by
 * --- front-matter blocks containing code, cluster, and title fields.
 */

import fs from 'fs';
import path from 'path';
import Fuse from 'fuse.js';
import { getStore } from '@/lib/store/InMemoryStore';
import type { Pillar, PillarCluster } from './types';

export const PILLAR_CODE_MIN = 1;
export const PILLAR_CODE_MAX = 207;

export function padCode(code: number): string {
  return code.toString().padStart(3, '0');
}

const PILLARS_FILE = path.join(process.cwd(), 'core', 'PILLARS.md');

const VALID_CLUSTERS: PillarCluster[] = [
  'Fiscal Weaponization',
  'Hegemony & Capture',
  'Infrastructure & Physical Dominance',
  'Cognitive Dominance & Succession',
  'Singularity Laws',
];

/**
 * Parses the multi-document PILLARS.md format.
 * Each pillar: ---\ncode/cluster/title fields\n---\n\nbody text\n
 */
function parsePillarsMarkdown(content: string): Pillar[] {
  const pillars: Pillar[] = [];
  // Split on lines that are exactly ---
  const blocks = content.split(/^---$/m).map((b) => b.trim()).filter(Boolean);

  let i = 0;
  while (i < blocks.length) {
    const frontMatter = blocks[i];
    const body = blocks[i + 1] ?? '';

    if (frontMatter.includes('code:')) {
      const codeMatch = frontMatter.match(/^code:\s*"?(\d+)"?/m);
      const clusterMatch = frontMatter.match(/^cluster:\s*"?([^"\n]+)"?/m);
      const titleMatch = frontMatter.match(/^title:\s*"?([^"\n]+)"?/m);

      if (codeMatch && clusterMatch && titleMatch) {
        const code = codeMatch[1].padStart(3, '0');
        const cluster = clusterMatch[1].trim() as PillarCluster;
        const title = titleMatch[1].trim();
        const pillarBody = body.trim();

        if (VALID_CLUSTERS.includes(cluster)) {
          pillars.push({ code, cluster, title, body: pillarBody });
        } else {
          console.warn(`[PillarLoader] Unknown cluster "${cluster}" for pillar ${code} — skipping`);
        }
      }
      i += 2;
    } else {
      i += 1;
    }
  }

  return pillars;
}

export async function loadPillars(): Promise<void> {
  const store = getStore();

  if (!fs.existsSync(PILLARS_FILE)) {
    console.warn('[PillarLoader] PILLARS.md not found — skipping');
    return;
  }

  const raw = fs.readFileSync(PILLARS_FILE, 'utf-8');
  const parsed = parsePillarsMarkdown(raw);
  const pillars = new Map<string, Pillar>();

  for (const pillar of parsed) {
    const num = parseInt(pillar.code, 10);
    if (num < PILLAR_CODE_MIN || num > PILLAR_CODE_MAX) {
      console.warn(`[PillarLoader] Pillar code ${pillar.code} out of range — skipping`);
      continue;
    }
    if (pillars.has(pillar.code)) {
      console.warn(`[PillarLoader] Duplicate pillar code ${pillar.code} — skipping`);
      continue;
    }
    pillars.set(pillar.code, pillar);
  }

  const pillarSearchIndex = new Fuse<Pillar>([...pillars.values()], {
    keys: [
      { name: 'title', weight: 0.6 },
      { name: 'body', weight: 0.3 },
      { name: 'cluster', weight: 0.1 },
    ],
    includeScore: true,
    threshold: 0.4,
  });

  store.pillars = pillars;
  store.pillarSearchIndex = pillarSearchIndex;

  console.log(`[PillarLoader] Loaded ${pillars.size} pillars`);
}
