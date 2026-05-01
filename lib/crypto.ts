/**
 * Nexro – Client-side End-to-End Encryption
 *
 * Algorithm  : AES-256-GCM
 * Key Derivation: PBKDF2-SHA-256, 200 000 iterations
 * Chunk size : 10 MB (configurable via CHUNK_SIZE)
 * Per-chunk IV: base IV XOR little-endian chunk index in the last 4 bytes
 *
 * The server NEVER receives the raw access code or the derived key.
 */

const CHUNK_SIZE = 10 * 1024 * 1024; // 10 MB
const PBKDF2_ITERATIONS = 200_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;
const KEY_BITS = 256;

// Unambiguous character set for generated codes (no 0/O, 1/I/L)
const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Generate a cryptographically random 8-character access code */
export function generateAccessCode(): string {
  const arr = new Uint8Array(8);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => CODE_CHARS[b % CODE_CHARS.length]).join("");
}

/** Format code as XXXX-XXXX for display */
export function formatCode(raw: string): string {
  const c = raw.replace(/-/g, "").toUpperCase();
  return c.length === 8 ? `${c.slice(0, 4)}-${c.slice(4)}` : c;
}

/** Strip formatting dashes for internal use */
export function normalizeCode(code: string): string {
  return code.replace(/-/g, "").toUpperCase().trim();
}

export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_BYTES));
}

export function generateBaseIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(IV_BYTES));
}

/**
 * Derive a per-chunk IV by XOR-ing the last 4 bytes of baseIV with
 * the chunk index (big-endian). This guarantees uniqueness while keeping
 * all IVs linked to the same key material.
 */
function chunkIV(baseIV: Uint8Array, index: number): Uint8Array {
  const iv = baseIV.slice();
  iv[IV_BYTES - 4] ^= (index >>> 24) & 0xff;
  iv[IV_BYTES - 3] ^= (index >>> 16) & 0xff;
  iv[IV_BYTES - 2] ^= (index >>> 8) & 0xff;
  iv[IV_BYTES - 1] ^= index & 0xff;
  return iv;
}

/** Derive AES-256-GCM key from access code + salt via PBKDF2 */
export async function deriveKey(
  accessCode: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const raw = await crypto.subtle.importKey(
    "raw",
    enc.encode(normalizeCode(accessCode)),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    raw,
    { name: "AES-GCM", length: KEY_BITS },
    false,
    ["encrypt", "decrypt"],
  );
}

async function encryptChunk(
  key: CryptoKey,
  data: ArrayBuffer,
  iv: Uint8Array,
): Promise<ArrayBuffer> {
  return crypto.subtle.encrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, data);
}

async function decryptChunk(
  key: CryptoKey,
  data: ArrayBuffer,
  iv: Uint8Array,
): Promise<ArrayBuffer> {
  return crypto.subtle.decrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, data);
}

// ─── Streaming encrypt (generator) ──────────────────────────────────────────

export interface EncryptChunkResult {
  index: number;
  data: ArrayBuffer;
  totalChunks: number;
}

export interface CryptoParams {
  salt: string; // base64
  iv: string; // base64
  chunkCount: number;
}

/**
 * Async generator that encrypts a File chunk-by-chunk and yields each
 * encrypted chunk immediately.  Peak memory ≈ 2× CHUNK_SIZE (~20 MB).
 *
 * @param onCryptoParams - Called ONCE before the first yield with salt/iv/chunkCount
 */
export async function* encryptFileStream(
  file: File,
  accessCode: string,
  onCryptoParams: (params: CryptoParams) => void,
  onProgress?: (pct: number) => void,
): AsyncGenerator<EncryptChunkResult> {
  const salt = generateSalt();
  const baseIV = generateBaseIV();
  const key = await deriveKey(accessCode, salt);

  const totalChunks = Math.max(1, Math.ceil(file.size / CHUNK_SIZE));

  // Notify caller of crypto params before the first yield
  onCryptoParams({
    salt: toBase64(salt),
    iv: toBase64(baseIV),
    chunkCount: totalChunks,
  });

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const raw = await file.slice(start, end).arrayBuffer();
    const iv = chunkIV(baseIV, i);
    const encrypted = await encryptChunk(key, raw, iv);
    onProgress?.(Math.round(((i + 1) / totalChunks) * 100));
    yield { index: i, data: encrypted, totalChunks };
  }
}

// ─── Streaming decrypt (generator) ──────────────────────────────────────────

export interface DecryptOptions {
  accessCode: string;
  salt: string; // base64
  iv: string; // base64
  chunkCount: number;
  fetchChunk: (index: number) => Promise<ArrayBuffer>;
  onProgress?: (pct: number) => void;
}

/**
 * Async generator that downloads+decrypts chunk-by-chunk.
 * Yields Uint8Array for each plaintext chunk — caller can stream to disk.
 */
export async function* decryptFileStream(
  opts: DecryptOptions,
): AsyncGenerator<Uint8Array> {
  const { accessCode, salt, iv, chunkCount, fetchChunk, onProgress } = opts;
  const saltBytes = fromBase64(salt);
  const baseIV = fromBase64(iv);
  const key = await deriveKey(accessCode, saltBytes);

  for (let i = 0; i < chunkCount; i++) {
    const encrypted = await fetchChunk(i);
    const iv = chunkIV(baseIV, i);
    const plain = await decryptChunk(key, encrypted, iv);
    onProgress?.(Math.round(((i + 1) / chunkCount) * 100));
    yield new Uint8Array(plain);
  }
}

/**
 * Decrypt entire file into a single Uint8Array.
 * Use only for files that fit comfortably in browser memory (< ~1 GB).
 */
export async function decryptFileToBuffer(
  opts: DecryptOptions,
): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of decryptFileStream(opts)) {
    chunks.push(chunk);
  }
  const total = chunks.reduce((n, c) => n + c.byteLength, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.byteLength;
  }
  return out;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function toBase64(bytes: Uint8Array | ArrayBuffer): string {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  b.forEach((byte) => (s += String.fromCharCode(byte)));
  return btoa(s);
}

export function fromBase64(b64: string): Uint8Array {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

/** SHA-256 hash of a string → hex (works in browser and Node 18+) */
export async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder();
  const hash = await crypto.subtle.digest("SHA-256", enc.encode(input));
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export { CHUNK_SIZE };
