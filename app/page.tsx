import Link from "next/link";
import {
  Shield,
  Lock,
  Zap,
  Eye,
  Upload,
  Key,
  ChevronRight,
  Check,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

const features = [
  {
    icon: Lock,
    title: "End-to-End Encrypted",
    desc: "AES-256-GCM runs in your browser. The server only ever receives ciphertext — never plaintext.",
    gradient: "from-accent/25 to-accent/5",
    iconColor: "text-accent",
    border: "hover:border-accent/40",
  },
  {
    icon: Eye,
    title: "Zero Knowledge",
    desc: "We never see your files or access codes. Only recipients with the right code can decrypt.",
    gradient: "from-success/25 to-success/5",
    iconColor: "text-success",
    border: "hover:border-success/40",
  },
  {
    icon: Key,
    title: "Access Codes",
    desc: "Each file gets a unique 8-character code. Share it separately — maximising security.",
    gradient: "from-warning/25 to-warning/5",
    iconColor: "text-warning",
    border: "hover:border-warning/40",
  },
  {
    icon: Zap,
    title: "Large File Support",
    desc: "Streaming 10 MB chunks lets you share entire movies and raw footage without memory issues.",
    gradient: "from-purple-500/25 to-purple-500/5",
    iconColor: "text-purple-400",
    border: "hover:border-purple-500/40",
  },
];

const steps = [
  {
    n: "01",
    title: "Drop your file",
    desc: "Drag & drop or tap to pick any file — images, videos, documents, archives.",
  },
  {
    n: "02",
    title: "Encrypted in browser",
    desc: "AES-256-GCM encryption runs client-side before a single byte is uploaded.",
  },
  {
    n: "03",
    title: "Share the code",
    desc: "Send the unique link and your secret access code to the recipient.",
  },
  {
    n: "04",
    title: "Recipient decrypts",
    desc: "They enter the code and the file decrypts entirely in their browser.",
  },
];

const stats = [
  { label: "Encryption", value: "AES-256-GCM" },
  { label: "Key Derivation", value: "PBKDF2 · 200k" },
  { label: "Code Hashing", value: "bcrypt · 12r" },
  { label: "Server sees", value: "Ciphertext only" },
];

const trustPoints = [
  "No account required",
  "No plaintext stored",
  "Files auto-expire",
  "Rate-limited access",
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-20 sm:py-28 lg:py-36">
        {/* Grid layer */}
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-80" />
        {/* Glow orbs */}
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-accent/10 blur-[130px] animate-glow-pulse" />
        <div className="pointer-events-none absolute top-10 -right-24 h-[320px] w-[320px] rounded-full bg-purple-600/8 blur-[100px]" />
        <div className="pointer-events-none absolute bottom-0 -left-24 h-[280px] w-[280px] rounded-full bg-success/6 blur-[100px]" />

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 text-center">
          {/* Pill badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/8 px-4 py-1.5 text-xs sm:text-sm text-accent shadow-glow-sm">
            <Shield className="h-3.5 w-3.5 shrink-0" />
            <span>AES-256-GCM · Zero Knowledge · No Account Needed</span>
          </div>

          {/* Heading */}
          <h1 className="mb-5 text-[2.6rem] sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight leading-[1.08]">
            <span className="text-white">Share files </span>
            <span className="bg-gradient-to-r from-accent via-violet-400 to-purple-400 bg-clip-text text-transparent text-glow">
              securely
            </span>
            <br className="hidden xs:block" />
            <span className="text-white"> with zero trust</span>
          </h1>

          <p className="mb-8 text-base sm:text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Nexro encrypts your files in the browser before upload. Nobody — not
            even us — can read your files without the access code.
          </p>

          {/* CTAs */}
          <div className="flex flex-col xs:flex-row gap-3 justify-center items-center">
            <Link href="/upload" className="w-full xs:w-auto">
              <Button
                size="lg"
                className="w-full xs:w-auto gap-2 px-7 h-12 sm:h-14 text-base font-semibold"
              >
                <Upload className="h-4 w-4 shrink-0" />
                Share a File
              </Button>
            </Link>
            <Link href="#how-it-works" className="w-full xs:w-auto">
              <Button
                size="lg"
                variant="secondary"
                className="w-full xs:w-auto gap-2 px-7 h-12 sm:h-14 text-base"
              >
                How it works
                <ChevronRight className="h-4 w-4 shrink-0" />
              </Button>
            </Link>
          </div>

          {/* Trust pills */}
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {trustPoints.map((t) => (
              <span
                key={t}
                className="flex items-center gap-1.5 rounded-full border border-border bg-surface/50 px-3 py-1 text-xs text-text-secondary backdrop-blur-sm"
              >
                <Check className="h-3 w-3 text-success shrink-0" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats bar ───────────────────────────────────────── */}
      <section className="border-y border-border bg-surface/50 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border">
            {stats.map(({ label, value }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-1 px-4 py-5 sm:py-6 text-center"
              >
                <span className="font-mono text-sm sm:text-base font-bold text-accent">
                  {value}
                </span>
                <span className="text-xs text-text-secondary">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-10 sm:mb-14 text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
              Built for security-first sharing
            </h2>
            <p className="mt-3 text-sm sm:text-base text-text-secondary max-w-xl mx-auto">
              Every design decision in Nexro prioritises your privacy.
            </p>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(
              ({ icon: Icon, title, desc, gradient, iconColor, border }) => (
                <div
                  key={title}
                  className={`group flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover ${border}`}
                >
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shrink-0`}
                  >
                    <Icon className={`h-5 w-5 ${iconColor}`} />
                  </div>
                  <h3 className="font-semibold text-white text-sm sm:text-base leading-snug">
                    {title}
                  </h3>
                  <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                    {desc}
                  </p>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────── */}
      <section
        id="how-it-works"
        className="py-16 sm:py-24 border-t border-border"
      >
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-10 sm:mb-14 text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
              How it works
            </h2>
            <p className="mt-3 text-sm sm:text-base text-text-secondary max-w-xl mx-auto">
              Four steps from file to secure share.
            </p>
          </div>

          <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 relative">
            {/* Connector line — lg only */}
            <div className="hidden lg:block absolute top-5 left-[calc(12.5%+1.5rem)] right-[calc(12.5%+1.5rem)] h-px bg-gradient-to-r from-transparent via-accent/25 to-transparent" />

            {steps.map(({ n, title, desc }, i) => (
              <div key={n} className="relative flex flex-col gap-3">
                <div className="flex items-center gap-4 lg:gap-0 lg:flex-col lg:items-start">
                  {/* Number bubble */}
                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-accent/30 bg-accent/10 z-10">
                    <span className="font-mono text-xs font-bold text-accent">
                      {n}
                    </span>
                  </div>
                  {/* Connector arrow on mobile */}
                  {i < steps.length - 1 && (
                    <ArrowRight className="shrink-0 h-4 w-4 text-border-2 sm:hidden rotate-90 absolute -bottom-4 left-3" />
                  )}
                  <h3 className="font-semibold text-white text-sm sm:text-base lg:mt-3">
                    {title}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed pl-14 lg:pl-0">
                  {desc}
                </p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-12 sm:mt-16 text-center">
            <Link href="/upload">
              <Button size="lg" className="gap-2 px-8 h-12">
                <Upload className="h-4 w-4" />
                Start sharing securely
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────── */}
      <section className="border-t border-border">
        <div className="relative overflow-hidden">
          {/* Subtle glow */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent" />
          <div className="relative mx-auto max-w-5xl px-4 sm:px-6 py-12 sm:py-16 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-center sm:text-left">
              <h3 className="text-xl sm:text-2xl font-bold text-white">
                Ready to share securely?
              </h3>
              <p className="mt-1.5 text-sm text-text-secondary">
                No signup. No tracking. No plaintext on our servers.
              </p>
            </div>
            <Link href="/upload" className="w-full sm:w-auto shrink-0">
              <Button size="lg" className="w-full sm:w-auto gap-2 px-8 h-12">
                <Upload className="h-4 w-4" />
                Share a File
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
