"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { RefreshCw, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface Session {
  id: string;
  file_id: string;
  expected_chunks: number;
  received_chunks: number;
  completed: boolean;
  created_at: string;
  expires_at: string | null;
  ip_hash: string | null;
}

function StatusBadge({ completed }: { completed: boolean }) {
  return completed ? (
    <span className="rounded-full bg-success/10 border border-success/20 px-2 py-0.5 text-[10px] font-medium text-success">
      Completed
    </span>
  ) : (
    <span className="rounded-full bg-warning/10 border border-warning/20 px-2 py-0.5 text-[10px] font-medium text-warning">
      Pending
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Progress({
  received,
  expected,
}: {
  received: number;
  expected: number;
}) {
  const pct = expected > 0 ? Math.round((received / expected) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 rounded-full bg-surface-2 overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-text-secondary whitespace-nowrap">
        {received}/{expected}
      </span>
    </div>
  );
}

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/sessions");
      const data = await res.json();
      if (data.error) setError(data.error);
      else {
        setSessions(data.sessions);
        setLastUpdated(new Date());
      }
    } catch {
      setError("Failed to load sessions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
    timerRef.current = setInterval(fetchSessions, 10_000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchSessions]);

  const pending = sessions.filter((s) => !s.completed).length;
  const completed = sessions.filter((s) => s.completed).length;

  return (
    <div className="p-5 sm:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Upload Sessions</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {pending} pending · {completed} completed · auto-refreshes every 10
            s
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs text-muted">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchSessions}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm text-text-secondary hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", loading && "animate-spin")}
            />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-danger/20 bg-danger/8 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Session ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider hidden sm:table-cell">
                  File ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Chunks
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider hidden md:table-cell">
                  Created
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider hidden lg:table-cell">
                  Expires
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && sessions.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-4 py-3">
                      <div className="h-4 rounded bg-surface-2 animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : sessions.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-text-secondary"
                  >
                    <Activity className="mx-auto mb-2 h-8 w-8 text-muted" />
                    No sessions found
                  </td>
                </tr>
              ) : (
                sessions.map((s) => (
                  <tr
                    key={s.id}
                    className={cn(
                      "hover:bg-surface-2/40 transition-colors",
                      loading && "opacity-60",
                    )}
                  >
                    <td className="px-4 py-3">
                      <code className="font-mono text-xs text-text-secondary">
                        {s.id.slice(0, 8)}…
                      </code>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <a
                        href={`/file/${s.file_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-accent hover:underline"
                      >
                        {s.file_id.slice(0, 8)}…
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <Progress
                        received={s.received_chunks}
                        expected={s.expected_chunks}
                      />
                    </td>
                    <td className="px-4 py-3 text-text-secondary hidden md:table-cell whitespace-nowrap text-xs">
                      {formatDate(s.created_at)}
                    </td>
                    <td className="px-4 py-3 text-text-secondary hidden lg:table-cell whitespace-nowrap text-xs">
                      {s.expires_at ? formatDate(s.expires_at) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge completed={s.completed} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
