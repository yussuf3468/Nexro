"use client";

import { useEffect, useState } from "react";
import {
  Files,
  HardDrive,
  Download,
  Activity,
  AlertTriangle,
  Upload,
  Clock,
  Trash2,
} from "lucide-react";
import { formatBytes } from "@/lib/utils";

interface Stats {
  totalFiles: number;
  activeFiles: number;
  expiredFiles: number;
  deletedFiles: number;
  totalStorageBytes: number;
  totalDownloads: number;
  recentUploads: number;
  recentFailedAttempts: number;
  pendingSessions: number;
  completedSessions: number;
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent?: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">{label}</p>
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent ?? "bg-surface-2"}`}
        >
          <Icon className="h-4 w-4 text-white" />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-text-secondary">{sub}</p>}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setStats(data);
      })
      .catch(() => setError("Failed to load stats."));
  }, []);

  return (
    <div className="p-5 sm:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-text-secondary mt-1">
          Overview of all Nexro activity
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-danger/20 bg-danger/8 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {!stats && !error && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-2xl border border-border bg-surface animate-pulse"
            />
          ))}
        </div>
      )}

      {stats && (
        <>
          {/* Primary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <StatCard
              label="Active Files"
              value={stats.activeFiles}
              sub={`of ${stats.totalFiles} total`}
              icon={Files}
              accent="bg-accent/15"
            />
            <StatCard
              label="Storage Used"
              value={formatBytes(stats.totalStorageBytes)}
              sub="active files only"
              icon={HardDrive}
              accent="bg-purple-500/15"
            />
            <StatCard
              label="Total Downloads"
              value={stats.totalDownloads}
              sub="all time"
              icon={Download}
              accent="bg-success/15"
            />
            <StatCard
              label="Uploads (24h)"
              value={stats.recentUploads}
              sub="last 24 hours"
              icon={Upload}
              accent="bg-warning/15"
            />
          </div>

          {/* Secondary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Expired Files"
              value={stats.expiredFiles}
              icon={Clock}
              accent="bg-warning/10"
            />
            <StatCard
              label="Deleted Files"
              value={stats.deletedFiles}
              icon={Trash2}
              accent="bg-danger/10"
            />
            <StatCard
              label="Failed Attempts (24h)"
              value={stats.recentFailedAttempts}
              sub="wrong access codes"
              icon={AlertTriangle}
              accent="bg-danger/10"
            />
            <StatCard
              label="Pending Sessions"
              value={stats.pendingSessions}
              sub={`${stats.completedSessions} completed`}
              icon={Activity}
              accent="bg-surface-2"
            />
          </div>

          {/* Quick links */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a
              href="/admin/files"
              className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-5 hover:border-accent/40 hover:bg-surface-2/50 transition-all group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 group-hover:bg-accent/20 transition-colors">
                <Files className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="font-semibold text-white">Manage Files</p>
                <p className="text-xs text-text-secondary mt-0.5">
                  View, search and delete uploaded files
                </p>
              </div>
            </a>
            <a
              href="/admin/sessions"
              className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-5 hover:border-accent/40 hover:bg-surface-2/50 transition-all group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                <Activity className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="font-semibold text-white">Upload Sessions</p>
                <p className="text-xs text-text-secondary mt-0.5">
                  Monitor active and completed upload sessions
                </p>
              </div>
            </a>
          </div>
        </>
      )}
    </div>
  );
}
