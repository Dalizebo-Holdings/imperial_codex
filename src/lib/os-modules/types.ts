/**
 * OS Module types for Imperial Codex v16
 *
 * 36 OS_Modules in 4 clusters:
 *   Architecture of Power (Crown)
 *   Economic Fortress (Financial)
 *   Machinery of War (Operational/Tech)
 *   Influence & Domain (Narrative)
 */

export type OSModuleCluster =
  | 'Architecture of Power'
  | 'Economic Fortress'
  | 'Machinery of War'
  | 'Influence & Domain';

export interface OSModule {
  /** Uppercase slug, e.g. "TAX-OS", "KIRO-OS" */
  slug: string;
  cluster: OSModuleCluster;
  title: string;
  description: string;
  linkedPillarCodes: string[];
  linkedIntegrationIds: string[];
}
