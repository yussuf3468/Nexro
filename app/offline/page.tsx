"use client";

import Link from "next/link";
import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function OfflinePage() {
  return (
    <div className="relative flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-72 w-72 rounded-full bg-muted/5 blur-[100px]" />

      <div className="relative flex flex-col items-center gap-5">
        {/* Icon */}
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-border-2 bg-surface-2 shadow-lg animate-float">
          <WifiOff className="h-9 w-9 text-muted" />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            You are offline
          </h1>
          <p className="max-w-xs text-sm text-text-secondary leading-relaxed">
            Nexro requires an internet connection to encrypt and share files.
            Please check your connection and try again.
          </p>
        </div>

        <div className="flex flex-col xs:flex-row gap-3">
          <Button
            variant="secondary"
            size="lg"
            className="gap-2 h-12"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          <Link href="/">
            <Button variant="primary" size="lg" className="h-12">
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
