import { createHmac, createHash } from "crypto";

/**
 * Server-side crypto helpers (Node.js built-in).
 * These mirror the browser Web Crypto API utilities but run in API routes.
 */

/** SHA-256 hash → hex string */
export function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

/** HMAC-SHA256 for JWT-like session tokens */
export function hmacSign(data: string, secret: string): string {
  return createHmac("sha256", secret).update(data).digest("base64url");
}

const SESSION_SECRET =
  process.env.SESSION_SECRET ?? "nexro-session-secret-change-me";
const SESSION_TTL_SECONDS = 3600; // 1 hour

export interface SessionPayload {
  fileId: string;
  iat: number;
  exp: number;
}

/** Create a signed download session token */
export function createSessionToken(fileId: string): string {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + SESSION_TTL_SECONDS;
  const payload = Buffer.from(JSON.stringify({ fileId, iat, exp })).toString(
    "base64url",
  );
  const sig = hmacSign(payload, SESSION_SECRET);
  return `${payload}.${sig}`;
}

/** Verify and decode a session token. Returns null if invalid/expired. */
export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const [payload, sig] = token.split(".");
    if (!payload || !sig) return null;

    const expected = hmacSign(payload, SESSION_SECRET);
    // Constant-time comparison
    if (!timingSafeEqual(sig, expected)) return null;

    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as SessionPayload;

    if (Math.floor(Date.now() / 1000) > data.exp) return null;
    return data;
  } catch {
    return null;
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** Get real client IP from request headers */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "127.0.0.1";
}

/** Validate that a string matches UUID v4 format */
export function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    str,
  );
}

/** Sanitize string input (strip HTML/script tags) */
export function sanitizeInput(input: string): string {
  return input.replace(/[<>"'`]/g, "").trim();
}
