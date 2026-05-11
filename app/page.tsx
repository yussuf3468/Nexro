import Link from "next/link";
import {
  Shield,
  Lock,
  Zap,
  Eye,
  Upload,
  Key,
  Check,
  FileText,
  Globe,
  ShieldCheck,
  Cpu,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

// ── Data ──────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: Lock,
    label: "Encryption",
    title: "AES-256-GCM, client-side",
    desc: "Encryption runs entirely in your browser via the Web Crypto API. The server only ever receives ciphertext — never your file or access code.",
    gradient: "from-accent/10 to-transparent",
    iconBg: "bg-accent/15 ring-1 ring-accent/30",
    iconColor: "text-accent",
    stat: "AES-256",
    statSub: "GCM mode",
    borderHover: "hover:border-accent/40",
    shadow: "hover:shadow-[0_8px_48px_-8px_rgba(124,110,255,0.25)]",
  },
  {
    icon: Eye,
    label: "Privacy",
    title: "Zero knowledge by design",
    desc: "Only the recipient with the correct code can derive the decryption key. We mathematically cannot read your files, period.",
    gradient: "from-success/10 to-transparent",
    iconBg: "bg-success/15 ring-1 ring-success/30",
    iconColor: "text-success",
    stat: "0 bytes",
    statSub: "plaintext stored",
    borderHover: "hover:border-success/40",
    shadow: "hover:shadow-[0_8px_48px_-8px_rgba(0,210,106,0.18)]",
  },
  {
    icon: Key,
    label: "Access Control",
    title: "Brute-force resistant codes",
    desc: "Codes are bcrypt-hashed at cost 12. Five failed attempts trigger a 15-minute lockout — no rainbow tables, no dictionary attacks.",
    gradient: "from-warning/10 to-transparent",
    iconBg: "bg-warning/15 ring-1 ring-warning/30",
    iconColor: "text-warning",
    stat: "bcrypt",
    statSub: "cost factor 12",
    borderHover: "hover:border-warning/40",
    shadow: "hover:shadow-[0_8px_48px_-8px_rgba(255,184,0,0.18)]",
  },
  {
    icon: Zap,
    label: "Scale",
    title: "Unlimited file size streaming",
    desc: "10 MB chunked streaming lets you encrypt and share multi-GB videos and archives without running out of RAM.",
    gradient: "from-purple-500/10 to-transparent",
    iconBg: "bg-purple-500/15 ring-1 ring-purple-500/30",
    iconColor: "text-purple-400",
    stat: "10 GB+",
    statSub: "any file size",
    borderHover: "hover:border-purple-500/40",
    shadow: "hover:shadow-[0_8px_48px_-8px_rgba(168,85,247,0.18)]",
  },
];

const steps = [
  {
    n: "01",
    icon: Upload,
    title: "Drop your file",
    desc: "Any type, any size. Drag & drop or tap — images, videos, documents, archives.",
    color: "text-accent",
    iconBg: "bg-accent/10 ring-1 ring-accent/25",
    dot: "bg-accent shadow-[0_0_12px_rgba(124,110,255,0.9)]",
  },
  {
    n: "02",
    icon: Cpu,
    title: "Browser-side encryption",
    desc: "AES-256-GCM runs in your browser before upload. Your key never leaves your device.",
    color: "text-purple-400",
    iconBg: "bg-purple-500/10 ring-1 ring-purple-500/25",
    dot: "bg-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.9)]",
  },
  {
    n: "03",
    icon: Globe,
    title: "Share link + code",
    desc: "Copy the share URL and your unique access code. Send them through separate channels for layered security.",
    color: "text-warning",
    iconBg: "bg-warning/10 ring-1 ring-warning/25",
    dot: "bg-warning shadow-[0_0_12px_rgba(255,184,0,0.9)]",
  },
  {
    n: "04",
    icon: ShieldCheck,
    title: "Recipient decrypts",
    desc: "They enter the code. Decryption runs in their browser — the server never sees plaintext.",
    color: "text-success",
    iconBg: "bg-success/10 ring-1 ring-success/25",
    dot: "bg-success shadow-[0_0_12px_rgba(0,210,106,0.9)]",
  },
];

const cryptoParams = [
  { k: "Algorithm", v: "AES-256-GCM" },
  { k: "PBKDF2", v: "200k rounds" },
  { k: "Chunk size", v: "10 MB" },
  { k: "Salt", v: "16 B random" },
];

const trustBadges = [
  "No account required",
  "No plaintext stored",
  "Files auto-expire",
  "Rate-limited access",
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="flex flex-col overflow-x-hidden">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative flex items-center overflow-hidden py-14 sm:py-20 lg:min-h-[calc(100dvh-64px)] lg:py-8">
        {/* Layered background */}
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgba(124,110,255,0.13),transparent)]" />

        {/* Glow orbs */}
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-accent/8 blur-[140px] animate-glow-pulse" />
        <div className="pointer-events-none absolute top-1/4 -right-32 h-[420px] w-[420px] rounded-full bg-purple-600/10 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 -left-32 h-[320px] w-[320px] rounded-full bg-success/5 blur-[100px]" />

        <div className="relative w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-10 xl:gap-16 items-center">
            {/* ── Left: text ────────────────────────────────────────────── */}
            <div className="text-center lg:text-left">
              {/* Animated pill badge */}
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/8 px-3 sm:px-4 py-1.5 text-[10px] xs:text-xs sm:text-sm font-medium text-accent shadow-glow-sm">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                </span>
                <span className="sm:hidden">Zero Knowledge · No Account</span>
                <span className="hidden sm:inline">
                  AES-256-GCM · Zero Knowledge · No Account
                </span>
              </div>

              {/* Headline */}
              <h1 className="mb-5 text-[1.9rem] xs:text-[2.4rem] sm:text-5xl lg:text-6xl xl:text-[4rem] font-extrabold tracking-tight leading-[1.1]">
                <span className="text-white">Share files only </span>
                <span className="bg-gradient-to-r from-accent via-violet-300 to-purple-400 bg-clip-text text-transparent text-glow">
                  your recipient
                </span>
                <span className="text-white"> can open.</span>
              </h1>

              <p className="mb-8 text-base sm:text-lg text-text-secondary max-w-lg mx-auto lg:mx-0 leading-relaxed">
                Nexro encrypts your files in the browser before upload. Nobody —
                not even us — can read your files without the access code.
              </p>

              {/* CTAs */}
              <div className="flex flex-col gap-3 lg:flex-row lg:justify-start lg:items-center">
                <Link href="/upload" className="w-full lg:w-auto">
                  <Button
                    size="xl"
                    className="relative w-full lg:w-auto gap-2 px-8 overflow-hidden group"
                  >
                    <span className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <Upload className="h-4 w-4 shrink-0" />
                    Encrypt &amp; Share — Free
                  </Button>
                </Link>
                <Link
                  href="#how-it-works"
                  className="flex items-center justify-center gap-1.5 text-sm font-medium text-text-secondary hover:text-white transition-colors duration-200 py-2 lg:py-0"
                >
                  How it works
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </Link>
              </div>

              {/* Trust points — desktop */}
              <div className="mt-7 hidden lg:flex flex-wrap lg:justify-start gap-x-5 gap-y-2.5">
                {trustBadges.map((t) => (
                  <span
                    key={t}
                    className="flex items-center gap-1.5 text-xs sm:text-sm text-text-secondary"
                  >
                    <Check className="h-3.5 w-3.5 text-success shrink-0" />
                    {t}
                  </span>
                ))}
              </div>

              {/* Mobile security mini-card */}
              <div className="mt-6 lg:hidden rounded-2xl border border-border bg-surface-2/80 backdrop-blur-sm p-4 grid grid-cols-2 gap-3">
                {[
                  {
                    icon: Lock,
                    label: "AES-256-GCM",
                    sub: "Client-side",
                    color: "text-accent",
                    bg: "bg-accent/10",
                  },
                  {
                    icon: Eye,
                    label: "Zero Knowledge",
                    sub: "Server sees nothing",
                    color: "text-success",
                    bg: "bg-success/10",
                  },
                  {
                    icon: Zap,
                    label: "10 GB+ files",
                    sub: "Chunked streaming",
                    color: "text-warning",
                    bg: "bg-warning/10",
                  },
                  {
                    icon: ShieldCheck,
                    label: "Rate-limited",
                    sub: "5-attempt lockout",
                    color: "text-purple-400",
                    bg: "bg-purple-500/10",
                  },
                ].map(({ icon: Icon, label, sub, color, bg }) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${bg}`}
                    >
                      <Icon className={`h-4 w-4 ${color}`} />
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`text-[11px] font-bold leading-tight ${color}`}
                      >
                        {label}
                      </p>
                      <p className="text-[10px] text-muted leading-tight truncate">
                        {sub}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right: floating mockup card — hidden on mobile ────────── */}
            <div className="hidden lg:flex relative justify-end">
              {/* Outer glow blob */}
              <div className="pointer-events-none absolute inset-8 rounded-3xl bg-accent/20 blur-3xl animate-glow-pulse" />

              {/* Main card */}
              <div className="relative w-full max-w-[400px] rounded-3xl border border-accent/25 bg-surface/95 backdrop-blur-xl shadow-[0_0_80px_rgba(124,110,255,0.16),0_32px_64px_rgba(0,0,0,0.45)] animate-float overflow-hidden">
                {/* Scanning beam */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent animate-beam" />

                {/* Top bar */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                    </span>
                    <span className="text-[11px] font-mono text-text-secondary">
                      nexro://encrypt
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-surface-2" />
                    <div className="h-2.5 w-2.5 rounded-full bg-surface-2" />
                    <div className="h-2.5 w-2.5 rounded-full bg-surface-2" />
                  </div>
                </div>

                <div className="p-5 space-y-3.5">
                  {/* File row */}
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-2 px-3 py-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 ring-1 ring-accent/20 shrink-0">
                      <FileText className="h-5 w-5 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-white truncate">
                        project-demo.mp4
                      </p>
                      <p className="text-[11px] text-text-secondary">
                        1.4 GB · video/mp4
                      </p>
                    </div>
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-success/15 shrink-0">
                      <Check className="h-3 w-3 text-success" />
                    </div>
                  </div>

                  {/* Encryption progress */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[11px] text-text-secondary">
                        AES-256-GCM · Encrypting…
                      </span>
                      <span className="text-[11px] font-mono font-bold text-accent">
                        78%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
                      <div className="relative h-full w-[78%] rounded-full bg-gradient-to-r from-accent to-purple-400">
                        <div className="absolute inset-0 overflow-hidden rounded-full">
                          <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer-slide" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Crypto params grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {cryptoParams.map(({ k, v }) => (
                      <div
                        key={k}
                        className="rounded-lg border border-border bg-background/70 px-2.5 py-2"
                      >
                        <p className="text-[10px] font-medium text-muted mb-0.5">
                          {k}
                        </p>
                        <p className="text-[12px] font-mono font-bold text-white">
                          {v}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Access code */}
                  <div className="rounded-xl border border-accent/30 bg-accent/6 px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-accent mb-1">
                        Access Code
                      </p>
                      <p className="text-[22px] font-mono font-black text-white tracking-[0.18em]">
                        KXMN·7PQR
                      </p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 ring-1 ring-accent/25">
                      <Key className="h-5 w-5 text-accent" />
                    </div>
                  </div>
                </div>

                {/* Card footer */}
                <div className="flex items-center justify-between px-5 py-3 border-t border-white/5 bg-surface-2/60">
                  <div className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-success" />
                    <span className="text-[11px] font-semibold text-success">
                      Encrypted
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                    </span>
                    <span className="text-[11px] font-semibold text-accent">
                      Uploading…
                    </span>
                  </div>
                </div>
              </div>

              {/* Floating badge — Zero Knowledge */}
              <div className="hidden sm:flex absolute top-6 -left-4 lg:-left-6 items-center gap-2 rounded-xl border border-success/25 bg-surface/95 backdrop-blur-sm px-3 py-2 shadow-card animate-float-delayed z-10">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-success/15 shrink-0">
                  <ShieldCheck className="h-3.5 w-3.5 text-success" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-success">
                    Zero Knowledge
                  </p>
                  <p className="text-[10px] text-muted">
                    Server sees ciphertext only
                  </p>
                </div>
              </div>

              {/* Floating badge — Large file */}
              <div className="hidden sm:flex absolute bottom-10 -right-4 lg:-right-6 items-center gap-2 rounded-xl border border-warning/25 bg-surface/95 backdrop-blur-sm px-3 py-2 shadow-card animate-float-slow z-10">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-warning/15 shrink-0">
                  <Zap className="h-3.5 w-3.5 text-warning" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-warning">
                    10 GB+ Supported
                  </p>
                  <p className="text-[10px] text-muted">Chunked streaming</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="pointer-events-none absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* ── Stats bar ─────────────────────────────────────────────────────── */}
      <section className="border-y border-border bg-surface/40 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4">
            {[
              { value: "AES-256-GCM", label: "Encryption standard" },
              { value: "200k", label: "PBKDF2 iterations" },
              { value: "bcrypt·12", label: "Code hashing" },
              { value: "0 bytes", label: "Plaintext on server" },
            ].map(({ value, label }, i) => (
              <div
                key={label}
                className={`group flex flex-col items-center gap-1.5 px-4 py-5 sm:py-7 text-center ${
                  i % 2 !== 0 ? "border-l border-border" : ""
                } ${i >= 2 ? "border-t sm:border-t-0 border-border" : ""} ${
                  i > 0 ? "sm:border-l sm:border-border" : ""
                }`}
              >
                <span className="font-mono text-base sm:text-lg font-bold text-accent tabular-nums">
                  {value}
                </span>
                <span className="text-xs text-muted group-hover:text-text-secondary transition-colors duration-200">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section className="py-14 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-14 text-center max-w-2xl mx-auto">
            <p className="mb-3 text-xs sm:text-sm font-bold uppercase tracking-widest text-accent">
              Security architecture
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.08]">
              Built from the ground up{" "}
              <span className="bg-gradient-to-r from-accent to-purple-400 bg-clip-text text-transparent">
                for privacy
              </span>
            </h2>
            <p className="mt-4 text-sm sm:text-base text-text-secondary leading-relaxed">
              Every design decision — algorithm, key derivation, access control,
              and storage — was made to guarantee your data stays yours.
            </p>
          </div>

          <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(
              ({
                icon: Icon,
                label,
                title,
                desc,
                gradient,
                iconBg,
                iconColor,
                stat,
                statSub,
                borderHover,
                shadow,
              }) => (
                <div
                  key={title}
                  className={`group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface p-6 transition-all duration-300 hover:-translate-y-1.5 ${borderHover} ${shadow}`}
                >
                  <div
                    className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${gradient}`}
                  />
                  <div className="relative flex items-start justify-between mb-5">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconBg}`}
                    >
                      <Icon className={`h-6 w-6 ${iconColor}`} />
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-mono text-lg font-extrabold ${iconColor}`}
                      >
                        {stat}
                      </p>
                      <p className="text-[11px] text-muted">{statSub}</p>
                    </div>
                  </div>
                  <div className="relative flex-1 flex flex-col">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1.5">
                      {label}
                    </p>
                    <h3 className="font-bold text-white text-sm sm:text-[15px] leading-snug mb-2.5">
                      {title}
                    </h3>
                    <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                      {desc}
                    </p>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section
        id="how-it-works"
        className="relative overflow-hidden border-t border-border py-14 sm:py-20 lg:py-28"
      >
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-accent/4 blur-[120px]" />

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-14 sm:mb-20 text-center max-w-xl mx-auto">
            <p className="mb-3 text-xs sm:text-sm font-bold uppercase tracking-widest text-accent">
              How it works
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.08]">
              Four steps to a{" "}
              <span className="bg-gradient-to-r from-accent to-purple-400 bg-clip-text text-transparent">
                private share
              </span>
            </h2>
          </div>

          <div className="relative grid gap-10 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <div className="hidden lg:block absolute top-[22px] left-[calc(12.5%+22px)] right-[calc(12.5%+22px)] h-px bg-gradient-to-r from-accent/30 via-warning/20 to-success/30" />

            {steps.map(({ n, icon: Icon, title, desc, color, iconBg, dot }) => (
              <div key={n} className="flex flex-col gap-3">
                <div className="flex items-center gap-4 lg:flex-col lg:items-start">
                  <div className="relative shrink-0">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface-2 ${iconBg} relative z-10`}
                    >
                      <Icon className={`h-5 w-5 ${color}`} />
                    </div>
                    <div
                      className={`absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-background ${dot} z-20`}
                    />
                  </div>
                  <h3
                    className={`font-bold text-white text-sm sm:text-base lg:mt-4`}
                  >
                    {title}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed pl-[60px] lg:pl-0">
                  {desc}
                </p>
                <div className="pl-[60px] lg:pl-0">
                  <span
                    className={`font-mono text-4xl font-black ${color} opacity-[0.07] select-none`}
                  >
                    {n}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 sm:mt-20 text-center">
            <Link href="/upload">
              <Button
                size="xl"
                className="gap-2.5 px-10 shadow-glow hover:shadow-glow-lg transition-shadow duration-300"
              >
                <Upload className="h-4 w-4 shrink-0" />
                Start encrypting now
              </Button>
            </Link>
            <p className="mt-3 text-xs text-muted">
              Free · No account required · Works on any device
            </p>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────────────────────── */}
      <section className="border-t border-border">
        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/8 via-purple-900/5 to-transparent" />
          <div className="pointer-events-none absolute -top-28 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-accent/10 blur-[90px] animate-glow-pulse" />

          <div className="relative mx-auto max-w-3xl px-4 sm:px-6 py-12 sm:py-16 lg:py-24 text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/8 px-4 py-1.5 text-xs font-semibold text-accent">
              <Shield className="h-3.5 w-3.5 shrink-0" />
              Military-grade encryption, zero server trust
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-4 leading-[1.08]">
              Ready to share{" "}
              <span className="bg-gradient-to-r from-accent via-violet-400 to-purple-400 bg-clip-text text-transparent text-glow">
                privately?
              </span>
            </h2>

            <p className="text-sm sm:text-base text-text-secondary max-w-lg mx-auto mb-9 leading-relaxed">
              No signup. No tracking. No plaintext on our servers. Just share
              your file and hand the code to the right person.
            </p>

            <Link href="/upload" className="inline-block w-full xs:w-auto">
              <Button
                size="xl"
                className="w-full xs:w-auto gap-2 px-10 shadow-glow hover:shadow-glow-lg transition-all duration-300"
              >
                <Upload className="h-4 w-4 shrink-0" />
                Share a File — Free
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
