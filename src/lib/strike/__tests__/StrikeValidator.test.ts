/**
 * Unit tests for StrikeValidator pure validation function.
 */

import { validate } from '../StrikeValidator';

const VALID_BODY = 'A'.repeat(60); // 60 non-whitespace chars — above minimum

function buildValidOutput(): string {
  return [
    `## Executive Analysis\n${VALID_BODY}`,
    `## OS Stress Test\n${VALID_BODY}`,
    `## The Imperial Instrument\n${VALID_BODY}`,
    `## Action Plan (T-Minus 24 Hours)\n${VALID_BODY}`,
    `## The Ritual\n${VALID_BODY}`,
  ].join('\n\n');
}

describe('StrikeValidator.validate', () => {
  describe('valid inputs', () => {
    it('returns valid: true for a correctly structured output', () => {
      const result = validate(buildValidOutput());
      expect(result.valid).toBe(true);
      expect(result.failures).toHaveLength(0);
    });

    it('accepts section body with exactly 50 non-whitespace chars', () => {
      const exactBody = 'B'.repeat(50);
      const output = [
        `## Executive Analysis\n${exactBody}`,
        `## OS Stress Test\n${VALID_BODY}`,
        `## The Imperial Instrument\n${VALID_BODY}`,
        `## Action Plan (T-Minus 24 Hours)\n${VALID_BODY}`,
        `## The Ritual\n${VALID_BODY}`,
      ].join('\n\n');

      const result = validate(output);
      expect(result.valid).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('returns valid: false for null/empty input', () => {
      expect(validate('').valid).toBe(false);
      expect(validate('   ').valid).toBe(false);
    });

    it('identifies empty-or-null-input failure', () => {
      const result = validate('');
      expect(result.failures).toContain('empty-or-null-input');
    });

    it('fails when a section has wrong label', () => {
      const output = [
        `## Executive Analysis\n${VALID_BODY}`,
        `## OS Stress Test\n${VALID_BODY}`,
        `## The Imperial Instrument\n${VALID_BODY}`,
        `## Action Plan\n${VALID_BODY}`, // wrong — missing "(T-Minus 24 Hours)"
        `## The Ritual\n${VALID_BODY}`,
      ].join('\n\n');

      const result = validate(output);
      expect(result.valid).toBe(false);
      expect(result.failures.some((f) => f.startsWith('section-order'))).toBe(true);
    });

    it('fails when sections are in wrong order', () => {
      const output = [
        `## OS Stress Test\n${VALID_BODY}`,
        `## Executive Analysis\n${VALID_BODY}`,
        `## The Imperial Instrument\n${VALID_BODY}`,
        `## Action Plan (T-Minus 24 Hours)\n${VALID_BODY}`,
        `## The Ritual\n${VALID_BODY}`,
      ].join('\n\n');

      const result = validate(output);
      expect(result.valid).toBe(false);
      expect(result.failures.some((f) => f.startsWith('section-order'))).toBe(true);
    });

    it('fails when a section is missing', () => {
      const output = [
        `## Executive Analysis\n${VALID_BODY}`,
        `## OS Stress Test\n${VALID_BODY}`,
        `## The Imperial Instrument\n${VALID_BODY}`,
        `## The Ritual\n${VALID_BODY}`,
        // Action Plan missing
      ].join('\n\n');

      const result = validate(output);
      expect(result.valid).toBe(false);
      expect(result.failures.some((f) => f.startsWith('section-count'))).toBe(true);
    });

    it('fails when section body has 49 non-whitespace chars', () => {
      const shortBody = 'C'.repeat(49);
      const output = [
        `## Executive Analysis\n${shortBody}`,
        `## OS Stress Test\n${VALID_BODY}`,
        `## The Imperial Instrument\n${VALID_BODY}`,
        `## Action Plan (T-Minus 24 Hours)\n${VALID_BODY}`,
        `## The Ritual\n${VALID_BODY}`,
      ].join('\n\n');

      const result = validate(output);
      expect(result.valid).toBe(false);
      expect(
        result.failures.some((f) => f.includes('Executive Analysis') && f.includes('49'))
      ).toBe(true);
    });

    it('identifies all failing checks when multiple checks fail', () => {
      const result = validate('## Wrong Section\nshort');
      expect(result.valid).toBe(false);
      expect(result.failures.length).toBeGreaterThan(1);
    });
  });

  describe('pure function properties', () => {
    it('returns identical results for identical inputs', () => {
      const input = buildValidOutput();
      const result1 = validate(input);
      const result2 = validate(input);
      expect(result1).toEqual(result2);
    });

    it('does not mutate the input string', () => {
      const input = buildValidOutput();
      const original = input;
      validate(input);
      expect(input).toBe(original);
    });
  });
});
