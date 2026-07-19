// Feature: imperial-codex-mcp, Property 45: External MCP Client Conditional Initialisation

/**
 * Verifies that external MCP clients (Brave Search, Slack, GitHub) are initialised
 * if and only if their required environment variable is present and non-empty.
 * If the env var is absent or empty, the client returns null without throwing.
 */

import * as fc from 'fast-check';

// Simulate the conditional initialisation pattern used by all external clients
function createConditionalClient<T>(
  envVarName: string,
  factory: () => T
): () => T | null {
  return () => {
    const value = process.env[envVarName];
    if (!value || value.trim() === '') return null;
    return factory();
  };
}

describe('Property 45: External MCP Client Conditional Initialisation', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    // Restore env vars after each test
    for (const key of ['BRAVE_API_KEY', 'SLACK_BOT_TOKEN', 'GITHUB_TOKEN']) {
      if (originalEnv[key] !== undefined) {
        process.env[key] = originalEnv[key];
      } else {
        process.env[key] = undefined;
      }
    }
  });

  it('returns null when env var is absent', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('BRAVE_API_KEY', 'SLACK_BOT_TOKEN', 'GITHUB_TOKEN'),
        (envVar) => {
          process.env[envVar] = undefined;
          const getClient = createConditionalClient(envVar, () => ({ connected: true }));
          return getClient() === null;
        }
      ),
      { numRuns: 30 }
    );
  });

  it('returns null when env var is empty string', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('BRAVE_API_KEY', 'SLACK_BOT_TOKEN', 'GITHUB_TOKEN'),
        (envVar) => {
          process.env[envVar] = '';
          const getClient = createConditionalClient(envVar, () => ({ connected: true }));
          return getClient() === null;
        }
      ),
      { numRuns: 30 }
    );
  });

  it('returns null when env var is whitespace only', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('BRAVE_API_KEY', 'SLACK_BOT_TOKEN', 'GITHUB_TOKEN'),
        (envVar) => {
          process.env[envVar] = '   ';
          const getClient = createConditionalClient(envVar, () => ({ connected: true }));
          return getClient() === null;
        }
      ),
      { numRuns: 30 }
    );
  });

  it('returns a non-null client when env var is present and non-empty', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('BRAVE_API_KEY', 'SLACK_BOT_TOKEN', 'GITHUB_TOKEN'),
        fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
        (envVar, value) => {
          process.env[envVar] = value;
          const getClient = createConditionalClient(envVar, () => ({ connected: true }));
          return getClient() !== null;
        }
      ),
      { numRuns: 30 }
    );
  });

  it('does not throw when env var is absent', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('BRAVE_API_KEY', 'SLACK_BOT_TOKEN', 'GITHUB_TOKEN'),
        (envVar) => {
          process.env[envVar] = undefined;
          const getClient = createConditionalClient(envVar, () => ({ connected: true }));
          let threw = false;
          try {
            getClient();
          } catch {
            threw = true;
          }
          return !threw;
        }
      ),
      { numRuns: 30 }
    );
  });

  it('Brave Search tool is null when BRAVE_API_KEY is absent', () => {
    process.env.BRAVE_API_KEY = undefined;
    // Import dynamically to avoid module caching issues
    const { isBraveSearchAvailable } = require('@/mcp/external/brave');
    expect(isBraveSearchAvailable()).toBe(false);
  });

  it('Brave Search tool is available when BRAVE_API_KEY is set', () => {
    process.env.BRAVE_API_KEY = 'test-brave-key';
    const { isBraveSearchAvailable } = require('@/mcp/external/brave');
    expect(isBraveSearchAvailable()).toBe(true);
  });

  it('Slack client is null when SLACK_BOT_TOKEN is absent', () => {
    process.env.SLACK_BOT_TOKEN = undefined;
    const { isSlackAvailable } = require('@/mcp/external/slack');
    expect(isSlackAvailable()).toBe(false);
  });

  it('GitHub tools are null when GITHUB_TOKEN is absent', () => {
    process.env.GITHUB_TOKEN = undefined;
    const { isGitHubAvailable } = require('@/mcp/external/github');
    expect(isGitHubAvailable()).toBe(false);
  });
});
