import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type HTMLAttributes,
} from "react";

import { cn } from "./utils";

export type CardVariant = "default" | "elevated" | "muted" | "interactive";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

const variants: Record<CardVariant, string> = {
  default: "border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950",
  elevated:
    "border border-slate-100 bg-white shadow-[0_12px_36px_-18px_rgba(15,23,42,0.28)] dark:border-slate-800 dark:bg-slate-950",
  muted: "border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900",
  interactive:
    "border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-950 dark:hover:border-emerald-800",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, variant = "default", ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn("rounded-2xl", variants[variant], className)}
      {...props}
    />
  );
});

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function CardHeader({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col gap-1.5 p-5 sm:p-6", className)}
        {...props}
      />
    );
  },
);
export const CardTitle = forwardRef<
  HTMLHeadingElement,
  ComponentPropsWithoutRef<"h2">
>(function CardTitle({ className, ...props }, ref) {
  return (
    <h2
      ref={ref}
      className={cn(
        "text-base font-bold tracking-tight text-slate-950 sm:text-lg dark:text-white",
        className,
      )}
      {...props}
    />
  );
});

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  ComponentPropsWithoutRef<"p">
>(function CardDescription({ className, ...props }, ref) {
  return (
    <p
      ref={ref}
      className={cn("text-sm leading-6 text-slate-500 dark:text-slate-400", className)}
      {...props}
    />
  );
});

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function CardContent({ className, ...props }, ref) {
    return <div ref={ref} className={cn("px-5 pb-5 sm:px-6 sm:pb-6", className)} {...props} />;
  },
);

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function CardFooter({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-wrap items-center gap-3 border-t border-slate-100 px-5 py-4 sm:px-6 dark:border-slate-800",
          className,
        )}
        {...props}
      />
    );
  },
);
