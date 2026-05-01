import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className, label, error, hint, leftIcon, rightElement, id, ...props },
    ref,
  ) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-text-secondary"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-muted pointer-events-none">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full rounded-lg border bg-surface-2 px-3 py-2.5 text-white text-sm",
              "placeholder:text-muted",
              "border-border-2 focus:border-accent focus:ring-1 focus:ring-accent/30 focus:shadow-glow-sm",
              "outline-none transition-all duration-200",
              error &&
                "border-danger/50 focus:border-danger focus:ring-danger/30",
              leftIcon && "pl-10",
              rightElement && "pr-12",
              className,
            )}
            {...props}
          />
          {rightElement && (
            <span className="absolute right-3">{rightElement}</span>
          )}
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
        {hint && !error && (
          <p className="text-xs text-text-secondary">{hint}</p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
