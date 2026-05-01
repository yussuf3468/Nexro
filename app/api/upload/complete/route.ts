/**
 * POST /api/upload/complete
 *
 * Finalizes an upload: verifies all chunks arrived, saves the file record
 * with the bcrypt-hashed access code and encryption parameters.
 *
 * The server NEVER receives the raw access code – only its bcrypt hash.
 * The client computes the hash using the /api/upload/hash-code helper first.
 *
 * Body: CompleteUploadRequest
 */

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin, STORAGE_BUCKET } from "@/lib/supabase-server";
import { getClientIP, isValidUUID, sanitizeInput } from "@/lib/crypto-server";
import { sha256Hex } from "@/lib/crypto-server";
import { sanitizeFileName, expiryToDate } from "@/lib/utils";
import type { ExpiryOption } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      fileId,
      sessionId,
      accessCodeHash, // bcrypt hash generated server-side via /api/upload/hash-code
      salt,
      iv,
      fileName,
      fileSize,
      mimeType,
      chunkCount,
      expiresIn,
      maxDownloads,
    } = body as {
      fileId: string;
      sessionId: string;
      accessCodeHash: string;
      salt: string;
      iv: string;
      fileName: string;
      fileSize: number;
      mimeType: string;
      chunkCount: number;
      expiresIn?: ExpiryOption;
      maxDownloads?: number | null;
    };

    // ── Validate ─────────────────────────────────────────────────────────────
    if (!isValidUUID(fileId) || !isValidUUID(sessionId)) {
      return NextResponse.json({ error: "Invalid IDs." }, { status: 400 });
    }

    if (
      typeof accessCodeHash !== "string" ||
      !accessCodeHash.startsWith("$2") ||
      accessCodeHash.length < 50
    ) {
      return NextResponse.json(
        { error: "Invalid access code hash." },
        { status: 400 },
      );
    }

    if (!salt || !iv || typeof chunkCount !== "number" || chunkCount < 1) {
      return NextResponse.json(
        { error: "Missing encryption parameters." },
        { status: 400 },
      );
    }

    const cleanName = sanitizeFileName(sanitizeInput(fileName ?? ""));
    if (!cleanName) {
      return NextResponse.json(
        { error: "Invalid file name." },
        { status: 400 },
      );
    }

    // ── Verify session ────────────────────────────────────────────────────────
    const { data: session, error: sessionErr } = await supabaseAdmin
      .from("upload_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("file_id", fileId)
      .eq("completed", false)
      .single();

    if (sessionErr || !session) {
      return NextResponse.json(
        { error: "Upload session not found or already completed." },
        { status: 404 },
      );
    }

    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "Upload session expired." },
        { status: 410 },
      );
    }

    // Verify all expected chunks are present in Supabase Storage
    const { data: storedObjects, error: listError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .list(`uploads/${fileId}`);

    if (listError) {
      return NextResponse.json(
        { error: "Failed to verify uploaded chunks." },
        { status: 500 },
      );
    }

    const storedNames = new Set((storedObjects ?? []).map((o) => o.name));
    const missing: number[] = [];
    for (let i = 0; i < chunkCount; i++) {
      if (!storedNames.has(`chunk_${i}`)) missing.push(i);
    }
    if (missing.length > 0) {
      return NextResponse.json(
        {
          error: `Missing chunks: ${missing.slice(0, 10).join(", ")}${missing.length > 10 ? "…" : ""}.`,
          missingChunks: missing,
        },
        { status: 422 },
      );
    }

    // ── Compute expiry & limits ───────────────────────────────────────────────
    const expiresAt = expiresIn
      ? (expiryToDate(expiresIn)?.toISOString() ?? null)
      : null;
    const maxDl =
      maxDownloads != null && maxDownloads > 0
        ? Math.min(maxDownloads, 10_000)
        : null;

    // ── Insert file record ────────────────────────────────────────────────────
    const storagePath = `uploads/${fileId}`;

    const { error: insertError } = await supabaseAdmin.from("files").insert({
      id: fileId,
      name: cleanName,
      original_name: cleanName,
      size: fileSize,
      mime_type: mimeType,
      access_code_hash: accessCodeHash,
      salt,
      iv,
      chunk_count: chunkCount,
      max_downloads: maxDl,
      expires_at: expiresAt,
      storage_path: storagePath,
    });

    if (insertError) {
      console.error("[upload/complete] insert error:", insertError.message);
      return NextResponse.json(
        { error: "Failed to save file record." },
        { status: 500 },
      );
    }

    // ── Mark session as completed ─────────────────────────────────────────────
    await supabaseAdmin
      .from("upload_sessions")
      .update({ completed: true })
      .eq("id", sessionId);

    return NextResponse.json({ fileId });
  } catch (err) {
    console.error("[upload/complete] unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
