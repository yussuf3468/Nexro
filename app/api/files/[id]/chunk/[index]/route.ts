/**
 * GET /api/files/[id]/chunk/[index]?token=<sessionToken>
 *
 * Returns a redirect to a short-lived Supabase Storage signed URL
 * for a single encrypted chunk.  The client downloads encrypted bytes
 * and decrypts them locally.
 *
 * Query: token – session token from /api/files/[id]/access
 * Params: id, index
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, STORAGE_BUCKET } from "@/lib/supabase-server";
import { isValidUUID, verifySessionToken } from "@/lib/crypto-server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; index: string } },
) {
  try {
    const { id: fileId, index: indexStr } = params;
    const token = request.nextUrl.searchParams.get("token") ?? "";

    // ── Validate params ──────────────────────────────────────────────────────
    if (!isValidUUID(fileId)) {
      return NextResponse.json({ error: "Invalid file ID." }, { status: 400 });
    }

    const chunkIndex = parseInt(indexStr, 10);
    if (!Number.isInteger(chunkIndex) || chunkIndex < 0) {
      return NextResponse.json(
        { error: "Invalid chunk index." },
        { status: 400 },
      );
    }

    // ── Verify session token ──────────────────────────────────────────────────
    const session = verifySessionToken(token);
    if (!session || session.fileId !== fileId) {
      return NextResponse.json(
        { error: "Invalid or expired access token." },
        { status: 401 },
      );
    }

    // ── Verify chunk exists within the file ───────────────────────────────────
    const { data: file } = await supabaseAdmin
      .from("files")
      .select("chunk_count, is_deleted")
      .eq("id", fileId)
      .single();

    if (!file || file.is_deleted) {
      return NextResponse.json({ error: "File not found." }, { status: 404 });
    }

    if (chunkIndex >= file.chunk_count) {
      return NextResponse.json(
        { error: "Chunk index out of range." },
        { status: 400 },
      );
    }

    // ── Generate signed URL (60 seconds) ─────────────────────────────────────
    const storagePath = `uploads/${fileId}/chunk_${chunkIndex}`;

    const { data, error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(storagePath, 60);

    if (error || !data?.signedUrl) {
      console.error("[chunk] sign error:", error?.message);
      return NextResponse.json(
        { error: "Failed to generate download URL." },
        { status: 502 },
      );
    }

    // Redirect client directly to Supabase Storage (avoids proxying large data)
    return NextResponse.redirect(data.signedUrl, { status: 302 });
  } catch (err) {
    console.error("[chunk] unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
