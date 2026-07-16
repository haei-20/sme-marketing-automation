import { type HTMLAttributes, type ReactNode } from "react";

import { cn } from "./utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps extends HTMLAttributes<HTMLElement> {
  title: string;
  description?: string;
  eyebrow?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
  meta?: ReactNode;
}

export function PageHeader({
  title,
  description,
  eyebrow,
  breadcrumbs,
  actions,
  meta,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <header className={cn("w-full", className)} {...props}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Điều hướng phân cấp" className="mb-4 overflow-x-auto">
          <ol className="flex min-w-max items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            {breadcrumbs.map((item, index) => {
              const isCurrent = index === breadcrumbs.length - 1;
              return (
                <li key={`${item.label}-${index}`} className="flex items-center gap-2">
                  {index > 0 && <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">/</span>}
                  {item.href && !isCurrent ? (
                    <a className="rounded hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 dark:hover:text-emerald-300" href={item.href}>
                      {item.label}
                    </a>
                  ) : (
                    <span aria-current={isCurrent ? "page" : undefined} className={isCurrent ? "text-slate-700 dark:text-slate-200" : undefined}>
                      {item.label}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      )}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 max-w-3xl">
          {eyebrow && (
            <div className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-400">
              {eyebrow}
            </div>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl dark:text-white">
            {title}
          </h1>
          {description && (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base dark:text-slate-400">
              {description}
            </p>
          )}
          {meta && <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div>}
        </div>
        {actions && (
          <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
