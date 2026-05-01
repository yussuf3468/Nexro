/**
 * POST /api/files/[id]/access
 *
 * Verifies the access code against the stored bcrypt hash.
 * Returns a short-lived session token and the decryption parameters
 * (salt, iv, chunkCount) so the client can decrypt the file.
 *
 * Rate-limited: 5 failed attempts per IP per 15 minutes.
 *
 * Body:  { accessCode: string }
 * Response: AccessResponse
 */

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase-server";
import {
  getClientIP,
  isValidUUID,
  createSessionToken,
} from "@/lib/crypto-server";
import { sha256Hex } from "@/lib/crypto-server";
import {
  isRateLimited,
  recordAttempt,
  countRecentFailures,
  attemptsLeft,
} from "@/lib/rate-limit";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id: fileId } = params;

  if (!isValidUUID(fileId)) {
    return NextResponse.json({ error: "Invalid file ID." }, { status: 400 });
  }

  const ip = getClientIP(request);
  const ipHash = sha256Hex(ip);

  try {
    // ── Rate-limit check ──────────────────────────────────────────────────────
    if (await isRateLimited(fileId, ipHash)) {
      return NextResponse.json(
        {
          error:
            "Too many failed attempts. Please wait 15 minutes before trying again.",
          attemptsLeft: 0,
        },
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
        { error: "Invalid access code format." },
        { status: 400 },
      );
    }

    // Normalize: strip dashes, uppercase
    const normalized = accessCode.replace(/-/g, "").toUpperCase().trim();

    // ── Fetch file record ─────────────────────────────────────────────────────
    const { data: file, error: fileError } = await supabaseAdmin
      .from("files")
      .select(
        "id, name, size, mime_type, access_code_hash, salt, iv, chunk_count, download_count, max_downloads, expires_at",
      )
      .eq("id", fileId)
      .eq("is_deleted", false)
      .single();

    if (fileError || !file) {
      return NextResponse.json(
        { error: "File not found or has expired." },
        { status: 404 },
      );
    }

    // Check expiry
    if (file.expires_at && new Date(file.expires_at) < new Date()) {
      await supabaseAdmin
        .from("files")
        .update({ is_deleted: true })
        .eq("id", fileId);
      return NextResponse.json({ error: "File has expired." }, { status: 410 });
    }

    // Check download limit
    if (
      file.max_downloads != null &&
      file.download_count >= file.max_downloads
    ) {
      await supabaseAdmin
        .from("files")
        .update({ is_deleted: true })
        .eq("id", fileId);
      return NextResponse.json(
        { error: "Download limit reached." },
        { status: 410 },
      );
    }

    // ── Verify access code ────────────────────────────────────────────────────
    const isValid = await bcrypt.compare(normalized, file.access_code_hash);

    await recordAttempt(fileId, ipHash, isValid);

    if (!isValid) {
      const failures = await countRecentFailures(fileId, ipHash);
      const left = attemptsLeft(failures);
      return NextResponse.json(
        {
          error: "Incorrect access code.",
          attemptsLeft: left,
        },
        { status: 401 },
      );
    }

    // ── Issue session token ───────────────────────────────────────────────────
    const sessionToken = createSessionToken(fileId);

    // Increment download count
    await supabaseAdmin.rpc("increment_download_count", { file_id: fileId });

    return NextResponse.json(
      {
        sessionToken,
        salt: file.salt,
        iv: file.iv,
        chunkCount: file.chunk_count,
        fileName: file.name,
        mimeType: file.mime_type,
        fileSize: file.size,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("[files/access] error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
