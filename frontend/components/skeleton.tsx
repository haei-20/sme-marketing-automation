import { type HTMLAttributes } from "react";

import { cn } from "./utils";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  rounded?: "sm" | "md" | "lg" | "full";
}

const roundedClasses = {
  sm: "rounded",
  md: "rounded-lg",
  lg: "rounded-2xl",
  full: "rounded-full",
};

export function Skeleton({ className, rounded = "md", ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse bg-slate-200/80 dark:bg-slate-800",
        roundedClasses[rounded],
        className,
      )}
      {...props}
    />
  );
}
export interface SkeletonTextProps extends HTMLAttributes<HTMLDivElement> {
  lines?: number;
}

export function SkeletonText({ lines = 3, className, ...props }: SkeletonTextProps) {
  return (
    <div className={cn("space-y-2.5", className)} aria-hidden="true" {...props}>
      {Array.from({ length: Math.max(1, lines) }, (_, index) => (
        <Skeleton
          key={index}
          className={cn("h-3", index === lines - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  );
}

export function CardSkeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="status"
      aria-label="Đang tải nội dung"
      className={cn("rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950", className)}
      {...props}
    >
      <div className="flex items-center gap-3">
        <Skeleton rounded="full" className="size-10 shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-2/5" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      <SkeletonText lines={3} className="mt-5" />
      <span className="sr-only">Đang tải…</span>
    </div>
  );
}
