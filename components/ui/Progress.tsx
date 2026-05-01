import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number; // 0-100
  label?: string;
  sublabel?: string;
  variant?: "default" | "success" | "warning" | "danger";
  size?: "sm" | "md";
  animated?: boolean;
  className?: string;
}

const variantClasses = {
  default: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

export function Progress({
  value,
  label,
  sublabel,
  variant = "default",
  size = "md",
  animated = true,
  className,
}: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("w-full", className)}>
      {(label || sublabel) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <span className="text-sm font-medium text-white">{label}</span>
          )}
          {sublabel && (
            <span className="text-xs text-text-secondary">{sublabel}</span>
          )}
        </div>
      )}
      <div
        className={cn(
          "w-full rounded-full bg-surface-2 overflow-hidden",
          size === "sm" ? "h-1.5" : "h-2.5",
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 relative overflow-hidden",
            variantClasses[variant],
          )}
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          {animated && clamped > 0 && clamped < 100 && (
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-shimmer-slide" />
          )}
        </div>
      </div>
    </div>
  );
}
