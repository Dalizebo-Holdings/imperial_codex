import { getStore } from '@/lib/store/InMemoryStore';
import type { OSModule, OSModuleCluster } from './types';

const CLUSTER_ORDER: OSModuleCluster[] = [
  'Architecture of Power',
  'Economic Fortress',
  'Machinery of War',
  'Influence & Domain',
];

function withTimeout<T>(promise: Promise<T>, ms: number, code: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject({ code, message: `Operation timed out after ${ms}ms` }), ms)
    ),
  ]);
}

export class OSModuleService {
  getBySlug(slug: string): OSModule | null {
    return getStore().osModules.get(slug) ?? null;
  }

  getAllGrouped(): Record<OSModuleCluster, OSModule[]> {
    const store = getStore();
    const grouped = Object.fromEntries(
      CLUSTER_ORDER.map((c) => [c, [] as OSModule[]])
    ) as Record<OSModuleCluster, OSModule[]>;

    for (const mod of store.osModules.values()) {
      grouped[mod.cluster]?.push(mod);
    }

    for (const cluster of CLUSTER_ORDER) {
      grouped[cluster].sort((a, b) => a.slug.localeCompare(b.slug));
    }

    return grouped;
  }

  async search(query: string): Promise<OSModule[]> {
    if (!query.trim()) return [];
    return withTimeout(
      Promise.resolve(
        getStore().osModuleSearchIndex.search(query).map((r) => r.item)
      ),
      1000,
      'OS_MODULE_SEARCH_TIMEOUT'
    );
  }
}

export const osModuleService = new OSModuleService();
