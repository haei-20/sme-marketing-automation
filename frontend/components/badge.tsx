import { type HTMLAttributes, type ReactNode } from "react";

import { cn } from "./utils";

export type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger" | "purple";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  dot?: boolean;
  leadingIcon?: ReactNode;
}

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700",
  info: "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:ring-sky-900",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-900",
  warning: "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-900",
  danger: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:ring-rose-900",
  purple: "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:ring-violet-900",
};

const dotClasses: Record<BadgeTone, string> = {
  neutral: "bg-slate-500",
  info: "bg-sky-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
  purple: "bg-violet-500",
};

export function Badge({
  className,
  tone = "neutral",
  dot = false,
  leadingIcon,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold leading-none ring-1 ring-inset",
        toneClasses[tone],
        className,
      )}
      {...props}
    >
      {dot && <span aria-hidden="true" className={cn("size-1.5 rounded-full", dotClasses[tone])} />}
      {leadingIcon && <span aria-hidden="true" className="shrink-0">{leadingIcon}</span>}
      {children}
    </span>
  );
}
export type MarketingStatus =
  | "draft"
  | "generating"
  | "review"
  | "approved"
  | "scheduled"
  | "published"
  | "failed"
  | "paused";

export const marketingStatusMeta: Record<
  MarketingStatus,
  { label: string; tone: BadgeTone }
> = {
  draft: { label: "Bản nháp", tone: "neutral" },
  generating: { label: "AI đang tạo", tone: "purple" },
  review: { label: "Chờ duyệt", tone: "warning" },
  approved: { label: "Đã duyệt", tone: "success" },
  scheduled: { label: "Đã lên lịch", tone: "info" },
  published: { label: "Đã đăng", tone: "success" },
  failed: { label: "Thất bại", tone: "danger" },
  paused: { label: "Tạm dừng", tone: "neutral" },
};

export interface StatusBadgeProps extends Omit<BadgeProps, "tone" | "children"> {
  status: MarketingStatus;
  label?: string;
}

export function StatusBadge({ status, label, ...props }: StatusBadgeProps) {
  const meta = marketingStatusMeta[status];
  return (
    <Badge tone={meta.tone} dot {...props}>
      {label ?? meta.label}
    </Badge>
  );
}
