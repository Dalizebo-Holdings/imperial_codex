/**
 * Integration types for Imperial Codex v16
 *
 * 277 Integration records linking OS_Modules to one another.
 */

export interface Integration {
  id: string;
  /** Source OS_Module slug */
  sourceSlug: string;
  /** One or more target OS_Module slugs */
  targetSlugs: string[];
  relationshipType: string;
  description?: string;
}

export interface IntegrationMap {
  /** Integrations where this module is the source */
  outbound: Integration[];
  /** Integrations where this module appears as a target */
  inbound: Integration[];
}
