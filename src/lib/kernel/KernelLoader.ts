/**
 * KernelLoader — reads, parses, and validates /core/KERNEL_V16_MASTER.md.
 *
 * Responsibilities:
 *  - Parse the Markdown file with gray-matter + remark
 *  - Extract the kernel version string from the YAML code block
 *  - Extract the list of OS_Module slugs from the fenced code block
 *  - Validate the slug set against the 36 canonical slugs
 *  - Set status `halted` on mismatch and log the diff
 *  - Log a version-mismatch warning if the file version differs from
 *    EXPECTED_KERNEL_VERSION
 *  - Return a KernelState
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import type { KernelState, KernelStatus } from './types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const EXPECTED_KERNEL_VERSION = 'v16.2';

export const CANONICAL_SLUGS: ReadonlySet<string> = new Set([
  'ARCH-OS',
  'CAPITAL-OS',
  'CIPC-OS',
  'CITADEL-OS',
  'COGNITIVE-OS',
  'COMPLIANCE-OS',
  'DECREE-OS',
  'DOMAIN-OS',
  'ENERGY-OS',
  'EXTRACTION-OS',
  'FNB-OS',
  'GOVERNANCE-OS',
  'HEGEMONY-OS',
  'INFRA-OS',
  'INTEL-OS',
  'KIRO-OS',
  'LEGAL-OS',
  'LIBRARY-OS',
  'LOOP-OS',
  'MANDATE-OS',
  'MEDIA-OS',
  'NARRATIVE-OS',
  'NEXUS-OS',
  'PILLAR-OS',
  'PROTOCOL-OS',
  'RECON-OS',
  'RITUAL-OS',
  'SOVEREIGN-OS',
  'STRIKE-OS',
  'SUCCESSION-OS',
  'TAX-OS',
  'TECH-OS',
  'TRADE-OS',
  'VAULT-OS',
  'WARFARE-OS',
  'YIELD-OS',
]);

// Resolved at module load time so tests can override via jest.mock or by
// passing an explicit filePath argument.
const DEFAULT_KERNEL_PATH = path.resolve(process.cwd(), 'core', 'KERNEL_V16_MASTER.md');

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export interface KernelLoadResult {
  state: KernelState;
  /** Machine-readable error code when status is halted */
  errorCode?: string;
  /** Human-readable error message */
  errorMessage?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract the version string from the YAML metadata block inside the
 * Markdown file.  The block looks like:
 *
 * ```yaml
 * version: v16.2
 * ...
 * ```
 *
 * We parse it with a simple regex rather than a full YAML parser to keep
 * the dependency footprint minimal.
 */
function extractVersion(content: string): string | null {
  // Match a fenced yaml block and pull the version field out of it.
  const yamlBlockMatch = content.match(/```yaml\s*([\s\S]*?)```/);
  if (!yamlBlockMatch) return null;

  const yamlContent = yamlBlockMatch[1];
  const versionMatch = yamlContent.match(/^version:\s*(\S+)/m);
  return versionMatch ? versionMatch[1].trim() : null;
}

/**
 * Extract OS_Module slugs from the plain fenced code block that lists them
 * one per line.  The block appears after the heading
 * "Registered OS_Module Identifiers".
 */
function extractSlugs(content: string): string[] {
  // Find the section heading, then grab the first plain (non-yaml) code block
  // that follows it.
  const sectionMatch = content.match(
    /##\s+Registered OS_Module Identifiers[\s\S]*?```\s*\n([\s\S]*?)```/
  );
  if (!sectionMatch) return [];

  return sectionMatch[1]
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/**
 * Validate the parsed slug set against the 36 canonical slugs.
 * Returns { ok, missing, unexpected }.
 */
export function validateSlugs(parsed: string[]): {
  ok: boolean;
  missing: string[];
  unexpected: string[];
} {
  const parsedSet = new Set(parsed);

  const missing = [...CANONICAL_SLUGS].filter((s) => !parsedSet.has(s));
  const unexpected = parsed.filter((s) => !CANONICAL_SLUGS.has(s));

  return {
    ok: missing.length === 0 && unexpected.length === 0,
    missing,
    unexpected,
  };
}

// ---------------------------------------------------------------------------
// Main loader
// ---------------------------------------------------------------------------

/**
 * Load and validate the Kernel configuration file.
 *
 * @param filePath  Override the default path (useful in tests).
 */
export async function loadKernel(filePath?: string): Promise<KernelLoadResult> {
  const kernelPath = filePath ?? DEFAULT_KERNEL_PATH;
  const loadedAt = new Date().toISOString();

  // ------------------------------------------------------------------
  // 1. Read the file
  // ------------------------------------------------------------------
  let rawContent: string;
  try {
    rawContent = fs.readFileSync(kernelPath, 'utf-8');
  } catch (err: unknown) {
    const nodeErr = err as NodeJS.ErrnoException;
    const isNotFound = nodeErr?.code === 'ENOENT';

    const errorCode = isNotFound ? 'KERNEL_FILE_MISSING' : 'KERNEL_FILE_UNREADABLE';
    const errorMessage = isNotFound
      ? `Kernel file not found: ${kernelPath}`
      : `Kernel file unreadable: ${kernelPath} — ${err instanceof Error ? err.message : String(err)}`;

    console.error(`[KernelLoader] ${errorCode}: ${errorMessage}`);

    return {
      state: {
        version: 'unknown',
        status: 'halted',
        osModuleSlugs: [],
        loadedAt,
      },
      errorCode,
      errorMessage,
    };
  }

  // ------------------------------------------------------------------
  // 2. Parse with gray-matter (strips front-matter if present) then
  //    process the Markdown body with remark so we have a clean AST.
  //    For slug/version extraction we work on the raw string because
  //    the data lives inside fenced code blocks, not front-matter.
  // ------------------------------------------------------------------
  const parsed = matter(rawContent);
  // Run remark to validate the Markdown is well-formed (errors surface here).
  await remark().process(parsed.content);

  // ------------------------------------------------------------------
  // 3. Extract version
  // ------------------------------------------------------------------
  const fileVersion = extractVersion(rawContent) ?? 'unknown';

  if (fileVersion !== EXPECTED_KERNEL_VERSION) {
    console.warn(
      `[KernelLoader] VERSION_MISMATCH: file version "${fileVersion}" differs from ` +
        `expected "${EXPECTED_KERNEL_VERSION}". Continuing with file version.`
    );
  }

  // ------------------------------------------------------------------
  // 4. Extract and validate slugs
  // ------------------------------------------------------------------
  const slugs = extractSlugs(rawContent);
  const validation = validateSlugs(slugs);

  let status: KernelStatus = 'active';

  if (!validation.ok) {
    status = 'halted';
    console.error(
      `[KernelLoader] KERNEL_VALIDATION_FAILED: OS_Module slug set mismatch. ` +
        `Missing: [${validation.missing.join(', ')}]. ` +
        `Unexpected: [${validation.unexpected.join(', ')}].`
    );
  }

  return {
    state: {
      version: fileVersion,
      status,
      osModuleSlugs: slugs,
      loadedAt,
    },
    ...(status === 'halted' && {
      errorCode: 'KERNEL_VALIDATION_FAILED',
      errorMessage:
        `OS_Module slug set mismatch — ` +
        `missing: [${validation.missing.join(', ')}], ` +
        `unexpected: [${validation.unexpected.join(', ')}]`,
    }),
  };
}
