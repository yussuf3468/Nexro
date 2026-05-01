/**
 * POST /api/upload/init
 *
 * Creates an upload session record and returns a fileId + sessionId.
 * The client uses these to upload encrypted chunks and then complete the upload.
 *
 * Body: { fileName, fileSize, mimeType, chunkCount }
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getClientIP, isValidUUID, sanitizeInput } from "@/lib/crypto-server";
import { sha256Hex } from "@/lib/crypto-server";
import { sanitizeFileName, MAX_FILE_SIZE } from "@/lib/utils";

const MAX_CHUNK_COUNT = 2000; // 10 MB × 2000 = 20 GB max

// Simple in-process rate limit for upload init (5 inits per IP per minute)
const initAttempts = new Map<string, number[]>();

function checkInitRateLimit(ipHash: string): boolean {
  const now = Date.now();
  const window = 60_000;
  const attempts = (initAttempts.get(ipHash) ?? []).filter(
    (t) => now - t < window,
  );
  if (attempts.length >= 5) return false;
  initAttempts.set(ipHash, [...attempts, now]);
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const ipHash = sha256Hex(ip);

    if (!checkInitRateLimit(ipHash)) {
      return NextResponse.json(
        { error: "Too many upload requests. Wait a minute." },
        { status: 429 },
      );
    }

    const body = await request.json();
    const { fileName, fileSize, mimeType, chunkCount } = body as {
      fileName: string;
      fileSize: number;
      mimeType: string;
      chunkCount: number;
    };

    // ── Validate inputs ──────────────────────────────────────────────────────
    if (
      typeof fileName !== "string" ||
      typeof fileSize !== "number" ||
      typeof mimeType !== "string" ||
      typeof chunkCount !== "number"
    ) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    const cleanName = sanitizeFileName(sanitizeInput(fileName));
    if (!cleanName) {
      return NextResponse.json(
        { error: "Invalid file name." },
        { status: 400 },
      );
    }

    if (fileSize <= 0 || fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File size must be between 1 byte and ${MAX_FILE_SIZE} bytes.`,
        },
        { status: 400 },
      );
    }

    if (
      !Number.isInteger(chunkCount) ||
      chunkCount < 1 ||
      chunkCount > MAX_CHUNK_COUNT
    ) {
      return NextResponse.json(
        { error: `Chunk count must be between 1 and ${MAX_CHUNK_COUNT}.` },
        { status: 400 },
      );
    }

    // ── Create upload session ─────────────────────────────────────────────────
    const fileId = crypto.randomUUID();

    const { data: session, error } = await supabaseAdmin
      .from("upload_sessions")
      .insert({
        file_id: fileId,
        expected_chunks: chunkCount,
        ip_hash: ipHash,
      })
      .select("id")
      .single();

    if (error || !session) {
      console.error("[upload/init]", error);
      return NextResponse.json(
        { error: "Failed to create upload session." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      fileId,
      sessionId: session.id,
    });
  } catch (err) {
    console.error("[upload/init] unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
