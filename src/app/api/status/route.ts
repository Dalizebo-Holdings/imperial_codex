import { getStore } from '@/lib/store/InMemoryStore';

export async function GET() {
  const store = getStore();
  return Response.json({
    version: store.kernel.version,
    status: store.kernel.status,
    loadedAt: store.kernel.loadedAt,
    counts: {
      pillars: store.pillars.size,
      osModules: store.osModules.size,
      integrations: store.integrations.size,
      loops: store.loops.size,
      library: store.library.size,
    },
  });
}
