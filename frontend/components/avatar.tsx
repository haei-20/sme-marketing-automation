"use client";

import { type HTMLAttributes } from "react";

import { cn } from "./utils";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface AvatarProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  name: string;
  src?: string;
  size?: AvatarSize;
  status?: "online" | "offline" | "busy";
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: "size-6 text-[9px]",
  sm: "size-8 text-[10px]",
  md: "size-10 text-xs",
  lg: "size-12 text-sm",
  xl: "size-16 text-lg",
};

const imageSizes: Record<AvatarSize, string> = {
  xs: "24px",
  sm: "32px",
  md: "40px",
  lg: "48px",
  xl: "64px",
};

const statusClasses = {
  online: "bg-emerald-500",
  offline: "bg-slate-400",
  busy: "bg-rose-500",
};

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => Array.from(part)[0]?.toLocaleUpperCase("vi-VN"))
    .join("") || "?";
}

export function Avatar({
  name,
  src,
  size = "md",
  status,
  className,
  ...props
}: AvatarProps) {
  return (
    <span
      role="img"
      aria-label={name}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-800 ring-2 ring-white dark:bg-emerald-950 dark:text-emerald-200 dark:ring-slate-950",
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      <span aria-hidden="true">{initials(name)}</span>
      {src && (
        <img
          src={src}
          alt=""
          width={Number.parseInt(imageSizes[size], 10)}
          height={Number.parseInt(imageSizes[size], 10)}
          className="absolute inset-0 size-full rounded-full object-cover"
          onError={(event) => event.currentTarget.remove()}
        />
      )}
      {status && (
        <span
          aria-label={status === "online" ? "Đang hoạt động" : status === "busy" ? "Đang bận" : "Ngoại tuyến"}
          className={cn(
            "absolute bottom-0 right-0 size-[28%] min-h-2 min-w-2 rounded-full ring-2 ring-white dark:ring-slate-950",
            statusClasses[status],
          )}
        />
      )}
    </span>
  );
}
