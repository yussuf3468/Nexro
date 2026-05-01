"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Settings2, ChevronDown, Lock } from "lucide-react";
import { FileDropzone } from "@/components/upload/FileDropzone";
import { EncryptionProgress } from "@/components/upload/EncryptionProgress";
import { SuccessCard } from "@/components/upload/SuccessCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardBody } from "@/components/ui/Card";
import { useUpload } from "@/hooks/useUpload";
import { EXPIRY_OPTIONS } from "@/lib/utils";
import type { ExpiryOption } from "@/types";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [customCode, setCustomCode] = useState("");
  const [expiresIn, setExpiresIn] = useState<ExpiryOption>("24h");
  const [maxDownloads, setMaxDownloads] = useState<string>("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { state, start } = useUpload();

  const handleUpload = async () => {
    if (!file) return;
    await start({
      file,
      customAccessCode:
        customCode.replace(/-/g, "").toUpperCase().trim() || undefined,
      expiresIn,
      maxDownloads: maxDownloads ? parseInt(maxDownloads, 10) : undefined,
    });
  };

  const isIdle = state.stage === "idle" || state.stage === "error";
  const isDone = state.stage === "done";
  const isWorking = state.stage === "encrypting" || state.stage === "uploading";

  return (
    <div className="relative min-h-[calc(100dvh-56px)] sm:min-h-[calc(100dvh-64px)]">
      {/* Subtle background */}
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-accent/6 blur-[80px]" />

      <div className="relative mx-auto max-w-lg px-4 py-8 sm:py-12 sm:px-6">
        {/* Page header */}
        <div className="mb-7">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 ring-1 ring-accent/30">
              <Lock className="h-4 w-4 text-accent" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              Secure Upload
            </h1>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">
            Your file is encrypted{" "}
            <span className="text-white font-medium">in this browser</span>{" "}
            before upload — the server only ever receives ciphertext.
          </p>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {isDone && state.result ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <SuccessCard
                result={state.result}
                fileName={file?.name ?? ""}
                fileSize={file?.size ?? 0}
              />
            </motion.div>
          ) : (
            <motion.div
              key="form"
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-col gap-4"
            >
              {/* Dropzone */}
              <FileDropzone
                file={file}
                onFile={setFile}
                onClear={() => setFile(null)}
                disabled={isWorking}
              />

              {/* Advanced options */}
              {file && isIdle && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-3"
                >
                  <button
                    onClick={() => setShowAdvanced((v) => !v)}
                    className="flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm text-text-secondary hover:text-white hover:border-border-2 hover:bg-surface-2/60 transition-all touch-target w-full text-left"
                  >
                    <Settings2 className="h-4 w-4 shrink-0 text-muted" />
                    <span className="flex-1">Advanced options</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 transition-transform duration-200 ${showAdvanced ? "rotate-180" : ""}`}
                    />
                  </button>

                  <AnimatePresence>
                    {showAdvanced && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <Card>
                          <CardBody className="flex flex-col gap-5">
                            {/* Custom access code */}
                            <Input
                              label="Custom Access Code (optional)"
                              placeholder="Leave blank to auto-generate"
                              value={customCode}
                              onChange={(e) =>
                                setCustomCode(
                                  e.target.value
                                    .toUpperCase()
                                    .replace(/[^A-Z0-9-]/g, ""),
                                )
                              }
                              maxLength={9}
                              hint="8 alphanumeric characters. Blank = auto-generate a secure code."
                              className="font-mono tracking-widest"
                            />

                            {/* Expiry selector */}
                            <div className="flex flex-col gap-2">
                              <label className="text-sm font-medium text-text-secondary">
                                Expires After
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {EXPIRY_OPTIONS.map((opt) => (
                                  <button
                                    key={opt.value}
                                    onClick={() => setExpiresIn(opt.value)}
                                    className={`rounded-lg border px-3 py-1.5 text-xs sm:text-sm font-medium transition-all touch-target ${
                                      expiresIn === opt.value
                                        ? "border-accent/60 bg-accent/15 text-accent shadow-glow-sm"
                                        : "border-border-2 bg-surface-2 text-text-secondary hover:border-accent/30 hover:text-white"
                                    }`}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Max downloads */}
                            <Input
                              label="Max Downloads (optional)"
                              type="number"
                              min={1}
                              max={10000}
                              placeholder="Unlimited"
                              value={maxDownloads}
                              onChange={(e) => setMaxDownloads(e.target.value)}
                              hint="File auto-deletes after this many successful downloads."
                            />
                          </CardBody>
                        </Card>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* Progress indicator */}
              <EncryptionProgress
                stage={state.stage}
                encryptProgress={state.encryptProgress}
                uploadProgress={state.uploadProgress}
                currentChunk={state.currentChunk}
                totalChunks={state.totalChunks}
                error={state.error}
              />

              {/* Upload CTA */}
              {isIdle && (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleUpload}
                  disabled={!file}
                  className="w-full h-14 text-base font-semibold gap-2 shadow-glow-sm hover:shadow-glow"
                >
                  <Shield className="h-4 w-4 shrink-0" />
                  Encrypt &amp; Upload
                </Button>
              )}

              {/* Security footnote */}
              <p className="flex items-start gap-2 text-xs text-muted">
                <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                AES-256-GCM · PBKDF2 200k iterations · Key never leaves browser
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
