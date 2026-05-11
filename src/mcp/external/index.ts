/**
 * External MCP Client Index
 *
 * Unified module for all external MCP client wrappers.
 * Each client is lazy-initialised — only available when its env var is set.
 *
 * Usage in chat agent:
 *   import { getExternalTools } from '@/mcp/external';
 *   const tools = { ...buildTools(), ...getExternalTools() };
 *
 * Usage in background agent:
 *   import { sendCriticalLoopAlert } from '@/mcp/external';
 */

export {
  isBraveSearchAvailable,
  getBraveSearchTool,
} from './brave.js';

export {
  isSlackAvailable,
  getSlackClient,
  sendCriticalLoopAlert,
} from './slack.js';

export {
  isGitHubAvailable,
  getGitHubGetFileTool,
  getGitHubUpdateFileTool,
} from './github.js';

/**
 * Returns all available external tools as a flat object for use with streamText.
 * Only includes tools whose required env vars are set.
 */
export function getExternalTools(): Record<string, unknown> {
  const tools: Record<string, unknown> = {};

  // Brave Search
  const { getBraveSearchTool } = require('./brave.js');
  const braveTool = getBraveSearchTool();
  if (braveTool) tools['brave_web_search'] = braveTool;

  // GitHub
  const { getGitHubGetFileTool, getGitHubUpdateFileTool } = require('./github.js');
  const githubGetTool = getGitHubGetFileTool();
  const githubUpdateTool = getGitHubUpdateFileTool();
  if (githubGetTool) tools['github_get_file_contents'] = githubGetTool;
  if (githubUpdateTool) tools['github_create_or_update_file'] = githubUpdateTool;

  return tools;
}

/**
 * Returns a summary of which external integrations are currently available.
 */
export function getExternalIntegrationStatus(): Record<string, boolean> {
  const { isBraveSearchAvailable } = require('./brave.js');
  const { isSlackAvailable } = require('./slack.js');
  const { isGitHubAvailable } = require('./github.js');

  return {
    braveSearch: isBraveSearchAvailable(),
    slack: isSlackAvailable(),
    github: isGitHubAvailable(),
  };
}
