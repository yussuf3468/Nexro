import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

/** GET /api/admin/sessions */
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("upload_sessions")
    .select(
      "id, file_id, expected_chunks, received_chunks, completed, created_at, expires_at, ip_hash",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch sessions." },
      { status: 500 },
    );
  }

  return NextResponse.json({ sessions: data ?? [] });
}
