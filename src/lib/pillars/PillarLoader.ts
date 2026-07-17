/**
 * PillarLoader - Loads and initializes pillars from the /core/PILLARS.md file
 */

export const PILLAR_CODE_MIN = 0;
export const PILLAR_CODE_MAX = 999;

export function padCode(code: number): string {
  return code.toString().padStart(3, '0');
}

export async function loadPillars(): Promise<void> {
  console.log('[PillarLoader] Loading pillars...');
  // TODO: Implement pillar loading logic
}
