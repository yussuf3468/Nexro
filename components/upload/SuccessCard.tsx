"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Shield,
  Clock,
  Download,
  QrCode,
  PartyPopper,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import { formatCode } from "@/lib/crypto";
import { buildShareUrl, formatTimeLeft, formatBytes } from "@/lib/utils";
import type { UploadSuccessResult } from "@/types";

interface SuccessCardProps {
  result: UploadSuccessResult;
  fileName: string;
  fileSize: number;
}

function CopyButton({
  text,
  label,
  size = "icon",
}: {
  text: string;
  label: string;
  size?: "icon" | "sm";
}) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  if (size === "sm") {
    return (
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-white hover:bg-surface-2 transition-colors touch-target"
        aria-label={`Copy ${label}`}
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-success" />
            <span className="text-success">Copied!</span>
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" />
            <span>Copy</span>
          </>
        )}
      </button>
    );
  }
  return (
    <button
      onClick={handleCopy}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:text-white hover:bg-surface-2 transition-colors touch-target"
      aria-label={`Copy ${label}`}
    >
      {copied ? (
        <Check className="h-4 w-4 text-success" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </button>
  );
}

export function SuccessCard({ result, fileName, fileSize }: SuccessCardProps) {
  const [showQR, setShowQR] = useState(false);
  const shareUrl = buildShareUrl(result.fileId);
  const formattedCode = formatCode(result.accessCode);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex flex-col gap-4"
    >
      {/* Success header */}
      <div className="flex items-center gap-3 rounded-2xl border border-success/25 bg-success/8 p-4 sm:p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-success/15">
          <CheckCircle2 className="h-6 w-6 text-success" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-bold text-white text-sm sm:text-base">
              Uploaded &amp; encrypted!
            </p>
            <PartyPopper className="h-4 w-4 text-warning shrink-0" />
          </div>
          <p className="text-xs text-text-secondary truncate mt-0.5">
            {fileName
              ? `${fileName} Â· ${formatBytes(fileSize)}`
              : formatBytes(fileSize)}
          </p>
        </div>
      </div>

      {/* â”€â”€â”€ Access Code â”€â”€â”€ */}
      <div className="rounded-2xl border border-accent/30 bg-surface overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 pt-4 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-accent shrink-0" />
            <span className="text-sm font-semibold text-white">
              Access Code
            </span>
          </div>
          <Badge variant="warning" size="sm" dot>
            Save this â€” shown once
          </Badge>
        </div>
        {/* Code display */}
        <div className="px-4 sm:px-5 py-4">
          <div className="flex items-center justify-between rounded-xl border border-accent/25 bg-accent/8 px-4 py-3.5">
            <code className="font-mono text-2xl sm:text-3xl font-bold tracking-[0.2em] text-accent select-all">
              {formattedCode}
            </code>
            <CopyButton text={formattedCode} label="access code" />
          </div>
          <p className="mt-2.5 text-xs text-text-secondary leading-relaxed">
            Share this code separately from the link. Without it, the file
            cannot be decrypted â€” not even by us.
          </p>
        </div>
      </div>

      {/* â”€â”€â”€ Share Link â”€â”€â”€ */}
      <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 flex flex-col gap-3">
        <p className="text-sm font-semibold text-white">Share Link</p>
        <div className="flex items-center gap-2 rounded-xl border border-border-2 bg-surface-2 pl-3.5 pr-2 py-2.5">
          <span className="flex-1 truncate text-xs sm:text-sm text-text-secondary font-mono">
            {shareUrl}
          </span>
          <div className="flex items-center gap-0.5 shrink-0">
            <CopyButton text={shareUrl} label="share link" />
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:text-white hover:bg-surface transition-colors touch-target"
              aria-label="Open file page"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      {/* â”€â”€â”€ Metadata badges â”€â”€â”€ */}
      <div className="flex flex-wrap gap-2">
        {result.expiresAt ? (
          <Badge variant="warning" size="sm">
            <Clock className="h-3 w-3" />
            Expires {formatTimeLeft(result.expiresAt)}
          </Badge>
        ) : (
          <Badge variant="default" size="sm">
            <Clock className="h-3 w-3" />
            No expiry
          </Badge>
        )}
        {result.maxDownloads && (
          <Badge variant="accent" size="sm">
            <Download className="h-3 w-3" />
            {result.maxDownloads} download{result.maxDownloads !== 1 ? "s" : ""}
          </Badge>
        )}
        <Badge variant="success" size="sm">
          <Shield className="h-3 w-3" />
          E2EE Â· AES-256-GCM
        </Badge>
      </div>

      {/* â”€â”€â”€ QR Code toggle â”€â”€â”€ */}
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setShowQR((v) => !v)}
        className="w-fit gap-2"
      >
        <QrCode className="h-4 w-4" />
        {showQR ? "Hide QR Code" : "Show QR Code"}
      </Button>

      <AnimatePresence>
        {showQR && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <QRCodeDisplay url={shareUrl} accessCode={formattedCode} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* â”€â”€â”€ Actions â”€â”€â”€ */}
      <div className="flex flex-col xs:flex-row gap-3">
        <Button
          variant="primary"
          size="lg"
          className="flex-1 gap-2 h-12"
          onClick={() => (window.location.href = "/upload")}
        >
          <RefreshCw className="h-4 w-4" />
          Upload Another
        </Button>
        <a
          href={shareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1"
        >
          <Button variant="secondary" size="lg" className="w-full gap-2 h-12">
            <ExternalLink className="h-4 w-4" />
            Open File Page
          </Button>
        </a>
      </div>
    </motion.div>
  );
}
