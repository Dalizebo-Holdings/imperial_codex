/**
 * Strike Output types for Imperial Codex v16 + AI Agent extension.
 *
 * Every Strike_Output conforms to the 5-Part Strike Hierarchy:
 *   1. Executive Analysis
 *   2. OS Stress Test
 *   3. The Imperial Instrument
 *   4. Action Plan (T-Minus 24 Hours)
 *   5. The Ritual
 */

import type { Pillar } from '@/lib/pillars/types';
import type { OSModule } from '@/lib/os-modules/types';
import type { LibraryEntry } from '@/lib/library/types';
import type { AllocationRecord } from '@/lib/capital/types';
import type { LoopExecutionLogRow } from '@/lib/db/types';

export type StrikeSectionName =
  | 'Executive Analysis'
  | 'OS Stress Test'
  | 'Imperial Instrument'
  | 'Action Plan'
  | 'Ritual';

export interface StrikeSection {
  label: string;
  content: string;
  /** True when the section was generated with a placeholder due to missing data */
  isPlaceholder?: boolean;
}

export interface StrikeRequest {
  /** The primary OS_Module slug(s) to target */
  targetSlugs: string[];
  /** Optional context or directive for the generation */
  directive?: string;
  /** The authenticated user ID initiating the strike */
  userId: string;
}

/**
 * Provenance tracking — how a Strike Output was generated.
 */
export type StrikeGeneratedBy =
  | 'claude-engine'
  | 'template-fallback'
  | 'background-agent';

export interface StrikeOutput {
  /** DH-RES-YYYY-NNN identifier assigned after persistence */
  id?: string;
  title: string;
  /** Exactly 5 sections in canonical order */
  sections: [StrikeSection, StrikeSection, StrikeSection, StrikeSection, StrikeSection];
  generatedAt: string; // ISO 8601 UTC
  requestedBy: string; // userId
  /** How this output was generated */
  generatedBy: StrikeGeneratedBy;
}

/**
 * Structured context passed to the Claude Strike Engine.
 * Assembled from in-memory store and Supabase data.
 */
export interface StructuredContext {
  /** User query or background agent directive */
  intent: string;
  /** Top-5 relevant Pillars by search relevance */
  pillars: Pillar[];
  /** Top-3 relevant OS Modules by search relevance */
  osModules: OSModule[];
  /**
   * Top-3 relevant Library entries by search relevance.
   * Bodies may be truncated to 500 chars if total context exceeds 100k tokens.
   */
  libraryEntries: LibraryEntry[];
  /** Most recent approved capital allocation, or null if none exists */
  latestAllocation: AllocationRecord | null;
  /** Recent loop triggers — used by background agent daily summary only */
  recentLoopTriggers?: LoopExecutionLogRow[];
}

/**
 * Result returned by ClaudeStrikeEngine on successful generation.
 */
export interface ClaudeStrikeResult {
  output: string;
  generatedBy: 'claude-engine';
}

/**
 * Result returned by StrikeValidator.validate().
 * Pure function — no side effects.
 */
export interface ValidationResult {
  valid: boolean;
  /** Names of each failing check, empty when valid */
  failures: string[];
}
