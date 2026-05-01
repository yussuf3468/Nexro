import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

/** GET /api/admin/stats */
export async function GET() {
  const [filesResult, sessionsResult, attemptsResult] = await Promise.all([
    supabaseAdmin
      .from("files")
      .select("id, size, download_count, is_deleted, created_at, expires_at"),
    supabaseAdmin.from("upload_sessions").select("id, completed, created_at"),
    supabaseAdmin.from("access_attempts").select("id, attempted_at"),
  ]);

  if (filesResult.error || sessionsResult.error || attemptsResult.error) {
    return NextResponse.json(
      { error: "Failed to fetch stats." },
      { status: 500 },
    );
  }

  const files = filesResult.data ?? [];
  const sessions = sessionsResult.data ?? [];
  const attempts = attemptsResult.data ?? [];

  const now = new Date();
  const activeFiles = files.filter(
    (f) => !f.is_deleted && (!f.expires_at || new Date(f.expires_at) > now),
  );
  const expiredFiles = files.filter(
    (f) => f.expires_at && new Date(f.expires_at) <= now,
  );
  const deletedFiles = files.filter((f) => f.is_deleted);
  const totalStorage = activeFiles.reduce((sum, f) => sum + (f.size ?? 0), 0);
  const totalDownloads = files.reduce(
    (sum, f) => sum + (f.download_count ?? 0),
    0,
  );

  // Uploads in last 24h
  const oneDayAgo = new Date(Date.now() - 86_400_000);
  const recentUploads = files.filter(
    (f) => new Date(f.created_at) > oneDayAgo,
  ).length;

  // Failed attempts in last 24h
  const recentFailedAttempts = attempts.filter(
    (a) => new Date(a.attempted_at) > oneDayAgo,
  ).length;

  return NextResponse.json({
    totalFiles: files.length,
    activeFiles: activeFiles.length,
    expiredFiles: expiredFiles.length,
    deletedFiles: deletedFiles.length,
    totalStorageBytes: totalStorage,
    totalDownloads,
    recentUploads,
    recentFailedAttempts,
    pendingSessions: sessions.filter((s) => !s.completed).length,
    completedSessions: sessions.filter((s) => s.completed).length,
  });
}
