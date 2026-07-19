/**
 * ClearanceGate — enforces clearance-level access control.
 *
 * Level 0: authenticated, no sensitive data
 * Level 1: sensitive data (FNB, Vault, proprietary IP)
 *
 * Every gate event (granted or denied) is appended to the audit log.
 */

import { append } from './AuditLog';
import type { SessionData, GateDecision } from './types';

export class ClearanceGate {
  /**
   * Verifies that the session has sufficient clearance for the resource.
   * Appends an audit log entry for every call.
   */
  async verify(
    session: SessionData | null | undefined,
    resource: string,
    requireLevel1: boolean
  ): Promise<GateDecision> {
    const timestamp = new Date().toISOString();

    if (!session?.isAuthenticated) {
      await append({
        userId: session?.userId ?? 'anonymous',
        resource,
        clearanceLevel: session?.clearanceLevel ?? 0,
        decision: 'denied',
        timestamp,
      });
      return { granted: false, code: 'UNAUTHENTICATED' };
    }

    if (requireLevel1 && session.clearanceLevel < 1) {
      await append({
        userId: session.userId,
        resource,
        clearanceLevel: session.clearanceLevel,
        decision: 'denied',
        timestamp,
      });
      return { granted: false, code: 'CLEARANCE_DENIED' };
    }

    await append({
      userId: session.userId,
      resource,
      clearanceLevel: session.clearanceLevel,
      decision: 'granted',
      timestamp,
    });

    return { granted: true };
  }
}

export const clearanceGate = new ClearanceGate();
