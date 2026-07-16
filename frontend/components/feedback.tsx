import { type HTMLAttributes, type ReactNode } from "react";

import { cn } from "./utils";

export type FeedbackTone = "info" | "success" | "warning" | "danger";

const feedbackClasses: Record<FeedbackTone, string> = {
  info: "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-100",
  success: "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
  warning: "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100",
  danger: "border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-100",
};

const markerClasses: Record<FeedbackTone, string> = {
  info: "bg-sky-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
};

export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
  description?: ReactNode;
  tone?: FeedbackTone;
  actions?: ReactNode;
  onDismiss?: () => void;
}

export function Alert({
  title,
  description,
  tone = "info",
  actions,
  onDismiss,
  className,
  children,
  ...props
}: AlertProps) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn("relative flex gap-3 rounded-2xl border p-4 pr-11", feedbackClasses[tone], className)}
      {...props}
    >
      <span aria-hidden="true" className={cn("mt-1.5 size-2 shrink-0 rounded-full", markerClasses[tone])} />
      <div className="min-w-0 flex-1">
        {title && <div className="text-sm font-bold">{title}</div>}
        {description && <div className="mt-1 text-sm leading-6 opacity-80">{description}</div>}
        {children}
        {actions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Đóng thông báo"
          className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-lg text-lg leading-none opacity-60 transition hover:bg-black/5 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/30 dark:hover:bg-white/10"
        >
          <span aria-hidden="true">×</span>
        </button>
      )}
    </div>
  );
}
export interface ToastProps extends Omit<HTMLAttributes<HTMLLIElement>, "title"> {
  title: ReactNode;
  description?: ReactNode;
  tone?: FeedbackTone;
  action?: ReactNode;
  onDismiss?: () => void;
}

export function Toast({
  title,
  description,
  tone = "info",
  action,
  onDismiss,
  className,
  ...props
}: ToastProps) {
  return (
    <li
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-2xl border bg-white p-4 pr-11 text-slate-950 shadow-[0_18px_50px_-16px_rgba(15,23,42,0.35)] dark:bg-slate-950 dark:text-white",
        tone === "info" && "border-sky-200 dark:border-sky-900",
        tone === "success" && "border-emerald-200 dark:border-emerald-900",
        tone === "warning" && "border-amber-200 dark:border-amber-900",
        tone === "danger" && "border-rose-200 dark:border-rose-900",
        className,
      )}
      {...props}
    >
      <span className={cn("absolute inset-y-0 left-0 w-1", markerClasses[tone])} aria-hidden="true" />
      <div className="text-sm font-bold">{title}</div>
      {description && <div className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">{description}</div>}
      {action && <div className="mt-3">{action}</div>}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Đóng thông báo"
          className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-lg text-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <span aria-hidden="true">×</span>
        </button>
      )}
    </li>
  );
}

export function ToastViewport({ className, ...props }: HTMLAttributes<HTMLOListElement>) {
  return (
    <ol
      aria-label="Thông báo"
      className={cn("pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-end gap-3 sm:left-auto sm:w-full sm:max-w-sm", className)}
      {...props}
    />
  );
}
