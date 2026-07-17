import { getStore } from '@/lib/store/InMemoryStore';
import type { IntegrationMap } from './types';

function withTimeout<T>(promise: Promise<T>, ms: number, code: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject({ code, message: `Operation timed out after ${ms}ms` }), ms)
    ),
  ]);
}

export class IntegrationService {
  async getMap(slug: string): Promise<IntegrationMap> {
    return withTimeout(
      Promise.resolve(this._getMap(slug)),
      500,
      'INTEGRATION_MAP_TIMEOUT'
    );
  }

  private _getMap(slug: string): IntegrationMap {
    const store = getStore();
    const outbound = [];
    const inbound = [];

    for (const integration of store.integrations.values()) {
      if (integration.sourceSlug === slug) outbound.push(integration);
      if (integration.targetSlugs.includes(slug)) inbound.push(integration);
    }

    return { outbound, inbound };
  }
}

export const integrationService = new IntegrationService();
