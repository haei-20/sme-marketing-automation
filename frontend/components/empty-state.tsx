import { type HTMLAttributes, type ReactNode } from "react";

import { cn } from "./utils";

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  secondaryAction?: ReactNode;
  compact?: boolean;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  compact = false,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center text-center",
        compact ? "px-4 py-8" : "px-5 py-14 sm:py-18",
        className,
      )}
      {...props}
    >
      <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-xl font-bold text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-900">
        <span aria-hidden="true">{icon ?? "—"}</span>
      </div>
      <h3 className="text-base font-bold text-slate-950 dark:text-white">{title}</h3>
      {description && (
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
