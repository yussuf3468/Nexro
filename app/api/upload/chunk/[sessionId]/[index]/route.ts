/**
 * POST /api/upload/chunk/[sessionId]/[index]
 *
 * Receives a single encrypted chunk (binary body) and stores it in Supabase
 * Storage.  The client must upload chunks in any order; the server tracks
 * which have arrived.
 *
 * Headers: Content-Type: application/octet-stream
 * Params:
 *   sessionId – upload session UUID
 *   index     – zero-based chunk index (integer string)
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, STORAGE_BUCKET } from "@/lib/supabase-server";
import { isValidUUID } from "@/lib/crypto-server";

// Max single chunk: 12 MB (10 MB data + AES-GCM tag overhead + margin)
const MAX_CHUNK_BYTES = 12 * 1024 * 1024;

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string; index: string } },
) {
  try {
    const { sessionId, index: indexStr } = params;

    // ── Validate params ──────────────────────────────────────────────────────
    if (!isValidUUID(sessionId)) {
      return NextResponse.json(
        { error: "Invalid session ID." },
        { status: 400 },
      );
    }

    const chunkIndex = parseInt(indexStr, 10);
    if (!Number.isInteger(chunkIndex) || chunkIndex < 0 || chunkIndex > 9999) {
      return NextResponse.json(
        { error: "Invalid chunk index." },
        { status: 400 },
      );
    }

    // ── Verify session exists and is not expired ──────────────────────────────
    const { data: session, error: sessionError } = await supabaseAdmin
      .from("upload_sessions")
      .select(
        "id, file_id, expected_chunks, received_chunks, completed, expires_at",
      )
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Upload session not found or expired." },
        { status: 404 },
      );
    }

    if (session.completed) {
      return NextResponse.json(
        { error: "Upload session already completed." },
        { status: 409 },
      );
    }

    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "Upload session expired." },
        { status: 410 },
      );
    }

    if (chunkIndex >= session.expected_chunks) {
      return NextResponse.json(
        { error: `Chunk index ${chunkIndex} out of range.` },
        { status: 400 },
      );
    }

    // ── Read binary body ──────────────────────────────────────────────────────
    const contentLength = parseInt(
      request.headers.get("content-length") ?? "0",
      10,
    );
    if (contentLength > MAX_CHUNK_BYTES) {
      return NextResponse.json(
        { error: `Chunk too large (max ${MAX_CHUNK_BYTES} bytes).` },
        { status: 413 },
      );
    }

    const body = await request.arrayBuffer();
    if (body.byteLength === 0) {
      return NextResponse.json({ error: "Empty chunk body." }, { status: 400 });
    }
    if (body.byteLength > MAX_CHUNK_BYTES) {
      return NextResponse.json({ error: "Chunk too large." }, { status: 413 });
    }

    // ── Upload to Supabase Storage ────────────────────────────────────────────
    const storagePath = `uploads/${session.file_id}/chunk_${chunkIndex}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, body, {
        contentType: "application/octet-stream",
        upsert: true,
      });

    if (uploadError) {
      console.error("[upload/chunk] storage error:", uploadError.message);
      return NextResponse.json(
        { error: "Failed to store chunk. Please retry." },
        { status: 502 },
      );
    }

    // ── Update received_chunks list ───────────────────────────────────────────
    const updatedChunks = Array.from(
      new Set([...(session.received_chunks as number[]), chunkIndex]),
    );

    await supabaseAdmin
      .from("upload_sessions")
      .update({ received_chunks: updatedChunks })
      .eq("id", sessionId);

    return NextResponse.json({
      success: true,
      received: updatedChunks.length,
      expected: session.expected_chunks,
    });
  } catch (err) {
    console.error("[upload/chunk] unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
