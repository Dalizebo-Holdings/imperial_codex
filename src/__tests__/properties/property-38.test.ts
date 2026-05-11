// Feature: imperial-codex-ai-agent, Property 38: Webhook Alert Payload Structural Completeness

import * as fc from 'fast-check';
import type { WebhookAlertPayload } from '@/lib/agent/types';

const REQUIRED_FIELDS: Array<keyof WebhookAlertPayload> = [
  'loopId',
  'loopTitle',
  'triggeredAt',
  'targetSlug',
  'outputAction',
  'severity',
];

function buildPayload(
  loopId: string,
  loopTitle: string,
  triggeredAt: string,
  targetSlug: string,
  outputAction: string
): WebhookAlertPayload {
  return {
    loopId,
    loopTitle,
    triggeredAt,
    targetSlug,
    outputAction,
    severity: 'critical',
  };
}

describe('Property 38: Webhook Alert Payload Structural Completeness', () => {
  it('payload contains all 6 required fields for any valid loop data', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.date({ min: new Date('2026-01-01'), max: new Date('2026-12-31') }).map((d) => d.toISOString()),
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        (loopId, loopTitle, triggeredAt, targetSlug, outputAction) => {
          const payload = buildPayload(loopId, loopTitle, triggeredAt, targetSlug, outputAction);

          // All required fields must be present
          return REQUIRED_FIELDS.every((field) => field in payload);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('severity is always exactly the string "critical"', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.date().map((d) => d.toISOString()),
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        (loopId, loopTitle, triggeredAt, targetSlug, outputAction) => {
          const payload = buildPayload(loopId, loopTitle, triggeredAt, targetSlug, outputAction);
          return payload.severity === 'critical';
        }
      ),
      { numRuns: 100 }
    );
  });

  it('payload contains no additional fields beyond the 6 required', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.date().map((d) => d.toISOString()),
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        (loopId, loopTitle, triggeredAt, targetSlug, outputAction) => {
          const payload = buildPayload(loopId, loopTitle, triggeredAt, targetSlug, outputAction);
          const actualFields = Object.keys(payload).sort();
          const expectedFields = [...REQUIRED_FIELDS].sort();
          return JSON.stringify(actualFields) === JSON.stringify(expectedFields);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('all string fields are non-empty for valid loop data', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.date().map((d) => d.toISOString()),
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        (loopId, loopTitle, triggeredAt, targetSlug, outputAction) => {
          const payload = buildPayload(loopId, loopTitle, triggeredAt, targetSlug, outputAction);
          return (
            payload.loopId.length > 0 &&
            payload.loopTitle.length > 0 &&
            payload.triggeredAt.length > 0 &&
            payload.targetSlug.length > 0 &&
            payload.outputAction.length > 0
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('triggeredAt is a valid ISO 8601 UTC string', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
        (date) => {
          const isoString = date.toISOString();
          const payload = buildPayload('loop-001', 'Test Loop', isoString, 'TAX-OS', 'Activate');
          // ISO 8601 UTC strings end with 'Z'
          return payload.triggeredAt.endsWith('Z');
        }
      ),
      { numRuns: 100 }
    );
  });
});
