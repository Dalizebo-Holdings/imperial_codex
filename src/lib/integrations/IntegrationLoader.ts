import fs from 'fs';
import path from 'path';
import { getStore } from '@/lib/store/InMemoryStore';
import type { Integration } from './types';

const INTEGRATIONS_FILE = path.join(process.cwd(), 'core', 'INTEGRATIONS.json');

export async function loadIntegrations(): Promise<void> {
  const store = getStore();

  if (!fs.existsSync(INTEGRATIONS_FILE)) {
    console.warn('[IntegrationLoader] INTEGRATIONS.json not found — skipping');
    return;
  }

  try {
    const raw = fs.readFileSync(INTEGRATIONS_FILE, 'utf-8');
    const records: Integration[] = JSON.parse(raw);
    const integrations = new Map<string, Integration>();

    for (const rec of records) {
      if (!rec.id || !rec.sourceSlug || !rec.targetSlugs?.length || !rec.relationshipType) {
        console.warn(`[IntegrationLoader] Invalid integration record: ${JSON.stringify(rec)} — skipping`);
        continue;
      }
      integrations.set(rec.id, rec);
    }

    store.integrations = integrations;
    console.log(`[IntegrationLoader] Loaded ${integrations.size} integrations`);
  } catch (err) {
    console.warn('[IntegrationLoader] Failed to load integrations:', err);
  }
}
