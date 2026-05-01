"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Upload, Menu, X, LayoutDashboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const navLinks = [{ href: "/#how-it-works", label: "How it works" }];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  // Close menu on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Add shadow after scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-xl transition-shadow duration-200",
        scrolled && "shadow-[0_1px_20px_rgba(0,0,0,0.4)]",
      )}
    >
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6 sm:h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 ring-1 ring-accent/30 transition-all duration-200 group-hover:ring-accent/60 group-hover:bg-accent/20">
            <Shield className="h-4 w-4 text-accent" />
          </div>
          <span className="font-bold text-base tracking-tight text-white">
            Nexro
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-text-secondary hover:text-white hover:bg-surface-2 transition-all duration-150"
            >
              {label}
            </Link>
          ))}
          <Link
            href="/admin"
            className="ml-1 flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-secondary hover:text-white hover:border-border-2 hover:bg-surface-2 transition-all duration-150"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            Admin
          </Link>
          <Link
            href="/upload"
            className="ml-2 flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover active:scale-[0.97] transition-all duration-150 shadow-glow-sm hover:shadow-glow"
          >
            <Upload className="h-3.5 w-3.5" />
            Share a File
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden flex h-10 w-10 items-center justify-center rounded-xl text-text-secondary hover:text-white hover:bg-surface-2 transition-all duration-150 touch-target"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle navigation menu"
          aria-expanded={open}
        >
          <AnimatePresence mode="wait" initial={false}>
            {open ? (
              <motion.span
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <X className="h-5 w-5" />
              </motion.span>
            ) : (
              <motion.span
                key="menu"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Menu className="h-5 w-5" />
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="sm:hidden overflow-hidden border-t border-border/60 bg-background/95 backdrop-blur-xl"
          >
            <nav className="flex flex-col gap-1 p-3 pb-safe">
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="flex items-center rounded-xl px-4 py-3 text-sm font-medium text-text-secondary hover:text-white hover:bg-surface-2 transition-all touch-target"
                >
                  {label}
                </Link>
              ))}
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-medium text-text-secondary hover:text-white hover:bg-surface-2 transition-all touch-target"
              >
                <LayoutDashboard className="h-4 w-4" />
                Admin
              </Link>
              <Link
                href="/upload"
                onClick={() => setOpen(false)}
                className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3.5 text-sm font-semibold text-white hover:bg-accent-hover active:scale-[0.98] transition-all touch-target"
              >
                <Upload className="h-4 w-4" />
                Share a File
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
