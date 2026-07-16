import { type HTMLAttributes } from "react";

import { cn } from "./utils";

export type ProgressTone = "primary" | "info" | "warning" | "danger";
export type ProgressSize = "sm" | "md" | "lg";

export interface ProgressProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  value?: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  tone?: ProgressTone;
  size?: ProgressSize;
}

const toneClasses: Record<ProgressTone, string> = {
  primary: "bg-emerald-500",
  info: "bg-sky-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
};

const sizeClasses: Record<ProgressSize, string> = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

export function Progress({
  value,
  max = 100,
  label,
  showValue = false,
  tone = "primary",
  size = "md",
  className,
  ...props
}: ProgressProps) {
  const safeMax = max > 0 ? max : 100;
  const isIndeterminate = value === undefined;
  const normalizedValue = Math.min(Math.max(value ?? 0, 0), safeMax);
  const percentage = Math.round((normalizedValue / safeMax) * 100);

  return (
    <div className={cn("w-full", className)} {...props}>
      {(label || showValue) && (
        <div className="mb-2 flex items-center justify-between gap-3 text-xs">
          {label && <span className="font-semibold text-slate-700 dark:text-slate-200">{label}</span>}
          {showValue && !isIndeterminate && (
            <span className="tabular-nums text-slate-500 dark:text-slate-400">{percentage}%</span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-label={label ?? "Tiến độ"}
        aria-valuemin={isIndeterminate ? undefined : 0}
        aria-valuemax={isIndeterminate ? undefined : safeMax}
        aria-valuenow={isIndeterminate ? undefined : normalizedValue}
        aria-valuetext={isIndeterminate ? "Đang xử lý" : `${percentage}%`}
        className={cn("overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800", sizeClasses[size])}
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-500 ease-out",
            toneClasses[tone],
            isIndeterminate && "w-2/5 animate-pulse",
          )}
          style={isIndeterminate ? undefined : { width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
