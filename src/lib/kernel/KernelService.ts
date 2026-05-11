/**
 * KernelService — thin read-only facade over the InMemoryStore's kernel field.
 *
 * Populated by KernelLoader during the startup sequence (instrumentation.ts).
 * All runtime code should read kernel state through this service rather than
 * accessing the store directly.
 */

import { getStore } from '@/lib/store/InMemoryStore';
import type { KernelState, KernelStatus } from './types';

export class KernelService {
  /**
   * Returns the full KernelState as loaded at startup.
   */
  getState(): KernelState {
    return getStore().kernel;
  }

  /**
   * Returns just the KernelStatus ('active' | 'halted').
   * Used by middleware for the kernel-halted guard.
   */
  getStatus(): KernelStatus {
    return getStore().kernel.status;
  }
}

// Singleton instance — import this rather than constructing a new one.
export const kernelService = new KernelService();
