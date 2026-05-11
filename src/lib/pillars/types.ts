/**
 * Pillar types for Imperial Codex v16
 *
 * 207 Strategic Pillars in 5 clusters:
 *   Fiscal Weaponization (001–040)
 *   Hegemony & Capture (041–105)
 *   Infrastructure & Physical Dominance (106–150)
 *   Cognitive Dominance & Succession (151–200)
 *   Singularity Laws (201–207)
 */

export type PillarCluster =
  | 'Fiscal Weaponization'
  | 'Hegemony & Capture'
  | 'Infrastructure & Physical Dominance'
  | 'Cognitive Dominance & Succession'
  | 'Singularity Laws';

export interface Pillar {
  /** Zero-padded three-digit code, e.g. "001", "207" */
  code: string;
  cluster: PillarCluster;
  title: string;
  body: string;
}

export interface PillarSearchResult {
  pillar: Pillar;
  /** Fuse.js relevance score (lower = more relevant) */
  score: number;
}
