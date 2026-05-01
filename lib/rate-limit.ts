import { supabaseAdmin } from "./supabase-server";
import { sha256Hex } from "./crypto-server";

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

/** Hash an IP address for privacy-preserving storage */
export async function hashIP(ip: string): Promise<string> {
  return sha256Hex(ip + (process.env.RATE_LIMIT_SALT ?? "nexro-rl-salt"));
}

/** Returns number of recent failed attempts for this file+IP pair */
export async function countRecentFailures(
  fileId: string,
  ipHash: string,
): Promise<number> {
  const windowStart = new Date(Date.now() - WINDOW_MS).toISOString();

  const { count, error } = await supabaseAdmin
    .from("access_attempts")
    .select("*", { count: "exact", head: true })
    .eq("file_id", fileId)
    .eq("ip_hash", ipHash)
    .eq("success", false)
    .gte("attempted_at", windowStart);

  if (error) {
    console.error("[rate-limit] count error:", error.message);
    return 0;
  }
  return count ?? 0;
}

/** Record an access attempt */
export async function recordAttempt(
  fileId: string,
  ipHash: string,
  success: boolean,
): Promise<void> {
  await supabaseAdmin.from("access_attempts").insert({
    file_id: fileId,
    ip_hash: ipHash,
    success,
  });
}

/** Returns true if the IP is rate-limited for this file */
export async function isRateLimited(
  fileId: string,
  ipHash: string,
): Promise<boolean> {
  const count = await countRecentFailures(fileId, ipHash);
  return count >= MAX_ATTEMPTS;
}

/** How many attempts remain before lockout */
export function attemptsLeft(failures: number): number {
  return Math.max(0, MAX_ATTEMPTS - failures);
}

export { MAX_ATTEMPTS, WINDOW_MS };
