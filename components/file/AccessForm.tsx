"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock, AlertTriangle, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import type { FilePublicInfo } from "@/types";

interface AccessFormProps {
  fileInfo: FilePublicInfo;
  onSubmit: (accessCode: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  attemptsLeft: number | null;
}

export function AccessForm({
  fileInfo,
  onSubmit,
  loading,
  error,
  attemptsLeft,
}: AccessFormProps) {
  const [code, setCode] = useState("");
  const [show, setShow] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    onSubmit(code.trim());
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value
      .replace(/-/g, "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
    if (val.length > 4) val = val.slice(0, 4) + "-" + val.slice(4, 8);
    setCode(val);
  };

  const isLocked = attemptsLeft !== null && attemptsLeft === 0;
  const hasError = !!error && attemptsLeft !== 0;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* E2EE notice */}
        <div className="flex items-start gap-3 rounded-xl border border-accent/20 bg-accent/6 px-4 py-3.5">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <p className="text-xs text-text-secondary leading-relaxed">
            This file is{" "}
            <span className="text-white font-medium">end-to-end encrypted</span>
            . Your code is never sent to our servers — decryption happens
            entirely in your browser.
          </p>
        </div>

        {/* Rate-limit lock */}
        <AnimatePresence>
          {isLocked && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/6 px-4 py-3.5"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
              <p className="text-sm font-medium text-danger">
                Too many failed attempts. Please wait 15 minutes before trying
                again.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Code input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary">
            Access Code
          </label>
          <div className="relative flex items-center">
            <input
              value={code}
              onChange={handleChange}
              maxLength={9}
              disabled={loading || isLocked}
              type={show ? "text" : "password"}
              autoComplete="one-time-code"
              spellCheck={false}
              inputMode="text"
              placeholder="XXXX-XXXX"
              className={`w-full rounded-xl border bg-surface-2 pl-4 pr-12 py-4 font-mono text-xl sm:text-2xl font-bold tracking-[0.25em] text-center text-white placeholder:text-muted/50 placeholder:tracking-normal outline-none transition-all duration-200 ${
                hasError
                  ? "border-danger/60 focus:border-danger focus:ring-1 focus:ring-danger/30 bg-danger/5"
                  : isLocked
                    ? "border-border opacity-50 cursor-not-allowed"
                    : "border-border-2 focus:border-accent focus:ring-1 focus:ring-accent/30 hover:border-border"
              }`}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute right-3 flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:text-white transition-colors touch-target"
              tabIndex={-1}
              aria-label={show ? "Hide code" : "Show code"}
            >
              {show ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Error / attempt feedback */}
          <AnimatePresence>
            {hasError && error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-between"
              >
                <p className="text-xs text-danger">{error}</p>
                {attemptsLeft !== null && attemptsLeft > 0 && (
                  <p className="text-xs text-text-secondary shrink-0">
                    {attemptsLeft} attempt{attemptsLeft !== 1 ? "s" : ""} left
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
          disabled={!code || code.replace("-", "").length < 8 || isLocked}
          className="w-full h-14 text-base font-semibold gap-2 shadow-glow-sm hover:shadow-glow"
        >
          <Lock className="h-4 w-4 shrink-0" />
          Decrypt &amp; Access File
        </Button>
      </form>
    </motion.div>
  );
}
