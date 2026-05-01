import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ExpiryOption } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format bytes into human-readable size */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/** Format duration in a human-readable way */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

/** Format remaining time from an ISO timestamp */
export function formatTimeLeft(isoTimestamp: string): string {
  const ms = new Date(isoTimestamp).getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

/** Map ExpiryOption to a Date */
export function expiryToDate(option: ExpiryOption): Date | null {
  if (option === "never") return null;
  const map: Record<Exclude<ExpiryOption, "never">, number> = {
    "1h": 1 * 60 * 60 * 1000,
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
  };
  return new Date(Date.now() + map[option as Exclude<ExpiryOption, "never">]);
}

/** Expiry option labels */
export const EXPIRY_OPTIONS: { value: ExpiryOption; label: string }[] = [
  { value: "1h", label: "1 Hour" },
  { value: "24h", label: "24 Hours" },
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "never", label: "Never" },
];

/** Get a file type category for icons */
export function getFileCategory(
  mimeType: string,
): "image" | "video" | "audio" | "document" | "archive" | "other" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (
    mimeType.includes("pdf") ||
    mimeType.includes("word") ||
    mimeType.includes("excel") ||
    mimeType.includes("spreadsheet") ||
    mimeType.includes("presentation") ||
    mimeType.includes("text/")
  )
    return "document";
  if (
    mimeType.includes("zip") ||
    mimeType.includes("tar") ||
    mimeType.includes("gzip") ||
    mimeType.includes("rar") ||
    mimeType.includes("7z")
  )
    return "archive";
  return "other";
}

/** Sanitize a filename: strip path traversal and special chars */
export function sanitizeFileName(name: string): string {
  return name
    .replace(/[/\\?%*:|"<>]/g, "_")
    .replace(/\.\./g, "_")
    .trim()
    .slice(0, 255);
}

/** Simple file MIME type check against allowed categories */
export function isAllowedMimeType(_mimeType: string): boolean {
  // Allow everything – the file is encrypted so content is irrelevant security-wise
  return true;
}

/** Get max file size from env (default 10 GB) */
export const MAX_FILE_SIZE =
  parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE ?? "10737418240") ||
  10 * 1024 * 1024 * 1024;

/** Truncate a string with ellipsis */
export function truncate(str: string, max = 40): string {
  return str.length > max ? `${str.slice(0, max)}…` : str;
}

/** Copy text to clipboard, returns true on success */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Simple UUID v4 validator */
export function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    str,
  );
}

/** Validate access code format: 8 alphanumeric, optional dash in middle */
export function isValidAccessCode(code: string): boolean {
  return /^[A-Z0-9]{4}-?[A-Z0-9]{4}$/i.test(code.trim());
}

/** Build share URL */
export function buildShareUrl(fileId: string, appUrl?: string): string {
  const configured = appUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
  // In the browser, prefer the actual origin over a stale env value
  const base =
    typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : configured;
  return `${base}/file/${fileId}`;
}
