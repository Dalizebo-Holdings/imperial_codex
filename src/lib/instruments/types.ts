/**
 * Instrument Archive types for Imperial Codex v16
 *
 * Formal audit-ready documents identified by the scheme DH-RES-YYYY-NNN.
 */

import type { StrikeGeneratedBy } from '@/lib/strike/types';

export interface InstrumentRegistryEntry {
  /** DH-RES-YYYY-NNN */
  id: string;
  title: string;
  issuingAuthority: string;
  /** ISO 8601 UTC */
  generatedAt: string;
  /** "active" | "archived" */
  status: string;
  /** Provenance: how this instrument was generated */
  generatedBy: StrikeGeneratedBy;
}
