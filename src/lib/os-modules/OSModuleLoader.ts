import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Fuse from 'fuse.js';
import { getStore } from '@/lib/store/InMemoryStore';
import type { OSModule, OSModuleCluster } from './types';

const OS_MODULES_DIR = path.join(process.cwd(), 'os-modules');

const VALID_CLUSTERS: OSModuleCluster[] = [
  'Architecture of Power',
  'Economic Fortress',
  'Machinery of War',
  'Influence & Domain',
];

const SLUG_PATTERN = /^[A-Z][A-Z-]{2,19}$/;

export async function loadOSModules(): Promise<void> {
  const store = getStore();

  if (!fs.existsSync(OS_MODULES_DIR)) {
    console.warn('[OSModuleLoader] OS_MODULE_REGISTRY_UNAVAILABLE: /os-modules directory not found');
    return;
  }

  const files = fs.readdirSync(OS_MODULES_DIR).filter((f) => f.endsWith('.md'));
  const modules = new Map<string, OSModule>();

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(OS_MODULES_DIR, file), 'utf-8');
      const { data, content } = matter(raw);

      const slug: string = data.slug ?? file.replace('.md', '');

      if (!SLUG_PATTERN.test(slug)) {
        console.warn(`[OSModuleLoader] Invalid slug format: ${slug} — skipping`);
        continue;
      }

      if (modules.has(slug)) {
        console.warn(`[OSModuleLoader] Duplicate slug: ${slug} — skipping`);
        continue;
      }

      const cluster: OSModuleCluster = data.cluster ?? 'Machinery of War';
      if (!VALID_CLUSTERS.includes(cluster)) {
        console.warn(`[OSModuleLoader] Invalid cluster "${cluster}" for ${slug} — defaulting`);
      }

      modules.set(slug, {
        slug,
        cluster: VALID_CLUSTERS.includes(cluster) ? cluster : 'Machinery of War',
        title: data.title ?? slug,
        description: data.description ?? content.trim().slice(0, 200),
        linkedPillarCodes: data.linkedPillarCodes ?? [],
        linkedIntegrationIds: data.linkedIntegrationIds ?? [],
      });
    } catch (err) {
      console.warn(`[OSModuleLoader] Failed to parse ${file}:`, err);
    }
  }

  const osModuleSearchIndex = new Fuse<OSModule>([...modules.values()], {
    keys: [
      { name: 'title', weight: 0.5 },
      { name: 'description', weight: 0.4 },
      { name: 'slug', weight: 0.1 },
    ],
    includeScore: true,
    threshold: 0.4,
  });

  store.osModules = modules;
  store.osModuleSearchIndex = osModuleSearchIndex;

  console.log(`[OSModuleLoader] Loaded ${modules.size} OS modules`);
}
