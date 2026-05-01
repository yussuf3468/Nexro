/**
 * GET /api/cron/cleanup
 *
 * Soft-deletes expired files and files that have reached their download limit.
 * Also removes orphaned storage objects and prunes old rate-limit records.
 *
 * Call this endpoint from a cron job (e.g. Vercel Cron, GitHub Actions) every hour.
 * Protect it with a CRON_SECRET environment variable.
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, STORAGE_BUCKET } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    // Run the cleanup SQL function
    const { data, error } = await supabaseAdmin.rpc("cleanup_expired_files");

    if (error) {
      console.error("[cron/cleanup] rpc error:", error.message);
      return NextResponse.json({ error: "Cleanup failed." }, { status: 500 });
    }

    // Delete storage objects for soft-deleted files
    const { data: deletedFiles } = await supabaseAdmin
      .from("files")
      .select("id, chunk_count")
      .eq("is_deleted", true);

    let storageDeleted = 0;
    if (deletedFiles) {
      for (const file of deletedFiles) {
        const paths = Array.from(
          { length: file.chunk_count },
          (_, i) => `uploads/${file.id}/chunk_${i}`,
        );

        // Delete in batches of 100
        for (let i = 0; i < paths.length; i += 100) {
          const batch = paths.slice(i, i + 100);
          const { error: delErr } = await supabaseAdmin.storage
            .from(STORAGE_BUCKET)
            .remove(batch);

          if (!delErr) storageDeleted += batch.length;
        }
      }
    }

    return NextResponse.json({
      ok: true,
      filesMarked: data ?? 0,
      chunksDeleted: storageDeleted,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[cron/cleanup] unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
