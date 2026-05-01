"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FileText,
  ExternalLink,
  X,
} from "lucide-react";
import { formatBytes, formatTimeLeft } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface FileRow {
  id: string;
  name: string;
  original_name: string;
  size: number;
  mime_type: string;
  download_count: number;
  max_downloads: number | null;
  expires_at: string | null;
  created_at: string;
  is_deleted: boolean;
  chunk_count: number;
}

type Filter = "all" | "active" | "expired" | "deleted";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "expired", label: "Expired" },
  { value: "deleted", label: "Deleted" },
];

function StatusBadge({ file }: { file: FileRow }) {
  if (file.is_deleted)
    return (
      <span className="rounded-full bg-danger/10 border border-danger/20 px-2 py-0.5 text-[10px] font-medium text-danger">
        Deleted
      </span>
    );
  if (file.expires_at && new Date(file.expires_at) <= new Date())
    return (
      <span className="rounded-full bg-warning/10 border border-warning/20 px-2 py-0.5 text-[10px] font-medium text-warning">
        Expired
      </span>
    );
  return (
    <span className="rounded-full bg-success/10 border border-success/20 px-2 py-0.5 text-[10px] font-medium text-success">
      Active
    </span>
  );
}

export default function AdminFilesPage() {
  const [files, setFiles] = useState<FileRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const limit = 25;

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        filter,
        ...(search ? { search } : {}),
      });
      const res = await fetch(`/api/admin/files?${params}`);
      const data = await res.json();
      if (data.error) setError(data.error);
      else {
        setFiles(data.files);
        setTotal(data.total);
      }
    } catch {
      setError("Failed to load files.");
    } finally {
      setLoading(false);
    }
  }, [page, filter, search]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // Reset page when filter/search changes
  useEffect(() => {
    setPage(1);
  }, [filter, search]);

  async function deleteFile(id: string) {
    if (!confirm("Delete this file? This removes it from storage permanently."))
      return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/files?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.ok) fetchFiles();
      else setError(data.error ?? "Delete failed.");
    } catch {
      setError("Delete failed.");
    } finally {
      setDeletingId(null);
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-5 sm:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Files</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {total} file{total !== 1 ? "s" : ""} total
          </p>
        </div>
        <button
          onClick={fetchFiles}
          disabled={loading}
          className="ml-auto flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm text-text-secondary hover:text-white hover:border-border-2 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Filters + search */}
      <div className="mb-5 flex flex-col sm:flex-row gap-3">
        {/* Filter tabs */}
        <div className="flex rounded-xl border border-border bg-surface overflow-hidden">
          {FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors",
                filter === value
                  ? "bg-accent/15 text-accent"
                  : "text-text-secondary hover:text-white",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search by filename…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-4 py-2 pl-9 text-sm text-white placeholder:text-muted outline-none focus:border-accent/60 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
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
                  File
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider hidden sm:table-cell">
                  Size
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider hidden md:table-cell">
                  Downloads
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider hidden lg:table-cell">
                  Expires
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && files.length === 0 ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-4 py-3">
                      <div className="h-4 rounded bg-surface-2 animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : files.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-text-secondary"
                  >
                    <FileText className="mx-auto mb-2 h-8 w-8 text-muted" />
                    No files found
                  </td>
                </tr>
              ) : (
                files.map((file) => (
                  <tr
                    key={file.id}
                    className={cn(
                      "hover:bg-surface-2/40 transition-colors",
                      loading && "opacity-60",
                    )}
                  >
                    <td className="px-4 py-3 max-w-[200px]">
                      <p
                        className="font-medium text-white truncate"
                        title={file.original_name}
                      >
                        {file.original_name}
                      </p>
                      <p className="text-[11px] text-muted mt-0.5 font-mono truncate">
                        {file.id.slice(0, 8)}…
                      </p>
                    </td>
                    <td className="px-4 py-3 text-text-secondary hidden sm:table-cell whitespace-nowrap">
                      {formatBytes(file.size)}
                    </td>
                    <td className="px-4 py-3 text-text-secondary hidden md:table-cell whitespace-nowrap">
                      {file.download_count}
                      {file.max_downloads ? (
                        <span className="text-muted">
                          {" "}
                          / {file.max_downloads}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-text-secondary hidden lg:table-cell whitespace-nowrap">
                      {file.expires_at
                        ? formatTimeLeft(file.expires_at)
                        : "Never"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge file={file} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={`/file/${file.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg p-1.5 text-muted hover:text-white hover:bg-surface-2 transition-colors"
                          title="Open file page"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        {!file.is_deleted && (
                          <button
                            onClick={() => deleteFile(file.id)}
                            disabled={deletingId === file.id}
                            className="rounded-lg p-1.5 text-muted hover:text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
                            title="Delete file"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-xs text-text-secondary">
              Page {page} of {totalPages} · {total} files
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg p-1.5 text-muted hover:text-white disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg p-1.5 text-muted hover:text-white disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
