/**
 * POST /api/upload/signed-url/[sessionId]/[index]
 *
 * Validates the upload session and returns a Supabase Storage signed upload
 * URL so the client can PUT the encrypted chunk DIRECTLY to Supabase,
 * completely bypassing Vercel's 4.5 MB function payload limit.
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, STORAGE_BUCKET } from "@/lib/supabase-server";
import { isValidUUID } from "@/lib/crypto-server";

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string; index: string } },
) {
  const { sessionId, index: indexStr } = params;

  if (!isValidUUID(sessionId)) {
    return NextResponse.json({ error: "Invalid session ID." }, { status: 400 });
  }

  const chunkIndex = parseInt(indexStr, 10);
  if (!Number.isInteger(chunkIndex) || chunkIndex < 0 || chunkIndex > 9999) {
    return NextResponse.json(
      { error: "Invalid chunk index." },
      { status: 400 },
    );
  }

  // ── Verify session is still valid ─────────────────────────────────────────
  const { data: session, error: sessionErr } = await supabaseAdmin
    .from("upload_sessions")
    .select("id, file_id, expected_chunks, completed, expires_at")
    .eq("id", sessionId)
    .single();

  if (sessionErr || !session) {
    return NextResponse.json(
      { error: "Upload session not found." },
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
      { error: `Chunk index ${chunkIndex} out of range (max ${session.expected_chunks - 1}).` },
      { status: 400 },
    );
  }

  // ── Generate signed upload URL (expires in 1 hour) ────────────────────────
  const storagePath = `uploads/${session.file_id}/chunk_${chunkIndex}`;

  const { data, error: urlError } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .createSignedUploadUrl(storagePath);

  if (urlError || !data) {
    console.error("[signed-url] error:", urlError?.message);
    return NextResponse.json(
      { error: "Failed to generate upload URL." },
      { status: 500 },
    );
  }

  return NextResponse.json({ signedUrl: data.signedUrl, path: storagePath });
}
