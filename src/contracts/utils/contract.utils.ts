import { createHash, randomUUID } from 'crypto';

/**
 * Validates and returns a bytes32 hex string
 * @throws Error if hex is not a valid bytes32 format
 */
export function toBytes32(hex: string): string {
  if (!/^0x[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error('Invalid bytes32 hex');
  }
  return hex;
}

/**
 * Converts a UUID (or generates one) to a bytes32 hex string
 * Uses SHA-256 hash of the UUID
 */
export function uuidToBytes32(u?: string): string {
  const id = u ?? randomUUID();
  const h = createHash('sha256').update(id).digest('hex');
  return ('0x' + h) as string;
}

/**
 * Hashes a buffer using SHA-256 and returns as bytes32 hex string
 */
export function hashBuffer(buffer: Buffer): string {
  return ('0x' + createHash('sha256').update(buffer).digest('hex')) as string;
}

