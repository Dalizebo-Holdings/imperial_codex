/**
 * ClaudeStrikeEngine — generates Strike Outputs using Anthropic Claude 3.5 Sonnet.
 *
 * Receives a StructuredContext and produces a 5-Part Strike Hierarchy output.
 * Throws ClaudeApiError on network error, timeout, or HTTP 5xx — the caller
 * (StrikeOutputEngine) handles fallback to the template-based engine.
 *
 * Token cap: 100,000 tokens. Library entry bodies are truncated to 500 chars
 * if the assembled context would exceed this limit.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { StructuredContext, ClaudeStrikeResult } from './types';

const MODEL = 'claude-3-5-sonnet-20241022';
const MAX_TOKENS_OUTPUT = 4096;
const CONTEXT_TOKEN_CAP = 100_000;
const LIBRARY_BODY_TRUNCATE_LENGTH = 500;

// Rough token estimate: 1 token ≈ 4 characters
const CHARS_PER_TOKEN = 4;

export class ClaudeApiError extends Error {
  readonly code = 'CLAUDE_API_UNAVAILABLE';

  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'ClaudeApiError';
  }
}

const SYSTEM_PROMPT = `You are the Imperial Codex Strike Output Engine for Dalizebo Holdings.

Generate a complete 5-Part Strike Hierarchy output. You MUST produce exactly five sections with these EXACT headings in this EXACT order:

## Executive Analysis
## OS Stress Test
## The Imperial Instrument
## Action Plan (T-Minus 24 Hours)
## The Ritual

Rules:
- Each section must have substantial content (at least 50 non-whitespace characters)
- Executive Analysis: synthesise through at least 5 OS Module layers, cite at least 1 Library entry
- OS Stress Test: model exactly 3 outcome paths — Golden Path (Success), Stagnation Path, Black Swan (Failure) — each with a self-correction protocol
- The Imperial Instrument: include the assigned DH-RES identifier, render mathematical expressions in LaTeX ($...$)
- Action Plan: exactly 3 strikes labelled Extraction (Resource), Citadel (Infrastructure), Sovereign (Decree)
- The Ritual: bilingual consecration in Sepedi and Latin, at least 1 Grabovoi Code sequence, a visual sigil reference
- Use the provided context data to ground all analysis in real Codex data
- Do not add any headings beyond the five canonical ones`;

/**
 * Estimates the token count of a string (rough approximation).
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * Assembles the user message from StructuredContext, applying token cap truncation.
 */
const MAX_INTENT_LENGTH = 2000;

function sanitizeIntent(intent: string): string {
  return intent
    .slice(0, MAX_INTENT_LENGTH)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

function assembleUserMessage(context: StructuredContext): string {
  const safeIntent = sanitizeIntent(context.intent);

  // Check if we need to truncate Library entry bodies
  const totalLibraryChars = context.libraryEntries.reduce(
    (sum, entry) => sum + (entry.body?.length ?? 0),
    0
  );

  const estimatedContextTokens =
    estimateTokens(safeIntent) +
    estimateTokens(JSON.stringify(context.pillars)) +
    estimateTokens(JSON.stringify(context.osModules)) +
    estimateTokens(JSON.stringify(context.latestAllocation ?? '')) +
    estimateTokens(JSON.stringify(context.recentLoopTriggers ?? [])) +
    Math.ceil(totalLibraryChars / CHARS_PER_TOKEN);

  const shouldTruncate = estimatedContextTokens > CONTEXT_TOKEN_CAP;

  const libraryEntries = context.libraryEntries.map((entry) => ({
    id: entry.id,
    title: entry.title,
    body: shouldTruncate
      ? (entry.body ?? '').slice(0, LIBRARY_BODY_TRUNCATE_LENGTH)
      : entry.body,
    slugTags: entry.slugTags,
  }));

  const parts: string[] = [
    `## Intent\n${safeIntent}`,
    `## Relevant Pillars (top 5)\n${JSON.stringify(context.pillars, null, 2)}`,
    `## Relevant OS Modules (top 3)\n${JSON.stringify(context.osModules, null, 2)}`,
    `## Relevant Library Entries (top 3${shouldTruncate ? ', bodies truncated to 500 chars' : ''})\n${JSON.stringify(libraryEntries, null, 2)}`,
    `## Latest Capital Allocation\n${JSON.stringify(context.latestAllocation ?? 'No allocation on record', null, 2)}`,
  ];

  if (context.recentLoopTriggers && context.recentLoopTriggers.length > 0) {
    parts.push(
      `## Recent Loop Triggers (last 24h)\n${JSON.stringify(context.recentLoopTriggers, null, 2)}`
    );
  }

  return parts.join('\n\n');
}

/**
 * Generates a Strike Output using Claude 3.5 Sonnet.
 * Throws ClaudeApiError on any API failure — caller handles fallback.
 */
export async function generate(context: StructuredContext): Promise<ClaudeStrikeResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new ClaudeApiError('ANTHROPIC_API_KEY environment variable is not set');
  }

  const client = new Anthropic({ apiKey });
  const userMessage = assembleUserMessage(context);

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS_OUTPUT,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new ClaudeApiError('Claude returned non-text content');
    }

    return {
      output: content.text,
      generatedBy: 'claude-engine',
    };
  } catch (err) {
    if (err instanceof ClaudeApiError) throw err;

    // Wrap Anthropic SDK errors
    const message =
      err instanceof Error ? err.message : 'Unknown error from Anthropic API';
    throw new ClaudeApiError(`Claude API call failed: ${message}`, err);
  }
}
