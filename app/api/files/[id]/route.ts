/**
 * GET /api/files/[id]
 *
 * Returns public file metadata (no access code required).
 * Does NOT expose: encryption params, storage path, access code hash.
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { isValidUUID } from "@/lib/crypto-server";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;

  if (!isValidUUID(id)) {
    return NextResponse.json({ error: "Invalid file ID." }, { status: 400 });
  }

  const { data: file, error } = await supabaseAdmin
    .from("files")
    .select(
      "id, name, size, mime_type, download_count, max_downloads, expires_at, created_at",
    )
    .eq("id", id)
    .eq("is_deleted", false)
    .single();

  if (error || !file) {
    return NextResponse.json(
      { error: "File not found or has expired." },
      { status: 404 },
    );
  }

  // Check expiry
  if (file.expires_at && new Date(file.expires_at) < new Date()) {
    // Soft-delete
    await supabaseAdmin.from("files").update({ is_deleted: true }).eq("id", id);
    return NextResponse.json(
      { error: "File has expired and been deleted." },
      { status: 410 },
    );
  }

  // Check download limit
  if (file.max_downloads != null && file.download_count >= file.max_downloads) {
    await supabaseAdmin.from("files").update({ is_deleted: true }).eq("id", id);
    return NextResponse.json(
      { error: "Download limit reached. File has been deleted." },
      { status: 410 },
    );
  }

  return NextResponse.json(file, {
    headers: { "Cache-Control": "no-store" },
  });
}
