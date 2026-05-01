"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/Progress";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import {
  Download,
  Lock,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  File,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatBytes, getFileCategory } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { DecryptionStage, FilePublicInfo } from "@/types";

interface FilePreviewProps {
  fileInfo: FilePublicInfo;
  stage: DecryptionStage;
  downloadProgress: number;
  decryptProgress: number;
  error: string | null;
  previewUrl: string | null;
  onDownload: () => void;
}

const categoryIconMap: Record<string, React.ElementType> = {
  image: ImageIcon,
  video: Video,
  audio: Music,
  document: FileText,
  archive: Archive,
  other: File,
};

const categoryColors: Record<string, string> = {
  image: "text-accent bg-accent/15",
  video: "text-purple-400 bg-purple-500/15",
  audio: "text-success bg-success/15",
  document: "text-warning bg-warning/15",
  archive: "text-orange-400 bg-orange-500/15",
  other: "text-muted bg-surface-2",
};

function stageLabel(stage: DecryptionStage): string {
  if (stage === "verifying") return "Verifying access code…";
  if (stage === "downloading") return "Downloading encrypted file…";
  if (stage === "decrypting") return "Decrypting in your browser…";
  return "";
}

export function FilePreview({
  fileInfo,
  stage,
  downloadProgress,
  decryptProgress,
  error,
  previewUrl,
  onDownload,
}: FilePreviewProps) {
  const category = getFileCategory(fileInfo.mime_type);
  const CategoryIcon = categoryIconMap[category] ?? File;
  const iconClass = categoryColors[category] ?? categoryColors.other;
  const isProcessing =
    stage === "downloading" || stage === "decrypting" || stage === "verifying";
  const isDone = stage === "done";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4"
    >
      {/* File info card */}
      <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
            iconClass,
          )}
        >
          <CategoryIcon className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white truncate text-sm sm:text-base">
            {fileInfo.name}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">
            {formatBytes(fileInfo.size)}
            {fileInfo.mime_type ? ` · ${fileInfo.mime_type}` : ""}
          </p>
        </div>
        {isDone ? (
          <Badge variant="success" size="sm">
            <ShieldCheck className="h-3 w-3" />
            Decrypted
          </Badge>
        ) : (
          <Badge variant="accent" size="sm">
            <Lock className="h-3 w-3" />
            Encrypted
          </Badge>
        )}
      </div>

      {/* Processing progress */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
              <div className="flex items-center gap-3">
                <Spinner size="sm" />
                <span className="text-sm font-medium text-white">
                  {stageLabel(stage)}
                </span>
              </div>
              {stage === "downloading" && downloadProgress > 0 && (
                <Progress
                  label="Downloading"
                  sublabel={`${downloadProgress}%`}
                  value={downloadProgress}
                  size="sm"
                />
              )}
              {stage === "decrypting" && (
                <Progress
                  label="Decrypting"
                  sublabel={`${decryptProgress}%`}
                  value={decryptProgress}
                  variant="success"
                  size="sm"
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error state */}
      <AnimatePresence>
        {stage === "error" && error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/6 p-4"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
            <p className="text-sm text-danger">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Media preview */}
      <AnimatePresence>
        {isDone && previewUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl overflow-hidden border border-border bg-surface"
          >
            {category === "image" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt={fileInfo.name}
                className="max-h-[50vh] w-full object-contain"
              />
            )}
            {category === "video" && (
              <video
                src={previewUrl}
                controls
                className="max-h-[50vh] w-full bg-black"
                preload="metadata"
              />
            )}
            {category === "audio" && (
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/15">
                    <Music className="h-6 w-6 text-success" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {fileInfo.name}
                    </p>
                    <p className="text-xs text-text-secondary">Audio file</p>
                  </div>
                </div>
                <audio src={previewUrl} controls className="w-full" />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Download button */}
      <AnimatePresence>
        {isDone && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button
              variant="primary"
              size="lg"
              onClick={onDownload}
              className="w-full h-14 text-base font-semibold gap-2 shadow-glow-sm hover:shadow-glow"
            >
              <Download className="h-4 w-4 shrink-0" />
              Download {fileInfo.name} ({formatBytes(fileInfo.size)})
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
