// ─── File & Upload ───────────────────────────────────────────────────────────

export interface FileRecord {
  id: string;
  name: string;
  original_name: string;
  size: number;
  mime_type: string;
  salt: string; // base64 – PBKDF2 salt
  iv: string; // base64 – base AES-GCM IV
  chunk_count: number;
  download_count: number;
  max_downloads: number | null;
  expires_at: string | null; // ISO timestamp
  created_at: string;
  is_deleted: boolean;
  storage_path: string;
}

export interface FilePublicInfo {
  id: string;
  name: string;
  size: number;
  mime_type: string;
  download_count: number;
  max_downloads: number | null;
  expires_at: string | null;
  created_at: string;
}

// ─── Upload ──────────────────────────────────────────────────────────────────

export interface UploadSession {
  id: string;
  file_id: string;
  expected_chunks: number;
  received_chunks: number[];
  expires_at: string;
  completed: boolean;
}

export interface InitUploadRequest {
  fileName: string;
  fileSize: number;
  mimeType: string;
  chunkCount: number;
  expiresIn?: ExpiryOption; // hours, undefined = never
  maxDownloads?: number | null;
}

export interface InitUploadResponse {
  fileId: string;
  sessionId: string;
}

export interface CompleteUploadRequest {
  fileId: string;
  sessionId: string;
  accessCodeHash: string; // bcrypt hash from server
  salt: string; // base64
  iv: string; // base64
  fileName: string;
  fileSize: number;
  mimeType: string;
  chunkCount: number;
  expiresIn?: ExpiryOption;
  maxDownloads?: number | null;
}

export type ExpiryOption = "1h" | "24h" | "7d" | "30d" | "never";

// ─── Access / Download ────────────────────────────────────────────────────────

export interface AccessRequest {
  accessCode: string;
}

export interface AccessResponse {
  sessionToken: string; // short-lived JWT for chunk download
  salt: string;
  iv: string;
  chunkCount: number;
  fileName: string;
  mimeType: string;
  fileSize: number;
}

// ─── Encryption ───────────────────────────────────────────────────────────────

export interface EncryptionResult {
  salt: string; // base64
  iv: string; // base64
  chunkCount: number;
}

export type EncryptionStage =
  | "idle"
  | "encrypting"
  | "uploading"
  | "done"
  | "error";

export type DecryptionStage =
  | "idle"
  | "verifying"
  | "downloading"
  | "decrypting"
  | "done"
  | "error";

// ─── UI state ─────────────────────────────────────────────────────────────────

export interface UploadState {
  stage: EncryptionStage;
  encryptProgress: number; // 0-100
  uploadProgress: number; // 0-100
  currentChunk: number;
  totalChunks: number;
  error: string | null;
  result: UploadSuccessResult | null;
}

export interface UploadSuccessResult {
  fileId: string;
  accessCode: string;
  expiresAt: string | null;
  maxDownloads: number | null;
}

export interface FileAccessState {
  stage: DecryptionStage;
  downloadProgress: number;
  decryptProgress: number;
  error: string | null;
  attemptsLeft: number | null;
  fileInfo: FilePublicInfo | null;
}

// ─── Rate limiting ────────────────────────────────────────────────────────────

export interface AccessAttemptRow {
  id: string;
  file_id: string;
  ip_hash: string;
  attempted_at: string;
  success: boolean;
}
