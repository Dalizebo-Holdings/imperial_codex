/**
 * Kernel types for Imperial Codex v16
 */

export type KernelStatus = 'active' | 'halted';

export interface KernelState {
  version: string;
  status: KernelStatus;
  osModuleSlugs: string[];
  loadedAt: string; // ISO 8601 UTC
}
