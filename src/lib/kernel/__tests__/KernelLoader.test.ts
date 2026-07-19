/**
 * Unit tests for KernelLoader
 *
 * Covers:
 *  - file-missing → halted + KERNEL_FILE_MISSING error code
 *  - file-unreadable (permission error) → halted + descriptive error
 *  - version-mismatch → warning logged, continues with file version
 *  - successful load → status active, 36 slugs recognised
 */

import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { loadKernel, EXPECTED_KERNEL_VERSION, CANONICAL_SLUGS } from '../KernelLoader';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal valid KERNEL_V16_MASTER.md content string. */
function buildKernelContent(
  version: string = EXPECTED_KERNEL_VERSION,
  slugs: string[] = [...CANONICAL_SLUGS]
): string {
  const slugBlock = slugs.join('\n');
  return `# KERNEL V16 MASTER CONFIGURATION

## Kernel Metadata

\`\`\`yaml
version: ${version}
issued: 2026-01-01
authority: Dalizebo Holdings
classification: RESTRICTED
\`\`\`

---

## Registered OS_Module Identifiers

The following 36 OS_Module slugs are the canonical primary decision-framework nodes.

\`\`\`
${slugBlock}
\`\`\`

---

## Kernel Directives

Some directive text here.
`;
}

/** Write content to a temp file inside cwd and return its path. */
function writeTempFile(content: string): string {
  const dir = fs.mkdtempSync(path.join(process.cwd(), '.kernel-test-'));
  const filePath = path.join(dir, 'KERNEL_V16_MASTER.md');
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('KernelLoader', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let consoleSpy: ReturnType<typeof jest.spyOn>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let consoleWarnSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  // -------------------------------------------------------------------------
  // 1. File missing
  // -------------------------------------------------------------------------
  describe('when the kernel file is missing', () => {
    it('returns status halted with KERNEL_FILE_MISSING error code', async () => {
      const nonExistentPath = path.join(process.cwd(), 'does-not-exist', 'KERNEL_V16_MASTER.md');

      const result = await loadKernel(nonExistentPath);

      expect(result.state.status).toBe('halted');
      expect(result.errorCode).toBe('KERNEL_FILE_MISSING');
      expect(result.errorMessage).toContain(nonExistentPath);
    });

    it('logs an error when the file is missing', async () => {
      const nonExistentPath = path.join(process.cwd(), 'does-not-exist', 'KERNEL_V16_MASTER.md');

      await loadKernel(nonExistentPath);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('KERNEL_FILE_MISSING')
      );
    });

    it('returns empty osModuleSlugs when file is missing', async () => {
      const nonExistentPath = path.join(process.cwd(), 'does-not-exist', 'KERNEL_V16_MASTER.md');

      const result = await loadKernel(nonExistentPath);

      expect(result.state.osModuleSlugs).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // 2. File unreadable (simulate by passing a directory path)
  // -------------------------------------------------------------------------
  describe('when the kernel file is unreadable', () => {
    it('returns status halted with a descriptive error', async () => {
      // Passing a directory path inside cwd causes fs.readFileSync to throw EISDIR
      const dirPath = process.cwd();

      const result = await loadKernel(dirPath);

      expect(result.state.status).toBe('halted');
      expect(result.errorCode).toBe('KERNEL_FILE_UNREADABLE');
      expect(result.errorMessage).toContain(dirPath);
    });

    it('logs an error when the file is unreadable', async () => {
      const dirPath = process.cwd();

      await loadKernel(dirPath);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('KERNEL_FILE_UNREADABLE')
      );
    });
  });

  // -------------------------------------------------------------------------
  // 3. Version mismatch
  // -------------------------------------------------------------------------
  describe('when the kernel file version does not match EXPECTED_KERNEL_VERSION', () => {
    it('logs a version-mismatch warning', async () => {
      const content = buildKernelContent('v15.0');
      const filePath = writeTempFile(content);

      await loadKernel(filePath);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('VERSION_MISMATCH')
      );
    });

    it('continues with the file version (does not halt)', async () => {
      const content = buildKernelContent('v15.0');
      const filePath = writeTempFile(content);

      const result = await loadKernel(filePath);

      // All 36 slugs are present so status should be active despite version mismatch
      expect(result.state.status).toBe('active');
    });

    it('returns the version string from the file, not the expected constant', async () => {
      const content = buildKernelContent('v99.9');
      const filePath = writeTempFile(content);

      const result = await loadKernel(filePath);

      expect(result.state.version).toBe('v99.9');
    });
  });

  // -------------------------------------------------------------------------
  // 4. Successful load
  // -------------------------------------------------------------------------
  describe('when the kernel file is valid', () => {
    it('returns status active', async () => {
      const content = buildKernelContent();
      const filePath = writeTempFile(content);

      const result = await loadKernel(filePath);

      expect(result.state.status).toBe('active');
    });

    it('returns exactly 36 OS_Module slugs', async () => {
      const content = buildKernelContent();
      const filePath = writeTempFile(content);

      const result = await loadKernel(filePath);

      expect(result.state.osModuleSlugs).toHaveLength(36);
    });

    it('returns all 36 canonical slugs', async () => {
      const content = buildKernelContent();
      const filePath = writeTempFile(content);

      const result = await loadKernel(filePath);

      const returnedSet = new Set(result.state.osModuleSlugs);
      for (const slug of CANONICAL_SLUGS) {
        expect(returnedSet.has(slug)).toBe(true);
      }
    });

    it('returns the correct version string', async () => {
      const content = buildKernelContent();
      const filePath = writeTempFile(content);

      const result = await loadKernel(filePath);

      expect(result.state.version).toBe(EXPECTED_KERNEL_VERSION);
    });

    it('does not log any errors on a clean load', async () => {
      const content = buildKernelContent();
      const filePath = writeTempFile(content);

      await loadKernel(filePath);

      expect(consoleSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('returns a loadedAt ISO 8601 timestamp', async () => {
      const content = buildKernelContent();
      const filePath = writeTempFile(content);

      const result = await loadKernel(filePath);

      expect(result.state.loadedAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );
    });
  });

  // -------------------------------------------------------------------------
  // 5. Slug mismatch → halted
  // -------------------------------------------------------------------------
  describe('when the slug set does not match the canonical 36', () => {
    it('returns status halted when a slug is missing', async () => {
      const slugs = [...CANONICAL_SLUGS].slice(0, 35); // drop one
      const content = buildKernelContent(EXPECTED_KERNEL_VERSION, slugs);
      const filePath = writeTempFile(content);

      const result = await loadKernel(filePath);

      expect(result.state.status).toBe('halted');
    });

    it('returns status halted when an unexpected slug is present', async () => {
      const slugs = [...CANONICAL_SLUGS, 'FAKE-OS'];
      const content = buildKernelContent(EXPECTED_KERNEL_VERSION, slugs);
      const filePath = writeTempFile(content);

      const result = await loadKernel(filePath);

      expect(result.state.status).toBe('halted');
    });

    it('logs a KERNEL_VALIDATION_FAILED error with the diff', async () => {
      const slugs = [...CANONICAL_SLUGS].slice(0, 35);
      const content = buildKernelContent(EXPECTED_KERNEL_VERSION, slugs);
      const filePath = writeTempFile(content);

      await loadKernel(filePath);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('KERNEL_VALIDATION_FAILED')
      );
    });

    it('returns KERNEL_VALIDATION_FAILED error code', async () => {
      const slugs = [...CANONICAL_SLUGS].slice(0, 35);
      const content = buildKernelContent(EXPECTED_KERNEL_VERSION, slugs);
      const filePath = writeTempFile(content);

      const result = await loadKernel(filePath);

      expect(result.errorCode).toBe('KERNEL_VALIDATION_FAILED');
    });
  });
});
