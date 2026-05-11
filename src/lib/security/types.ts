/**
 * Security types for Imperial Codex v16
 *
 * Session management via iron-session (cookie name: imperial-session, maxAge: 86400s).
 * Clearance Gate enforces Level 1 access for sensitive data.
 * Audit log records every gate event.
 */

export interface SessionData {
  userId: string;
  clearanceLevel: number;
  /** ISO 8601 UTC — when the session was issued */
  issuedAt: string;
  /** Whether the session is authenticated */
  isAuthenticated: boolean;
}

export type GateDecision =
  | { granted: true }
  | { granted: false; code: 'UNAUTHENTICATED' | 'CLEARANCE_DENIED' };

export interface AuditLogEntry {
  userId: string;
  resource: string;
  clearanceLevel: number;
  decision: 'granted' | 'denied';
  /** UTC ISO 8601 */
  timestamp: string;
}
