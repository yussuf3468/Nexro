"use client";

import { useState, useCallback, useRef } from "react";
import { decryptFileStream } from "@/lib/crypto";
import type { DecryptionStage, FilePublicInfo, AccessResponse } from "@/types";

/**
 * useFileAccess — manages the full access-code-verify → download → decrypt flow.
 *
 * Supports:
 *  - Large files via streaming decryption (File System Access API when available)
 *  - Fallback for browsers without FSA: collect chunks in memory then trigger download
 *  - In-memory preview for images / audio / video (< 200 MB)
 */
export function useFileAccess(fileId: string) {
  const [stage, setStage] = useState<DecryptionStage>("idle");
  const [fileInfo, setFileInfo] = useState<FilePublicInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [decryptProgress, setDecryptProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [savedViaFSA, setSavedViaFSA] = useState(false);

  // Separate refs: session data from API + raw access code from user
  const sessionRef = useRef<AccessResponse | null>(null);
  const codeRef = useRef<string>("");
  // Blob URL for download trigger
  const downloadBlobRef = useRef<string | null>(null);

  // ── Fetch public file metadata ──────────────────────────────────────────────
  const fetchFileInfo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/files/${fileId}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "File not found or has expired.");
        return;
      }
      const data: FilePublicInfo = await res.json();
      setFileInfo(data);
    } catch {
      setError("Failed to fetch file info. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, [fileId]);

  // ── Verify access code ──────────────────────────────────────────────────────
  const accessFile = useCallback(
    async (accessCode: string) => {
      setStage("verifying");
      setError(null);

      // Store the normalised code for decryption
      codeRef.current = accessCode.replace(/-/g, "").toUpperCase().trim();

      try {
        const res = await fetch(`/api/files/${fileId}/access`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessCode }),
        });

        const data = await res.json();

        if (!res.ok) {
          setAttemptsLeft(data.attemptsLeft ?? null);
          setError(data.error ?? "Incorrect access code.");
          setStage("idle");
          return;
        }

        // Save session for download
        sessionRef.current = data as AccessResponse;
        setAttemptsLeft(null);

        // Begin download + decryption automatically
        await _downloadAndDecrypt(data as AccessResponse);
      } catch {
        setError("Network error. Please try again.");
        setStage("idle");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fileId],
  );

  // ── Internal: download + decrypt ────────────────────────────────────────────
  const _downloadAndDecrypt = useCallback(
    async (session: AccessResponse) => {
      const {
        sessionToken,
        salt,
        iv,
        chunkCount,
        fileName,
        mimeType,
        fileSize,
      } = session;
      const accessCode = codeRef.current;

      const PREVIEW_THRESHOLD = 200 * 1024 * 1024; // 200 MB
      const canPreview =
        fileSize < PREVIEW_THRESHOLD &&
        (mimeType.startsWith("image/") ||
          mimeType.startsWith("video/") ||
          mimeType.startsWith("audio/"));

      // Fetch a single encrypted chunk from the API (signed redirect)
      const fetchChunk = async (index: number): Promise<ArrayBuffer> => {
        const url = `/api/files/${fileId}/chunk/${index}?token=${encodeURIComponent(sessionToken)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to download chunk ${index}.`);
        return res.arrayBuffer();
      };

      setStage("downloading");
      setDownloadProgress(0);
      setDecryptProgress(0);

      try {
        // ── Try File System Access API for large files ────────────────────────
        if (
          typeof window !== "undefined" &&
          "showSaveFilePicker" in window &&
          fileSize > PREVIEW_THRESHOLD
        ) {
          await _streamToFilePicker(
            accessCode,
            session,
            fetchChunk,
            fileName,
            mimeType,
            chunkCount,
          );
          return;
        }

        // ── Collect all decrypted chunks in memory ───────────────────────────
        const plainChunks: Uint8Array[] = [];
        let downloadedChunks = 0;

        const gen = decryptFileStream({
          accessCode,
          salt,
          iv,
          chunkCount,
          fetchChunk: async (i) => {
            const data = await fetchChunk(i);
            downloadedChunks = i + 1;
            setDownloadProgress(
              Math.round((downloadedChunks / chunkCount) * 100),
            );
            return data;
          },
          onProgress: (pct) => {
            setStage("decrypting");
            setDecryptProgress(pct);
          },
        });

        for await (const chunk of gen) {
          plainChunks.push(chunk);
        }

        // Build blob directly from chunks — avoids assembling a second full-size Uint8Array
        const blob = new Blob(plainChunks as BlobPart[], { type: mimeType });
        const blobUrl = URL.createObjectURL(blob);
        downloadBlobRef.current = blobUrl;

        if (canPreview) setPreviewUrl(blobUrl);

        setStage("done");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Decryption failed.";
        setError(msg);
        setStage("error");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fileId],
  );

  // ── Stream decrypted data directly to File System Access API ─────────────
  const _streamToFilePicker = async (
    accessCode: string,
    session: AccessResponse,
    fetchChunk: (i: number) => Promise<ArrayBuffer>,
    fileName: string,
    mimeType: string,
    chunkCount: number,
  ) => {
    try {
      const handle = await (
        window as unknown as {
          showSaveFilePicker: (opts: unknown) => Promise<FileSystemFileHandle>;
        }
      ).showSaveFilePicker({
        suggestedName: fileName,
        types: [{ description: "File", accept: { [mimeType]: [] } }],
      });
      const writable = await handle.createWritable();

      let downloadedChunks = 0;

      const gen = decryptFileStream({
        accessCode,
        salt: session.salt,
        iv: session.iv,
        chunkCount,
        fetchChunk: async (i) => {
          const data = await fetchChunk(i);
          downloadedChunks = i + 1;
          setDownloadProgress(
            Math.round((downloadedChunks / chunkCount) * 100),
          );
          return data;
        },
        onProgress: (pct) => {
          setStage("decrypting");
          setDecryptProgress(pct);
        },
      });

      for await (const chunk of gen) {
        await writable.write(chunk as FileSystemWriteChunkType);
      }

      await writable.close();
      setSavedViaFSA(true);
      setStage("done");
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        // Don't silently reset to idle — that causes the access form to reappear
        // without explanation, making users think they need to re-enter the code.
        setError(
          "Save dialog was cancelled. Click \"Try Again\" to pick a save location.",
        );
        setStage("error");
        return;
      }
      throw err;
    }
  };

  // ── Retry download (e.g. after FSA was cancelled) — call from a user gesture ─
  const retryDownload = useCallback(async () => {
    if (!sessionRef.current) return;
    setError(null);
    setSavedViaFSA(false);
    await _downloadAndDecrypt(sessionRef.current);
  }, [_downloadAndDecrypt]);

  // ── Trigger file download (called from UI button) ─────────────────────────
  const download = useCallback(() => {
    if (!downloadBlobRef.current || !sessionRef.current) return;
    const a = document.createElement("a");
    a.href = downloadBlobRef.current;
    a.download = sessionRef.current.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  return {
    stage,
    fileInfo,
    error,
    attemptsLeft,
    downloadProgress,
    decryptProgress,
    previewUrl,
    savedViaFSA,
    loading,
    fetchFileInfo,
    accessFile,
    retryDownload,
    download,
  };
}
