/**
 * GitHub MCP Client Wrapper
 *
 * Lazy-initialised GitHub integration for repository file operations.
 * Only initialises when GITHUB_TOKEN is present in the environment.
 * Returns null if the env var is absent — no error thrown.
 *
 * Exposes github_get_file_contents and github_create_or_update_file tools
 * to the chat agent for reading and writing Codex repository files.
 */

import { tool } from 'ai';
import { z } from 'zod';

/**
 * Checks if GitHub integration is available (GITHUB_TOKEN is set).
 */
export function isGitHubAvailable(): boolean {
  return Boolean(process.env.GITHUB_TOKEN);
}

function getGitHubHeaders(): Record<string, string> {
  return {
    'Accept': 'application/vnd.github+json',
    'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

function getRepoInfo(): { owner: string; repo: string } {
  const repoUrl = process.env.GITHUB_REPO ?? '';
  const parts = repoUrl.replace('https://github.com/', '').split('/');
  return {
    owner: parts[0] ?? '',
    repo: parts[1] ?? '',
  };
}

/**
 * Returns the GitHub get_file_contents tool for use with the Vercel AI SDK.
 * Returns null if GITHUB_TOKEN is not set.
 */
export function getGitHubGetFileTool() {
  if (!isGitHubAvailable()) return null;

  return tool({
    description:
      'Retrieves the contents of a file from the Imperial Codex GitHub repository. ' +
      'Use this to read OS Module definitions, Pillar records, or any other repository file.',
    parameters: z.object({
      path: z.string().describe('File path relative to repository root, e.g. "os-modules/TAX-OS.md"'),
      ref: z.string().optional().describe('Branch, tag, or commit SHA (defaults to main)'),
    }),
    execute: async ({ path, ref = 'main' }) => {
      const { owner, repo } = getRepoInfo();
      if (!owner || !repo) {
        return { error: 'GITHUB_REPO environment variable not configured (format: owner/repo)' };
      }

      try {
        const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${ref}`;
        const response = await fetch(url, { headers: getGitHubHeaders() });

        if (response.status === 404) {
          return { error: `File not found: ${path}` };
        }

        if (!response.ok) {
          return { error: `GitHub API error: HTTP ${response.status}` };
        }

        const data = await response.json();

        if (data.encoding === 'base64') {
          const content = Buffer.from(data.content, 'base64').toString('utf-8');
          return { path, content, sha: data.sha };
        }

        return { path, content: data.content, sha: data.sha };
      } catch (err) {
        return {
          error: `GitHub request failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        };
      }
    },
  });
}

/**
 * Returns the GitHub create_or_update_file tool for use with the Vercel AI SDK.
 * Returns null if GITHUB_TOKEN is not set.
 */
export function getGitHubUpdateFileTool() {
  if (!isGitHubAvailable()) return null;

  return tool({
    description:
      'Creates or updates a file in the Imperial Codex GitHub repository. ' +
      'Use this to update OS Module definitions, add new Pillar records, or modify repository files. ' +
      'Requires the current file SHA if updating an existing file.',
    parameters: z.object({
      path: z.string().describe('File path relative to repository root'),
      content: z.string().describe('New file content (plain text, not base64)'),
      message: z.string().describe('Commit message describing the change'),
      sha: z.string().optional().describe('Current file SHA (required when updating an existing file)'),
      branch: z.string().optional().describe('Branch to commit to (defaults to main)'),
    }),
    execute: async ({ path, content, message, sha, branch = 'main' }) => {
      const { owner, repo } = getRepoInfo();
      if (!owner || !repo) {
        return { error: 'GITHUB_REPO environment variable not configured (format: owner/repo)' };
      }

      try {
        const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
        const body: Record<string, string> = {
          message,
          content: Buffer.from(content, 'utf-8').toString('base64'),
          branch,
        };

        if (sha) body.sha = sha;

        const response = await fetch(url, {
          method: 'PUT',
          headers: { ...getGitHubHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          return { error: `GitHub API error: HTTP ${response.status} — ${errData.message ?? ''}` };
        }

        const data = await response.json();
        return {
          path,
          sha: data.content?.sha,
          commitSha: data.commit?.sha,
          message: `File ${sha ? 'updated' : 'created'}: ${path}`,
        };
      } catch (err) {
        return {
          error: `GitHub request failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        };
      }
    },
  });
}
