import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, STORAGE_BUCKET } from "@/lib/supabase-server";
import { isValidUUID } from "@/lib/crypto-server";

/** GET /api/admin/files?page=1&limit=25&search=&filter=all */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") ?? "25", 10)),
  );
  const search = searchParams.get("search")?.trim() ?? "";
  const filter = searchParams.get("filter") ?? "all"; // all | active | expired | deleted

  let query = supabaseAdmin
    .from("files")
    .select(
      "id, name, original_name, size, mime_type, download_count, max_downloads, expires_at, created_at, is_deleted, storage_path, chunk_count",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (search) {
    query = query.ilike("original_name", `%${search}%`);
  }

  const now = new Date().toISOString();
  if (filter === "active") {
    query = query
      .eq("is_deleted", false)
      .or(`expires_at.is.null,expires_at.gt.${now}`);
  } else if (filter === "expired") {
    query = query.eq("is_deleted", false).lt("expires_at", now);
  } else if (filter === "deleted") {
    query = query.eq("is_deleted", true);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch files." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    files: data ?? [],
    total: count ?? 0,
    page,
    limit,
  });
}

/** DELETE /api/admin/files?id=<uuid>  — soft-delete a file */
export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id || !isValidUUID(id)) {
    return NextResponse.json({ error: "Invalid file ID." }, { status: 400 });
  }

  // Mark deleted in DB
  const { data: file, error: fetchErr } = await supabaseAdmin
    .from("files")
    .select("storage_path, chunk_count")
    .eq("id", id)
    .single();

  if (fetchErr || !file) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  // Remove chunks from storage
  const chunkPaths = Array.from(
    { length: file.chunk_count },
    (_, i) => `${file.storage_path}/chunk_${i}`,
  );

  await supabaseAdmin.storage.from(STORAGE_BUCKET).remove(chunkPaths);

  // Mark as deleted
  const { error: updateErr } = await supabaseAdmin
    .from("files")
    .update({ is_deleted: true })
    .eq("id", id);

  if (updateErr) {
    return NextResponse.json(
      { error: "Failed to delete file." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
