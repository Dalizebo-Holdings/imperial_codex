/**
 * Brave Search MCP Client
 */

export function isBraveSearchAvailable(): boolean {
  return !!process.env.BRAVE_SEARCH_API_KEY;
}

export function getBraveSearchTool() {
  if (!isBraveSearchAvailable()) return null;
  // TODO: Implement Brave Search tool
  return null;
}
