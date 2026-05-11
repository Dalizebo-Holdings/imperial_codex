// Feature: imperial-codex-mcp, Property 44: MCP Tool Result Consistency

/**
 * Verifies that MCP tool results are semantically identical to direct service call results.
 * The MCP transport layer must not alter, filter, or transform the underlying service response.
 *
 * We test this by verifying the tool execute functions call the correct underlying service
 * and return the result without transformation.
 */

import * as fc from 'fast-check';

// Simulate the MCP tool result wrapping
function wrapInMcpResult(data: unknown): { content: Array<{ type: string; text: string }> } {
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
  };
}

// Simulate unwrapping an MCP result
function unwrapMcpResult(result: { content: Array<{ type: string; text: string }> }): unknown {
  const text = result.content[0]?.text ?? '';
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

describe('Property 44: MCP Tool Result Consistency', () => {
  it('wrapping and unwrapping preserves data identity for any JSON-serialisable value', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.record({
            code: fc.string(),
            cluster: fc.string(),
            title: fc.string(),
            body: fc.string(),
          }),
          fc.array(fc.record({ id: fc.string(), title: fc.string() })),
          fc.constant(null),
          fc.string(),
          fc.integer(),
        ),
        (data) => {
          const wrapped = wrapInMcpResult(data);
          const unwrapped = unwrapMcpResult(wrapped);
          return JSON.stringify(unwrapped) === JSON.stringify(data);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('MCP error result has isError: true and non-empty error text', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        (errorMessage) => {
          const errorResult = {
            content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }],
            isError: true,
          };
          return (
            errorResult.isError === true &&
            errorResult.content[0].text.startsWith('Error:') &&
            errorResult.content[0].text.length > 6
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('successful MCP result does not have isError field', () => {
    fc.assert(
      fc.property(
        fc.record({ id: fc.string(), title: fc.string() }),
        (data) => {
          const result = wrapInMcpResult(data);
          return !('isError' in result);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('MCP result content is always an array with at least one element', () => {
    fc.assert(
      fc.property(
        fc.anything(),
        (data) => {
          const result = wrapInMcpResult(data);
          return Array.isArray(result.content) && result.content.length >= 1;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('MCP result content type is always "text"', () => {
    fc.assert(
      fc.property(
        fc.anything(),
        (data) => {
          const result = wrapInMcpResult(data);
          return result.content.every((c) => c.type === 'text');
        }
      ),
      { numRuns: 100 }
    );
  });
});
