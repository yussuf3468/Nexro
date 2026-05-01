import Link from "next/link";
import { Shield, Lock } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative mt-auto border-t border-border/50">
      {/* Gradient shimmer */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 ring-1 ring-accent/25">
              <Shield className="h-3.5 w-3.5 text-accent" />
            </div>
            <span className="text-sm font-bold text-white tracking-tight">
              Nexro
            </span>
          </div>

          {/* Nav */}
          <nav className="flex items-center gap-5">
            <Link
              href="/upload"
              className="text-xs text-text-secondary hover:text-white transition-colors"
            >
              Upload
            </Link>
          </nav>
        </div>

        {/* Bottom */}
        <div className="mt-5 flex flex-col items-center gap-1.5 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <Lock className="h-3 w-3 shrink-0" />
            <span>
              AES-256-GCM · Keys never leave your browser · Zero-knowledge
            </span>
          </div>
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} Nexro
          </p>
        </div>
      </div>
    </footer>
  );
}
