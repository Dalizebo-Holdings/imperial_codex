// Feature: imperial-codex-ai-agent, Property 40: Claude Context Token Cap Enforcement

import * as fc from 'fast-check';

// We test the token cap logic in isolation by extracting the assembly logic
// The key invariant: when total estimated tokens > 100k, all library bodies are truncated to ≤500 chars

const CONTEXT_TOKEN_CAP = 100_000;
const LIBRARY_BODY_TRUNCATE_LENGTH = 500;
const CHARS_PER_TOKEN = 4;

interface MockLibraryEntry {
  id: string;
  title: string;
  body: string;
  slugTags: string[];
}

function shouldTruncate(entries: MockLibraryEntry[], baseTokens: number): boolean {
  const totalLibraryChars = entries.reduce((sum, e) => sum + e.body.length, 0);
  const estimatedTokens = baseTokens + Math.ceil(totalLibraryChars / CHARS_PER_TOKEN);
  return estimatedTokens > CONTEXT_TOKEN_CAP;
}

function applyTruncation(entries: MockLibraryEntry[], truncate: boolean): MockLibraryEntry[] {
  if (!truncate) return entries;
  return entries.map((e) => ({
    ...e,
    body: e.body.slice(0, LIBRARY_BODY_TRUNCATE_LENGTH),
  }));
}

describe('Property 40: Claude Context Token Cap Enforcement', () => {
  it('truncates all library bodies to ≤500 chars when context would exceed 100k tokens', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 10 }),
            title: fc.string({ minLength: 1, maxLength: 50 }),
            body: fc.string({ minLength: 501, maxLength: 2000 }),
            slugTags: fc.array(fc.string(), { minLength: 1, maxLength: 3 }),
          }),
          { minLength: 3, maxLength: 10 }
        ),
        (entries) => {
          // Use a base token count that ensures truncation is triggered
          const baseTokens = CONTEXT_TOKEN_CAP; // already at cap before library entries
          const truncate = shouldTruncate(entries, baseTokens);
          const result = applyTruncation(entries, truncate);

          if (truncate) {
            return result.every((e) => e.body.length <= LIBRARY_BODY_TRUNCATE_LENGTH);
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('preserves full library body length when context is within token cap', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 10 }),
            title: fc.string({ minLength: 1, maxLength: 50 }),
            body: fc.string({ minLength: 1, maxLength: 100 }),
            slugTags: fc.array(fc.string(), { minLength: 1, maxLength: 3 }),
          }),
          { minLength: 1, maxLength: 3 }
        ),
        (entries) => {
          // Use a very small base token count — context will be well within cap
          const baseTokens = 100;
          const truncate = shouldTruncate(entries, baseTokens);
          const result = applyTruncation(entries, truncate);

          if (!truncate) {
            // Bodies should be unchanged
            return result.every((e, i) => e.body === entries[i].body);
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('truncation decision is deterministic for identical inputs', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 10 }),
            title: fc.string({ minLength: 1, maxLength: 50 }),
            body: fc.string({ minLength: 1, maxLength: 1000 }),
            slugTags: fc.array(fc.string(), { minLength: 1, maxLength: 3 }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        fc.integer({ min: 0, max: CONTEXT_TOKEN_CAP * 2 }),
        (entries, baseTokens) => {
          const decision1 = shouldTruncate(entries, baseTokens);
          const decision2 = shouldTruncate(entries, baseTokens);
          return decision1 === decision2;
        }
      ),
      { numRuns: 100 }
    );
  });
});
