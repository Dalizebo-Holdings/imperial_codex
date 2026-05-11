/**
 * StrikeValidator — pure function for validating AI-generated Strike Outputs.
 *
 * Validates that a generated string conforms to the 5-Part Strike Hierarchy:
 *   1. Exactly five ## headings
 *   2. Headings in exact canonical order
 *   3. Each section body has at least 50 non-whitespace characters
 *
 * This is a pure function — no side effects, no I/O, no state.
 * Identical inputs always produce identical outputs.
 */

import type { ValidationResult } from './types';

const CANONICAL_SECTIONS = [
  'Executive Analysis',
  'OS Stress Test',
  'The Imperial Instrument',
  'Action Plan (T-Minus 24 Hours)',
  'The Ritual',
] as const;

const MIN_BODY_CHARS = 50;

/**
 * Validates a Strike Output string against the 5-Part Strike Hierarchy structure.
 *
 * @param output - The raw markdown string to validate
 * @returns ValidationResult with valid flag and array of failure descriptions
 */
export function validate(output: string): ValidationResult {
  // Guard: null/empty input
  if (!output || output.trim().length === 0) {
    return {
      valid: false,
      failures: ['empty-or-null-input'],
    };
  }

  const failures: string[] = [];

  // Extract all ## headings (exactly two # characters followed by a space)
  const headingRegex = /^## (.+)$/gm;
  const headings: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = headingRegex.exec(output)) !== null) {
    headings.push(match[1].trim());
  }

  // Check 1: Exactly five ## headings
  if (headings.length !== 5) {
    failures.push(
      `section-count: expected 5 sections, found ${headings.length}`
    );
  }

  // Check 2: Headings in exact canonical order
  const orderCorrect = CANONICAL_SECTIONS.every(
    (expected, index) => headings[index] === expected
  );

  if (!orderCorrect) {
    const found = headings.slice(0, 5).join(', ') || '(none)';
    failures.push(
      `section-order: expected [${CANONICAL_SECTIONS.join(', ')}], found [${found}]`
    );
  }

  // Check 3: Each section body has at least 50 non-whitespace characters
  // Split on ## headings to get section bodies
  const sectionBodies = extractSectionBodies(output);

  for (let i = 0; i < CANONICAL_SECTIONS.length; i++) {
    const sectionName = CANONICAL_SECTIONS[i];
    const body = sectionBodies[i] ?? '';
    const nonWhitespaceCount = body.replace(/\s/g, '').length;

    if (nonWhitespaceCount < MIN_BODY_CHARS) {
      failures.push(
        `section-body-too-short: "${sectionName}" has ${nonWhitespaceCount} non-whitespace chars (minimum ${MIN_BODY_CHARS})`
      );
    }
  }

  return {
    valid: failures.length === 0,
    failures,
  };
}

/**
 * Extracts the body text for each section (text between consecutive ## headings).
 * Returns an array of body strings in section order.
 */
function extractSectionBodies(output: string): string[] {
  const parts = output.split(/^## .+$/m);
  // parts[0] is content before the first heading (ignored)
  // parts[1..5] are the section bodies
  return parts.slice(1);
}
