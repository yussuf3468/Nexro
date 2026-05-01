"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud,
  File,
  X,
  FileImage,
  FileVideo,
  FileAudio,
  FileText,
  Archive,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  cn,
  formatBytes,
  getFileCategory,
  MAX_FILE_SIZE,
  truncate,
} from "@/lib/utils";

interface FileDropzoneProps {
  file: File | null;
  onFile: (file: File) => void;
  onClear: () => void;
  disabled?: boolean;
}

const categoryConfig: Record<
  string,
  { icon: React.ElementType; color: string; bg: string }
> = {
  image: { icon: FileImage, color: "text-accent", bg: "bg-accent/15" },
  video: { icon: FileVideo, color: "text-purple-400", bg: "bg-purple-500/15" },
  audio: { icon: FileAudio, color: "text-success", bg: "bg-success/15" },
  document: { icon: FileText, color: "text-warning", bg: "bg-warning/15" },
  archive: { icon: Archive, color: "text-orange-400", bg: "bg-orange-500/15" },
  other: { icon: File, color: "text-text-secondary", bg: "bg-surface-2" },
};

export function FileDropzone({
  file,
  onFile,
  onClear,
  disabled,
}: FileDropzoneProps) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted[0]) onFile(accepted[0]);
    },
    [onFile],
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({ onDrop, maxFiles: 1, maxSize: MAX_FILE_SIZE, disabled });

  /* â”€â”€ File selected state â”€â”€ */
  if (file) {
    const category = getFileCategory(file.type);
    const {
      icon: Icon,
      color,
      bg,
    } = categoryConfig[category] ?? categoryConfig.other;

    return (
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="flex items-center gap-4 rounded-2xl border border-accent/35 bg-accent/6 p-4 sm:p-5"
      >
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
            bg,
          )}
        >
          <Icon className={cn("h-6 w-6", color)} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate leading-tight">
            {truncate(file.name, 46)}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">
            {formatBytes(file.size)}
            {file.type ? ` Â· ${file.type}` : ""}
          </p>
        </div>

        {!disabled && (
          <button
            onClick={onClear}
            className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:text-white hover:bg-surface-2 transition-colors touch-target"
            aria-label="Remove file"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </motion.div>
    );
  }

  /* â”€â”€ Dropzone idle/drag state â”€â”€ */
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="dropzone"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(disabled && "pointer-events-none opacity-50")}
      >
        <div
          {...getRootProps()}
          className={cn(
            "relative flex min-h-[196px] sm:min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-200 select-none outline-none",
            isDragActive && !isDragReject
              ? "border-accent bg-accent/8 shadow-glow scale-[1.01]"
              : "border-border-2 hover:border-accent/50 hover:bg-surface-2/50 bg-surface/30",
            isDragReject && "border-danger/60 bg-danger/6",
          )}
        >
          <input {...getInputProps()} />

          <div className="flex flex-col items-center gap-4 px-6 text-center">
            {/* Icon */}
            <div
              className={cn(
                "flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300",
                isDragActive && !isDragReject
                  ? "bg-accent/25 text-accent scale-110"
                  : isDragReject
                    ? "bg-danger/15 text-danger"
                    : "bg-surface-2 text-muted",
              )}
            >
              <UploadCloud
                className={cn(
                  "h-8 w-8 transition-transform duration-300",
                  isDragActive && !isDragReject && "-translate-y-1",
                )}
              />
            </div>

            {isDragReject ? (
              <div>
                <p className="text-sm font-semibold text-danger">
                  File too large or unsupported
                </p>
                <p className="text-xs text-text-secondary mt-1">
                  Maximum size: {formatBytes(MAX_FILE_SIZE)}
                </p>
              </div>
            ) : isDragActive ? (
              <p className="text-base font-semibold text-accent animate-pulse">
                Drop it here!
              </p>
            ) : (
              <>
                <div>
                  <p className="text-sm sm:text-base font-semibold text-white">
                    Drag & drop your file here
                  </p>
                  <p className="mt-1 text-xs sm:text-sm text-text-secondary">
                    or{" "}
                    <span className="text-accent underline underline-offset-2 decoration-accent/50">
                      tap to browse
                    </span>
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {["Images", "Videos", "Documents", "Archives"].map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-border-2 bg-surface px-2.5 py-0.5 text-xs text-text-secondary"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-muted">
                  Up to {formatBytes(MAX_FILE_SIZE)} Â· Encrypted before upload
                </p>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
