/**
 * Recursive Loop types for Imperial Codex v16
 *
 * 104 Recursive_Loop definitions — IF/THEN automated logic chains.
 */

export interface RecursiveLoop {
  id: string;
  name: string;
  /** The IF condition expression */
  condition: string;
  /** The THEN action label */
  actionLabel: string;
  /** OS_Module slugs referenced by this loop */
  referencedSlugs: string[];
  enabled: boolean;
}

export interface LoopTriggerEvent {
  /** The condition string to match against loop definitions */
  condition: string;
  /** Optional target OS_Module slug to scope the trigger */
  targetSlug?: string;
  /** ISO 8601 UTC timestamp of the triggering event */
  timestamp: string;
  /** Arbitrary metadata about the event */
  metadata?: Record<string, unknown>;
}

export interface LoopExecutionRecord {
  loopId: string;
  /** UTC ISO 8601 */
  triggerTimestamp: string;
  matchedCondition: string;
  targetSlug: string;
  outputActionLabel: string;
}
