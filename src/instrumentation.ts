/**
 * Next.js instrumentation hook — runs once on cold start.
 *
 * Startup sequence:
 * 1. StructuralIntegrityCheck — warns on missing dirs/files
 * 2. KernelLoader             — reads /core/KERNEL_V16_MASTER.md
 * 3. DataLoader (parallel)    — Pillars, OS Modules, Integrations, Loops, Library
 * 4. SearchIndexBuilder       — built within each loader
 * 5. SupabaseRepository.init()— validates env vars, creates Supabase clients
 */

export async function register() {
  // Only run on the Node.js runtime (not Edge)
  if (process.env.NEXT_RUNTIME === 'edge') return;

  // Step 1: Structural integrity check
  try {
    const { checkStructuralIntegrity } = await import('@/lib/structural/StructuralIntegrityCheck');
    const integrityResult = checkStructuralIntegrity();
    if (!integrityResult.ok) {
      console.warn(
        `[Startup] STRUCTURAL_INTEGRITY_WARNING: Missing paths: ${integrityResult.missingPaths.join(', ')}`
      );
    }
  } catch (err) {
    console.warn('[Startup] StructuralIntegrityCheck not available:', err);
  }

  // Step 2: Kernel loader
  try {
    const { loadKernel } = await import('@/lib/kernel/KernelLoader');
    const kernelState = await loadKernel();
    if (kernelState.status === 'halted') {
      console.error('[Startup] Kernel halted — all API routes will return 503 KERNEL_HALTED');
    }
  } catch (err) {
    console.warn('[Startup] KernelLoader not available:', err);
  }

  // Step 3: Data loaders (parallel) — each is optional during v16 task completion
  const loaderPromises: Promise<void>[] = [];

  const tryLoad = async (name: string, loader: () => Promise<void>) => {
    try {
      await loader();
    } catch (err) {
      console.warn(`[Startup] ${name} not available:`, err);
    }
  };

  loaderPromises.push(
    tryLoad('PillarLoader', async () => {
      const { loadPillars } = await import('@/lib/pillars/PillarLoader');
      await loadPillars();
    }),
    tryLoad('OSModuleLoader', async () => {
      const { loadOSModules } = await import('@/lib/os-modules/OSModuleLoader');
      await loadOSModules();
    }),
    tryLoad('IntegrationLoader', async () => {
      const { loadIntegrations } = await import('@/lib/integrations/IntegrationLoader');
      await loadIntegrations();
    }),
    tryLoad('LoopLoader', async () => {
      const { loadLoops } = await import('@/lib/loops/LoopLoader');
      await loadLoops();
    }),
    tryLoad('LibraryLoader', async () => {
      const { loadLibrary } = await import('@/lib/library/LibraryLoader');
      await loadLibrary();
    })
  );

  await Promise.all(loaderPromises);

  // Step 5: Supabase repository init
  // If env vars are missing, enters degraded state (logs warning, does not halt)
  try {
    const { init: initSupabase } = await import('@/lib/db/supabase');
    initSupabase();
  } catch (err) {
    console.warn('[Startup] SupabaseRepository init failed:', err);
  }

  console.log('[Startup] Imperial Codex v16 initialisation complete');
}
