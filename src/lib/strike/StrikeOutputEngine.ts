/**
 * StrikeOutputEngine — orchestrates 5-Part Strike Hierarchy generation.
 *
 * Generation order:
 * 1. Attempt Claude 3.5 Sonnet via ClaudeStrikeEngine (5-second timeout)
 * 2. Validate output via StrikeValidator
 * 3. If Claude fails or validation fails → Template_Fallback
 * 4. Persist to Supabase via InstrumentArchive
 *
 * The caller always receives a valid StrikeOutput — never throws.
 */

import { generate as claudeGenerate, ClaudeApiError } from './ClaudeStrikeEngine';
import { validate } from './StrikeValidator';
import { save } from '@/lib/instruments/InstrumentArchive';
import { getStore, type InMemoryStore } from '@/lib/store/InMemoryStore';
import type { StrikeRequest, StrikeOutput, StructuredContext } from './types';

const CLAUDE_TIMEOUT_MS = 5000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(Object.assign(new Error(`Claude timed out after ${ms}ms`), { code: 'CLAUDE_TIMEOUT' })),
        ms
      )
    ),
  ]);
}

/**
 * Generates a Strike Output for the given request.
 * Always returns a valid StrikeOutput — never throws.
 */
export async function generate(request: StrikeRequest): Promise<StrikeOutput> {
  const store = getStore();
  const context = await assembleContext(request, store);

  let generatedBy: StrikeOutput['generatedBy'] = 'template-fallback';
  let rawOutput: string | null = null;

  // Step 1: Attempt Claude generation with 5-second timeout
  try {
    const claudeResult = await withTimeout(claudeGenerate(context), CLAUDE_TIMEOUT_MS);

    // Step 2: Validate Claude output
    const validation = validate(claudeResult.output);

    if (validation.valid) {
      rawOutput = claudeResult.output;
      generatedBy = 'claude-engine';
    } else {
      console.warn(
        '[StrikeOutputEngine] Claude output failed validation, falling back to template:',
        validation.failures
      );
    }
  } catch (err) {
    const code = err instanceof ClaudeApiError ? 'CLAUDE_API_UNAVAILABLE' : 'CLAUDE_TIMEOUT';
    console.warn(`[StrikeOutputEngine] ${code} — falling back to template:`, err);
  }

  // Step 3: Template fallback if Claude failed or validation failed
  const sections: StrikeOutput['sections'] =
    rawOutput !== null
      ? parseSections(rawOutput)
      : generateTemplateSections(request, store);

  const output: StrikeOutput = {
    title: `Imperial Strike — ${request.targetSlugs.join(', ')}`,
    sections,
    generatedAt: new Date().toISOString(),
    requestedBy: request.userId,
    generatedBy,
  };

  // Step 4: Persist to Supabase
  try {
    const id = await save(output);
    output.id = id;
  } catch (err) {
    console.error('[StrikeOutputEngine] Failed to persist instrument:', err);
    // Do not throw — return the output even if persistence failed
  }

  return output;
}

/**
 * Assembles StructuredContext from the in-memory store and request.
 */
async function assembleContext(
  request: StrikeRequest,
  store: InMemoryStore
): Promise<StructuredContext> {
  const searchQuery = request.directive ?? request.targetSlugs[0] ?? '';

  const pillars = store.pillarSearchIndex
    ? store.pillarSearchIndex.search(searchQuery).slice(0, 5).map((r) => r.item)
    : [];

  const osModules = request.targetSlugs
    .slice(0, 3)
    .map((slug) => store.osModules.get(slug))
    .filter((m): m is NonNullable<typeof m> => m !== undefined);

  const libraryEntries = store.librarySearchIndex
    ? store.librarySearchIndex.search(searchQuery).slice(0, 3).map((r) => r.item)
    : [];

  return {
    intent: request.directive ?? `Generate Strike Output for: ${request.targetSlugs.join(', ')}`,
    pillars,
    osModules,
    libraryEntries,
    latestAllocation: null,
  };
}

/**
 * Parses a validated Claude output string into 5 StrikeSection objects.
 */
function parseSections(output: string): StrikeOutput['sections'] {
  const sectionLabels = [
    'Executive Analysis',
    'OS Stress Test',
    'The Imperial Instrument',
    'Action Plan (T-Minus 24 Hours)',
    'The Ritual',
  ];

  const parts = output.split(/^## .+$/m);
  const bodies = parts.slice(1);

  return sectionLabels.map((label, i) => ({
    label,
    content: (bodies[i] ?? '').trim(),
    isPlaceholder: false,
  })) as StrikeOutput['sections'];
}

/**
 * Generates template-based sections when Claude is unavailable.
 */
function generateTemplateSections(
  request: StrikeRequest,
  store: InMemoryStore
): StrikeOutput['sections'] {
  const slugList = request.targetSlugs.join(', ');
  const now = new Date().toISOString();

  return [
    {
      label: 'Executive Analysis',
      content: `[TEMPLATE] Strategic analysis for OS Modules: ${slugList}. ` +
        `Directive: ${request.directive ?? 'General strike output'}. ` +
        `Generated at ${now}. ` +
        `Active OS Modules in registry: ${store.osModules.size}. ` +
        `Active Pillars in registry: ${store.pillars.size}.`,
      isPlaceholder: false,
    },
    {
      label: 'OS Stress Test',
      content: `[TEMPLATE] Three-path stress test for ${slugList}:\n` +
        `Golden Path (Success): Optimal execution of all referenced OS Modules.\n` +
        `Stagnation Path: Partial execution with resource constraints.\n` +
        `Black Swan (Failure): Critical system failure — activate contingency protocols.`,
      isPlaceholder: false,
    },
    {
      label: 'The Imperial Instrument',
      content: `[TEMPLATE] Formal instrument pending assignment of DH-RES identifier. ` +
        `Target modules: ${slugList}. Mathematical model: $E = mc^2$ (placeholder). ` +
        `Issued under Imperial Codex v16.2 authority.`,
      isPlaceholder: false,
    },
    {
      label: 'Action Plan (T-Minus 24 Hours)',
      content: `[TEMPLATE] Three-strike action plan:\n` +
        `Extraction (Resource): Mobilise capital resources for ${slugList}.\n` +
        `Citadel (Infrastructure): Reinforce operational infrastructure.\n` +
        `Sovereign (Decree): Issue formal decree under Kernel v16.2.`,
      isPlaceholder: false,
    },
    {
      label: 'The Ritual',
      content: `[TEMPLATE] Ke nako ya go bopa maatla. Tempus est potentiam formare.\n` +
        `Grabovoi Code: 520 741 8 (Activation of Strategic Intent)\n` +
        `Sigil Reference: ⊕ Imperial Seal — Dalizebo Holdings`,
      isPlaceholder: false,
    },
  ] as StrikeOutput['sections'];
}
