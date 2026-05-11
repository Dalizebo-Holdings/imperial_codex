/**
 * Agent types for Imperial Codex AI Agent.
 */

export interface LoopEvaluationSummary {
  /** ISO 8601 UTC — when this cron run executed */
  runAt: string;
  /** Total number of loops evaluated */
  totalEvaluated: number;
  /** Number of loops that were triggered */
  triggered: number;
  /** Number of loops skipped (already triggered in this window) */
  skipped: number;
  /** Number of loops that errored during evaluation */
  errors: number;
}

export interface WebhookAlertPayload {
  loopId: string;
  loopTitle: string;
  /** ISO 8601 UTC */
  triggeredAt: string;
  targetSlug: string;
  outputAction: string;
  severity: 'critical';
}
