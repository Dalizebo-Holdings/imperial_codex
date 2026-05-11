/**
 * VaultRepository — AES-256-GCM encrypted vault backed by Supabase.
 *
 * Replaces the filesystem-based /vault/CLEARANCE_CODES.json implementation.
 * The vault is a single-row Supabase table (id = 1) protected by RLS.
 * All reads and writes use the service-role client to bypass RLS.
 *
 * Encryption key: VAULT_ENCRYPTION_KEY env var (64-char hex = 32 bytes).
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { getSupabaseServiceClient, SupabaseDegradedError } from '@/lib/db/supabase';
import { withRetry } from '@/lib/db/retry';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV for GCM
const TAG_LENGTH = 16;

export interface EncryptedEnvelope {
  iv: string; // base64
  tag: string; // base64
  ciphertext: string; // base64
}

export type VaultData = Record<string, unknown>;

function getKey(): Buffer {
  const hex = process.env.VAULT_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error('VAULT_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
  }
  return Buffer.from(hex, 'hex');
}

/**
 * Encrypts plaintext using AES-256-GCM.
 */
export function encrypt(plaintext: string, key: Buffer): EncryptedEnvelope {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    ciphertext: encrypted.toString('base64'),
  };
}

/**
 * Decrypts an EncryptedEnvelope using AES-256-GCM.
 */
export function decrypt(envelope: EncryptedEnvelope, key: Buffer): string {
  const iv = Buffer.from(envelope.iv, 'base64');
  const tag = Buffer.from(envelope.tag, 'base64');
  const ciphertext = Buffer.from(envelope.ciphertext, 'base64');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

/**
 * Reads and decrypts vault data from Supabase.
 * Returns an empty object if the vault row does not exist yet.
 */
export async function read(): Promise<VaultData> {
  const client = getSupabaseServiceClient();
  const key = getKey();

  const row = await withRetry(async () => {
    const { data, error } = await client
      .from('vault')
      .select('encrypted_envelope')
      .eq('id', 1)
      .single();

    if (error?.code === 'PGRST116') return null; // no row yet
    if (error) throw Object.assign(new Error(error.message), { code: 'DB_QUERY_FAILED' });
    return data;
  });

  if (!row) return {};

  try {
    const envelope: EncryptedEnvelope = JSON.parse(row.encrypted_envelope);
    const plaintext = decrypt(envelope, key);
    return JSON.parse(plaintext) as VaultData;
  } catch {
    throw Object.assign(new Error('Vault decryption failed — wrong key or corrupted data'), {
      code: 'VAULT_UNAVAILABLE',
    });
  }
}

/**
 * Encrypts and writes vault data to Supabase (upsert on id = 1).
 */
export async function write(data: VaultData): Promise<void> {
  const client = getSupabaseServiceClient();
  const key = getKey();

  const plaintext = JSON.stringify(data);
  const envelope = encrypt(plaintext, key);
  const envelopeJson = JSON.stringify(envelope);

  await withRetry(async () => {
    const { error } = await client.from('vault').upsert(
      {
        id: 1,
        encrypted_envelope: envelopeJson,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    if (error) {
      throw Object.assign(new Error(error.message), { code: 'DB_INSERT_FAILED' });
    }
  });
}
