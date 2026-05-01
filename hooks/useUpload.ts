"use client";

import { useState, useCallback } from "react";
import {
  encryptFileStream,
  generateAccessCode,
  normalizeCode,
} from "@/lib/crypto";
import type {
  EncryptionStage,
  ExpiryOption,
  UploadState,
  UploadSuccessResult,
} from "@/types";

interface StartOptions {
  file: File;
  customAccessCode?: string;
  expiresIn?: ExpiryOption;
  maxDownloads?: number;
}

const INITIAL_STATE: UploadState = {
  stage: "idle",
  encryptProgress: 0,
  uploadProgress: 0,
  currentChunk: 0,
  totalChunks: 0,
  error: null,
  result: null,
};

/**
 * useUpload — manages the full encrypt→upload→complete flow.
 *
 * Flow:
 *  1. POST /api/upload/init            → { fileId, sessionId }
 *  2. POST /api/upload/hash-code       → { hash }  (bcrypt hash of access code)
 *  3. Encrypt file stream (generator)  → yields encrypted chunks
 *  4. POST /api/upload/chunk/…/…       → uploads each chunk
 *  5. POST /api/upload/complete        → saves file record
 */
export function useUpload() {
  const [state, setState] = useState<UploadState>(INITIAL_STATE);

  const setPartial = (patch: Partial<UploadState>) =>
    setState((s) => ({ ...s, ...patch }));

  const start = useCallback(async (opts: StartOptions) => {
    const { file, customAccessCode, expiresIn = "24h", maxDownloads } = opts;

    // Normalise / generate access code
    const rawCode = customAccessCode
      ? normalizeCode(customAccessCode)
      : generateAccessCode();

    setState({
      ...INITIAL_STATE,
      stage: "encrypting",
      totalChunks: Math.max(1, Math.ceil(file.size / (10 * 1024 * 1024))),
    });

    try {
      // ── 1. Init upload session ──────────────────────────────────────────────
      const initRes = await fetch("/api/upload/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type || "application/octet-stream",
          chunkCount: Math.max(1, Math.ceil(file.size / (10 * 1024 * 1024))),
        }),
      });

      if (!initRes.ok) {
        const err = await initRes
          .json()
          .catch(() => ({ error: "Upload init failed." }));
        throw new Error(err.error ?? "Upload init failed.");
      }

      const { fileId, sessionId } = await initRes.json();

      // ── 2. Hash access code server-side ────────────────────────────────────
      const hashRes = await fetch("/api/upload/hash-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessCode: rawCode }),
      });

      if (!hashRes.ok) {
        throw new Error("Failed to hash access code.");
      }
      const { hash: accessCodeHash } = await hashRes.json();

      // ── 3 + 4. Encrypt stream & upload chunks ───────────────────────────────
      let salt = "";
      let iv = "";
      let totalChunks = 0;
      let uploadedChunks = 0;

      const stream = encryptFileStream(
        file,
        rawCode,
        // Crypto params callback — called before first chunk
        (params) => {
          salt = params.salt;
          iv = params.iv;
          totalChunks = params.chunkCount;
          setPartial({ stage: "uploading", totalChunks: params.chunkCount });
        },
        // Progress callback
        (pct) => {
          setPartial({ encryptProgress: pct });
        },
      );

      for await (const { index, data } of stream) {
        // Upload this encrypted chunk
        const upRes = await fetch(`/api/upload/chunk/${sessionId}/${index}`, {
          method: "POST",
          headers: { "Content-Type": "application/octet-stream" },
          body: data,
        });

        if (!upRes.ok) {
          // Retry once
          const retry = await fetch(`/api/upload/chunk/${sessionId}/${index}`, {
            method: "POST",
            headers: { "Content-Type": "application/octet-stream" },
            body: data,
          });
          if (!retry.ok) {
            throw new Error(`Failed to upload chunk ${index}.`);
          }
        }

        uploadedChunks++;
        setPartial({
          currentChunk: uploadedChunks,
          uploadProgress: Math.round((uploadedChunks / totalChunks) * 100),
        });
      }

      // ── 5. Complete upload ─────────────────────────────────────────────────
      const completeRes = await fetch("/api/upload/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId,
          sessionId,
          accessCodeHash,
          salt,
          iv,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type || "application/octet-stream",
          chunkCount: totalChunks,
          expiresIn,
          maxDownloads: maxDownloads ?? null,
        }),
      });

      if (!completeRes.ok) {
        const err = await completeRes
          .json()
          .catch(() => ({ error: "Upload completion failed." }));

        // Check if some chunks are missing and need re-uploading
        if (err.missingChunks) {
          throw new Error(
            `Upload incomplete. Missing chunks: ${(err.missingChunks as number[]).slice(0, 5).join(", ")}.`,
          );
        }
        throw new Error(err.error ?? "Upload completion failed.");
      }

      const { fileId: confirmedId } = await completeRes.json();

      // Determine expiry timestamp
      const expiryMs: Record<ExpiryOption, number | null> = {
        "1h": 60 * 60 * 1000,
        "24h": 24 * 60 * 60 * 1000,
        "7d": 7 * 24 * 60 * 60 * 1000,
        "30d": 30 * 24 * 60 * 60 * 1000,
        never: null,
      };
      const expiryMs_ = expiryMs[expiresIn];
      const expiresAt = expiryMs_
        ? new Date(Date.now() + expiryMs_).toISOString()
        : null;

      const result: UploadSuccessResult = {
        fileId: confirmedId,
        accessCode: rawCode,
        expiresAt,
        maxDownloads: maxDownloads ?? null,
      };

      setState({
        stage: "done",
        encryptProgress: 100,
        uploadProgress: 100,
        currentChunk: totalChunks,
        totalChunks,
        error: null,
        result,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setPartial({ stage: "error", error: message });
    }
  }, []);

  const reset = useCallback(() => setState(INITIAL_STATE), []);

  return { state, start, reset };
}
