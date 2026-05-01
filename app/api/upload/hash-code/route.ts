/**
 * POST /api/upload/hash-code
 *
 * Server-side bcrypt hashing of the access code.
 * The client sends the raw code, the server returns the bcrypt hash,
 * which the client then includes in the /api/upload/complete request.
 *
 * The raw code is never persisted on the server.
 *
 * Body: { accessCode: string }
 * Response: { hash: string }
 */

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getClientIP } from "@/lib/crypto-server";
import { sha256Hex } from "@/lib/crypto-server";

const BCRYPT_ROUNDS = 12;

// Rate limit: 10 hashing requests per IP per minute
const hashAttempts = new Map<string, number[]>();

function checkHashRateLimit(ipHash: string): boolean {
  const now = Date.now();
  const window = 60_000;
  const attempts = (hashAttempts.get(ipHash) ?? []).filter(
    (t) => now - t < window,
  );
  if (attempts.length >= 10) return false;
  hashAttempts.set(ipHash, [...attempts, now]);
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const ipHash = sha256Hex(ip);

    if (!checkHashRateLimit(ipHash)) {
      return NextResponse.json(
        { error: "Too many requests." },
        { status: 429 },
      );
    }

    const body = await request.json();
    const { accessCode } = body as { accessCode: string };

    if (
      typeof accessCode !== "string" ||
      accessCode.length < 6 ||
      accessCode.length > 64
    ) {
      return NextResponse.json(
        { error: "Invalid access code." },
        { status: 400 },
      );
    }

    // Normalize before hashing (strip dashes, uppercase)
    const normalized = accessCode.replace(/-/g, "").toUpperCase().trim();

    const hash = await bcrypt.hash(normalized, BCRYPT_ROUNDS);

    return NextResponse.json({ hash });
  } catch (err) {
    console.error("[upload/hash-code]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
