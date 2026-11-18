import * as crypto from "node:crypto";
import { promisify } from "node:util";

const { randomBytes, timingSafeEqual } = crypto;
const cryptoArgon2 = (crypto as unknown as { argon2?: (...args: unknown[]) => void }).argon2;
const derive = typeof cryptoArgon2 === "function" ? promisify(cryptoArgon2) : null;

/** OWASP's recommended argon2id settings: 19 MiB of memory, 2 passes, 1 lane. */
const DEFAULTS = { memory: 19_456, passes: 2, parallelism: 1 };
const SALT_BYTES = 16;
const HASH_BYTES = 32;
/** More memory than this per sign-in would crowd out Chromium in a 1 GB container. */
const MAX_MEMORY = 262_144;

const FORMAT = /^argon2id:m=(\d{1,7}),t=(\d{1,3}),p=(\d{1,3}):([\w-]{22,}):([\w-]{43,})$/;

type PasswordHash = {
  memory: number;
  passes: number;
  parallelism: number;
  salt: Buffer;
  hash: Buffer;
};

/** Reads a hash written by hashPassword(); null when `value` isn't one. */
export function parsePasswordHash(value: string): PasswordHash | null {
  const match = FORMAT.exec(value);
  if (!match) return null;
  const [memory, passes, parallelism] = match.slice(1, 4).map(Number);
  if (passes < 1 || parallelism < 1 || memory < 8 * parallelism || memory > MAX_MEMORY) return null;
  return {
    memory,
    passes,
    parallelism,
    salt: Buffer.from(match[4], "base64url"),
    hash: Buffer.from(match[5], "base64url"),
  };
}

/** Whether `value` is a password hash rather than a password. */
export function isPasswordHash(value: string): boolean {
  return parsePasswordHash(value) !== null;
}

async function compute(password: string, { memory, passes, parallelism, salt }: Omit<PasswordHash, "hash">, length: number): Promise<Buffer> {
  if (!derive) {
    throw new Error(
      "Node.js 24+ is required for built-in crypto.argon2. Please install and switch to Node 24 (nvm install 24 && nvm use 24).",
    );
  }
  return derive("argon2id", { message: password, nonce: salt, memory, passes, parallelism, tagLength: length }) as Promise<Buffer>;
}

/** Hashes `password` with a fresh random salt, for DOSSIER_PASSWORD. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const hash = await compute(password, { ...DEFAULTS, salt }, HASH_BYTES);
  const { memory, passes, parallelism } = DEFAULTS;
  return `argon2id:m=${memory},t=${passes},p=${parallelism}:${salt.toString("base64url")}:${hash.toString("base64url")}`;
}

/** Whether `candidate` is the password that `stored` is a hash of. */
export async function verifyPassword(candidate: string, stored: string): Promise<boolean> {
  const parsed = parsePasswordHash(stored);
  if (!parsed) return false;
  const hash = await compute(candidate, parsed, parsed.hash.length);
  return timingSafeEqual(hash, parsed.hash);
}
