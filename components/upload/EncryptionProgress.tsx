"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Progress } from "@/components/ui/Progress";
import { cn } from "@/lib/utils";
import type { EncryptionStage } from "@/types";

interface EncryptionProgressProps {
  stage: EncryptionStage;
  encryptProgress: number;
  uploadProgress: number;
  currentChunk: number;
  totalChunks: number;
  error: string | null;
}

const steps = [
  {
    id: "encrypting" as const,
    label: "Encrypting",
    sublabel: "AES-256-GCM Â· browser-only",
    icon: Lock,
  },
  {
    id: "uploading" as const,
    label: "Uploading",
    sublabel: "Ciphertext only",
    icon: UploadCloud,
  },
  {
    id: "done" as const,
    label: "Secured",
    sublabel: "Stored encrypted",
    icon: CheckCircle2,
  },
];

function getStepIndex(stage: EncryptionStage) {
  if (stage === "encrypting") return 0;
  if (stage === "uploading") return 1;
  if (stage === "done") return 2;
  return -1;
}

export function EncryptionProgress({
  stage,
  encryptProgress,
  uploadProgress,
  currentChunk,
  totalChunks,
  error,
}: EncryptionProgressProps) {
  if (stage === "idle") return null;

  const activeIdx = getStepIndex(stage);
  const isError = stage === "error";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        className={cn(
          "rounded-2xl border p-5 sm:p-6 flex flex-col gap-5",
          isError ? "border-danger/30 bg-danger/5" : "border-border bg-surface",
        )}
      >
        {/* Error state */}
        {isError ? (
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-danger/15">
              <AlertCircle className="h-5 w-5 text-danger" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Upload failed</p>
              {error && <p className="text-xs text-danger mt-0.5">{error}</p>}
            </div>
          </div>
        ) : (
          <>
            {/* Step indicators */}
            <div className="flex items-center gap-0">
              {steps.map((step, idx) => {
                const isDone = idx < activeIdx || stage === "done";
                const isActive = idx === activeIdx;
                const isPending = idx > activeIdx;
                const Icon = step.icon;

                return (
                  <div
                    key={step.id}
                    className="flex items-center flex-1 last:flex-none"
                  >
                    <div className="flex flex-col items-center gap-1.5">
                      {/* Circle */}
                      <div
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-300",
                          isDone
                            ? "border-success bg-success/15 text-success"
                            : isActive
                              ? "border-accent bg-accent/15 text-accent"
                              : "border-border-2 bg-surface-2 text-muted",
                        )}
                      >
                        {isActive && stage !== "done" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Icon className="h-4 w-4" />
                        )}
                      </div>
                      {/* Label */}
                      <span
                        className={cn(
                          "text-xs font-medium text-center hidden xs:block",
                          isDone
                            ? "text-success"
                            : isActive
                              ? "text-white"
                              : "text-muted",
                        )}
                      >
                        {step.label}
                      </span>
                    </div>
                    {/* Connector */}
                    {idx < steps.length - 1 && (
                      <div
                        className={cn(
                          "flex-1 h-0.5 mx-2 rounded-full transition-all duration-500",
                          idx < activeIdx ? "bg-success/60" : "bg-border-2",
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Active step detail */}
            <div className="flex flex-col gap-3">
              {(stage === "encrypting" ||
                stage === "uploading" ||
                stage === "done") && (
                <Progress
                  label="Encryption"
                  sublabel={`${encryptProgress}%`}
                  value={encryptProgress}
                  variant={encryptProgress === 100 ? "success" : "default"}
                  size="sm"
                />
              )}
              {(stage === "uploading" || stage === "done") && (
                <Progress
                  label="Upload"
                  sublabel={
                    totalChunks > 1
                      ? `${currentChunk} / ${totalChunks} chunks Â· ${uploadProgress}%`
                      : `${uploadProgress}%`
                  }
                  value={uploadProgress}
                  variant={uploadProgress === 100 ? "success" : "default"}
                  size="sm"
                />
              )}
              {stage === "done" && (
                <div className="flex items-center gap-2 text-xs text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Encryption complete Â· file securely stored</span>
                </div>
              )}
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
