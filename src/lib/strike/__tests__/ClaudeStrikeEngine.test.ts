/**
 * Unit tests for ClaudeStrikeEngine.
 */

jest.mock('@anthropic-ai/sdk');

import Anthropic from '@anthropic-ai/sdk';
import { generate, ClaudeApiError } from '../ClaudeStrikeEngine';
import type { StructuredContext } from '../types';

const mockCreate = jest.fn();
(Anthropic as jest.MockedClass<typeof Anthropic>).mockImplementation(
  () => ({ messages: { create: mockCreate } } as unknown as Anthropic)
);

const mockContext: StructuredContext = {
  intent: 'Analyse capital deployment strategy',
  pillars: [],
  osModules: [],
  libraryEntries: [],
  latestAllocation: null,
};

const VALID_BODY = 'A'.repeat(60);
const VALID_OUTPUT = [
  `## Executive Analysis\n${VALID_BODY}`,
  `## OS Stress Test\n${VALID_BODY}`,
  `## The Imperial Instrument\n${VALID_BODY}`,
  `## Action Plan (T-Minus 24 Hours)\n${VALID_BODY}`,
  `## The Ritual\n${VALID_BODY}`,
].join('\n\n');

describe('ClaudeStrikeEngine.generate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = 'test-key';
  });

  afterEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
  });

  it('returns ClaudeStrikeResult on successful generation', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: VALID_OUTPUT }],
    });

    const result = await generate(mockContext);
    expect(result.generatedBy).toBe('claude-engine');
    expect(result.output).toBe(VALID_OUTPUT);
  });

  it('throws ClaudeApiError when ANTHROPIC_API_KEY is not set', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    await expect(generate(mockContext)).rejects.toThrow(ClaudeApiError);
  });

  it('throws ClaudeApiError on network error', async () => {
    mockCreate.mockRejectedValue(new Error('ECONNREFUSED'));
    await expect(generate(mockContext)).rejects.toThrow(ClaudeApiError);
  });

  it('throws ClaudeApiError on API timeout', async () => {
    mockCreate.mockRejectedValue(new Error('Request timeout'));
    await expect(generate(mockContext)).rejects.toThrow(ClaudeApiError);
  });

  it('throws ClaudeApiError on 5xx response', async () => {
    mockCreate.mockRejectedValue(
      Object.assign(new Error('Internal Server Error'), { status: 500 })
    );
    await expect(generate(mockContext)).rejects.toThrow(ClaudeApiError);
  });

  it('throws ClaudeApiError when response content is not text', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'tool_use', id: 'tool-1', name: 'test', input: {} }],
    });
    await expect(generate(mockContext)).rejects.toThrow(ClaudeApiError);
  });

  it('truncates library entry bodies when context exceeds token cap', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: VALID_OUTPUT }],
    });

    const longBody = 'X'.repeat(50_000); // very long body
    const contextWithLongEntries: StructuredContext = {
      ...mockContext,
      libraryEntries: [
        { id: 'lib-001', title: 'Entry 1', body: longBody, slugTags: ['TAX-OS'] },
        { id: 'lib-002', title: 'Entry 2', body: longBody, slugTags: ['KIRO-OS'] },
        { id: 'lib-003', title: 'Entry 3', body: longBody, slugTags: ['VAULT-OS'] },
      ] as StructuredContext['libraryEntries'],
    };

    await generate(contextWithLongEntries);

    // Verify the message sent to Claude had truncated bodies
    const callArgs = mockCreate.mock.calls[0][0];
    const userMessage = callArgs.messages[0].content as string;
    expect(userMessage).toContain('bodies truncated to 500 chars');
  });
});
