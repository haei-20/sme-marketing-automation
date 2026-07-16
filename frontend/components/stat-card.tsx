import { type HTMLAttributes, type ReactNode } from "react";

import { Card } from "./card";
import { Skeleton } from "./skeleton";
import { cn } from "./utils";

export type StatTrend = "up" | "down" | "neutral";

export interface StatCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title: ReactNode;
  value: ReactNode;
  icon?: ReactNode;
  description?: ReactNode;
  delta?: ReactNode;
  trend?: StatTrend;
  loading?: boolean;
}

const trendClasses: Record<StatTrend, string> = {
  up: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  down: "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  neutral: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

export function StatCard({
  title,
  value,
  icon,
  description,
  delta,
  trend = "neutral",
  loading = false,
  className,
  ...props
}: StatCardProps) {
  return (
    <Card variant="elevated" className={cn("p-5 sm:p-6", className)} {...props}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">{title}</div>
          {loading ? (
            <Skeleton className="mt-3 h-9 w-2/3" />
          ) : (
            <div className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl dark:text-white">
              {value}
            </div>
          )}
        </div>
        {icon && (
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-900" aria-hidden="true">
            {icon}
          </div>
        )}
      </div>
      {(delta || description) && (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          {delta && (
            <span className={cn("rounded-full px-2 py-1 font-bold", trendClasses[trend])}>
              {trend === "up" && <span aria-hidden="true">↑ </span>}
              {trend === "down" && <span aria-hidden="true">↓ </span>}
              {delta}
            </span>
          )}
          {description && <span className="leading-5 text-slate-500 dark:text-slate-400">{description}</span>}
        </div>
      )}
    </Card>
  );
}
