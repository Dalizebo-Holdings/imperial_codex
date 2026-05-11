// Feature: imperial-codex-ai-agent, Property 39: Strike Output Structural Validation Correctness

import * as fc from 'fast-check';
import { validate } from '@/lib/strike/StrikeValidator';

const CANONICAL_SECTIONS = [
  'Executive Analysis',
  'OS Stress Test',
  'The Imperial Instrument',
  'Action Plan (T-Minus 24 Hours)',
  'The Ritual',
];

const MIN_BODY = 50;

function buildOutput(sections: Array<{ label: string; body: string }>): string {
  return sections.map((s) => `## ${s.label}\n${s.body}`).join('\n\n');
}

describe('Property 39: Strike Output Structural Validation Correctness', () => {
  it('accepts any output with exactly 5 correct sections and sufficient body length', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: MIN_BODY, maxLength: 200 }), {
          minLength: 5,
          maxLength: 5,
        }),
        (bodies) => {
          const output = buildOutput(
            CANONICAL_SECTIONS.map((label, i) => ({ label, body: bodies[i] }))
          );
          const result = validate(output);
          return result.valid === true && result.failures.length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects any output with wrong section count', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 4 }).chain((count) =>
          fc.array(
            fc.record({
              label: fc.constantFrom(...CANONICAL_SECTIONS),
              body: fc.string({ minLength: MIN_BODY, maxLength: 200 }),
            }),
            { minLength: count, maxLength: count }
          )
        ),
        (sections) => {
          const output = buildOutput(sections);
          const result = validate(output);
          // With fewer than 5 sections, must be invalid
          return result.valid === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects any output where a section body has fewer than 50 non-whitespace chars', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 4 }), // which section has short body
        fc.string({ minLength: 0, maxLength: 49 }).filter((s) => s.replace(/\s/g, '').length < MIN_BODY),
        (shortIndex, shortBody) => {
          const bodies = CANONICAL_SECTIONS.map((_, i) =>
            i === shortIndex ? shortBody : 'A'.repeat(MIN_BODY)
          );
          const output = buildOutput(
            CANONICAL_SECTIONS.map((label, i) => ({ label, body: bodies[i] }))
          );
          const result = validate(output);
          return result.valid === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('is a pure function — identical inputs always produce identical outputs', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const r1 = validate(input);
        const r2 = validate(input);
        return r1.valid === r2.valid && JSON.stringify(r1.failures) === JSON.stringify(r2.failures);
      }),
      { numRuns: 200 }
    );
  });

  it('failures array identifies each failing check by name', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = validate(input);
        if (!result.valid) {
          // Every failure must be a non-empty string
          return result.failures.every((f) => typeof f === 'string' && f.length > 0);
        }
        return true;
      }),
      { numRuns: 200 }
    );
  });
});
