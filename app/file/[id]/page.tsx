"use client";

import { useEffect } from "react";
import { notFound } from "next/navigation";
import { Clock, Download, Shield, AlertTriangle, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AccessForm } from "@/components/file/AccessForm";
import { FilePreview } from "@/components/file/FilePreview";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { useFileAccess } from "@/hooks/useFileAccess";
import { formatBytes, formatTimeLeft, isValidUUID } from "@/lib/utils";

interface FilePageProps {
  params: { id: string };
}

export default function FilePage({ params }: FilePageProps) {
  const { id } = params;

  if (!isValidUUID(id)) notFound();

  const {
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
  } = useFileAccess(id);

  useEffect(() => {
    fetchFileInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /* ── Loading metadata ── */
  if (stage === "idle" && !fileInfo && !error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-sm text-text-secondary animate-pulse">
            Loading file info…
          </p>
        </div>
      </div>
    );
  }

  /* ── File not found / expired ── */
  if (error && !fileInfo) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="mx-auto max-w-sm text-center">
          <div className="mb-5 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-danger/20 bg-danger/8">
              <AlertTriangle className="h-9 w-9 text-danger" />
            </div>
          </div>
          <h1 className="mb-2 text-xl font-bold text-white">File Not Found</h1>
          <p className="text-sm text-text-secondary leading-relaxed">{error}</p>
          <p className="mt-2 text-xs text-muted">
            It may have expired, reached its download limit, or the link is
            incorrect.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100dvh-56px)] sm:min-h-[calc(100dvh-64px)]">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-56 w-56 rounded-full bg-accent/5 blur-[80px]" />

      <div className="relative mx-auto max-w-lg px-4 py-8 sm:py-12 sm:px-6">
        {/* Header */}
        <div className="mb-7">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 ring-1 ring-accent/30">
              <Lock className="h-4 w-4 text-accent" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              Access File
            </h1>
          </div>

          {fileInfo && (
            <div className="flex flex-wrap gap-2">
              <Badge variant="default" size="sm">
                {formatBytes(fileInfo.size)}
              </Badge>
              {fileInfo.expires_at && (
                <Badge variant="warning" size="sm">
                  <Clock className="h-3 w-3" />
                  Expires {formatTimeLeft(fileInfo.expires_at)}
                </Badge>
              )}
              {fileInfo.max_downloads && (
                <Badge variant="accent" size="sm">
                  <Download className="h-3 w-3" />
                  {Math.max(
                    0,
                    fileInfo.max_downloads - fileInfo.download_count,
                  )}{" "}
                  download
                  {fileInfo.max_downloads - fileInfo.download_count !== 1
                    ? "s"
                    : ""}{" "}
                  left
                </Badge>
              )}
              <Badge variant="success" size="sm">
                <Shield className="h-3 w-3" />
                E2EE
              </Badge>
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {/* Access form */}
          {(stage === "idle" || stage === "verifying") && fileInfo && (
            <motion.div
              key="access"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <AccessForm
                fileInfo={fileInfo}
                onSubmit={accessFile}
                loading={stage === "verifying" || loading}
                error={error}
                attemptsLeft={attemptsLeft}
              />
            </motion.div>
          )}

          {/* File preview / download */}
          {(stage === "downloading" ||
            stage === "decrypting" ||
            stage === "done" ||
            stage === "error") &&
            fileInfo && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <FilePreview
                  fileInfo={fileInfo}
                  stage={stage}
                  downloadProgress={downloadProgress}
                  decryptProgress={decryptProgress}
                  error={error}
                  previewUrl={previewUrl}
                  savedViaFSA={savedViaFSA}
                  onDownload={download}
                  onRetry={retryDownload}
                />
              </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
}
