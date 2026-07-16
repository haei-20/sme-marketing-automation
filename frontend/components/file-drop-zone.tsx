"use client";

import {
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type HTMLAttributes,
  type KeyboardEvent,
} from "react";

import { cn } from "./utils";

export interface FileRejection {
  file: File;
  reason: "type" | "size" | "count";
  message: string;
}

export interface FileDropZoneProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "onDrop"> {
  accept?: string;
  maxSizeMb?: number;
  maxFiles?: number;
  multiple?: boolean;
  disabled?: boolean;
  files?: readonly File[];
  defaultFiles?: readonly File[];
  onFilesChange?: (files: File[]) => void;
  onFilesRejected?: (rejections: FileRejection[]) => void;
  label?: string;
  prompt?: string;
  helperText?: string;
  error?: string;
  showFileList?: boolean;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(bytes / (1024 * 1024))} MB`;
}

function acceptsFile(file: File, accept: string) {
  const rules = accept
    .split(",")
    .map((rule) => rule.trim().toLowerCase())
    .filter(Boolean);

  if (rules.length === 0) return true;

  const fileName = file.name.toLowerCase();
  const mime = file.type.toLowerCase();
  return rules.some((rule) => {
    if (rule.startsWith(".")) return fileName.endsWith(rule);
    if (rule.endsWith("/*")) return mime.startsWith(rule.slice(0, -1));
    return mime === rule;
  });
}

function sameFile(left: File, right: File) {
  return (
    left.name === right.name &&
    left.size === right.size &&
    left.lastModified === right.lastModified
  );
}

export function FileDropZone({
  id,
  accept = ".pdf,.doc,.docx,.txt",
  maxSizeMb = 10,
  maxFiles = 5,
  multiple = true,
  disabled = false,
  files,
  defaultFiles = [],
  onFilesChange,
  onFilesRejected,
  label = "Tải tài liệu lên",
  prompt = "Kéo thả tệp vào đây hoặc chọn từ máy tính",
  helperText,
  error,
  showFileList = true,
  className,
  ...props
}: FileDropZoneProps) {
  const reactId = useId();
  const inputId = `${id ?? `drop-zone-${reactId}`}-input`;
  const errorId = `${inputId}-error`;
  const helpId = `${inputId}-help`;
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const [internalFiles, setInternalFiles] = useState<File[]>([...defaultFiles]);
  const [internalErrors, setInternalErrors] = useState<string[]>([]);
  const currentFiles = files ? [...files] : internalFiles;
  const maxBytes = maxSizeMb * 1024 * 1024;

  function updateFiles(nextFiles: File[]) {
    if (files === undefined) setInternalFiles(nextFiles);
    onFilesChange?.(nextFiles);
  }

  function processFiles(incoming: File[]) {
    if (disabled || incoming.length === 0) return;

    const rejections: FileRejection[] = [];
    const accepted: File[] = [];

    for (const file of incoming) {
      if (!acceptsFile(file, accept)) {
        rejections.push({
          file,
          reason: "type",
          message: `${file.name}: định dạng tệp chưa được hỗ trợ.`,
        });
      } else if (file.size > maxBytes) {
        rejections.push({
          file,
          reason: "size",
          message: `${file.name}: dung lượng vượt quá ${maxSizeMb} MB.`,
        });
      } else if (
        currentFiles.some((existing) => sameFile(existing, file)) ||
        accepted.some((existing) => sameFile(existing, file))
      ) {
        rejections.push({
          file,
          reason: "count",
          message: `${file.name}: tệp đã có trong danh sách.`,
        });
      } else {
        accepted.push(file);
      }
    }

    const availableSlots = multiple
      ? Math.max(0, maxFiles - currentFiles.length)
      : 1;
    if (accepted.length > availableSlots) {
      for (const file of accepted.splice(availableSlots)) {
        rejections.push({
          file,
          reason: "count",
          message: `Chỉ được chọn tối đa ${multiple ? maxFiles : 1} tệp.`,
        });
      }
    }

    if (accepted.length > 0) {
      updateFiles(multiple ? [...currentFiles, ...accepted] : accepted.slice(0, 1));
    }

    setInternalErrors(rejections.map((item) => item.message));
    if (rejections.length > 0) onFilesRejected?.(rejections);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    processFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  }

  function handleDragEnter(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    if (disabled) return;
    dragDepth.current += 1;
    setIsDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setIsDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    dragDepth.current = 0;
    setIsDragging(false);
    processFiles(Array.from(event.dataTransfer.files));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLLabelElement>) {
    if (!disabled && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      inputRef.current?.click();
    }
  }

  function removeFile(file: File) {
    updateFiles(currentFiles.filter((item) => !sameFile(item, file)));
    setInternalErrors([]);
  }

  const hasError = Boolean(error) || internalErrors.length > 0;
  const help = helperText ?? `Hỗ trợ ${accept.replaceAll(",", ", ")} · Tối đa ${maxSizeMb} MB mỗi tệp`;

  return (
    <div id={id} className={cn("w-full", className)} {...props}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
        {multiple && (
          <span className="text-xs tabular-nums text-slate-400">
            {currentFiles.length}/{maxFiles} tệp
          </span>
        )}
      </div>
      <label
        htmlFor={inputId}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled || undefined}
        aria-describedby={hasError ? errorId : helpId}
        onKeyDown={handleKeyDown}
        onDragEnter={handleDragEnter}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "group flex min-h-48 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-8 text-center transition",
          "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/15",
          isDragging
            ? "border-emerald-500 bg-emerald-50 ring-4 ring-emerald-500/10 dark:bg-emerald-950/50"
            : "border-slate-300 bg-slate-50/60 hover:border-emerald-400 hover:bg-emerald-50/50 dark:border-slate-700 dark:bg-slate-900/60 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/30",
          hasError && "border-rose-400 bg-rose-50/40 hover:border-rose-500 dark:border-rose-800 dark:bg-rose-950/20",
          disabled && "pointer-events-none cursor-not-allowed opacity-55",
        )}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          className="sr-only"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={handleInputChange}
        />
        <span
          aria-hidden="true"
          className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-white text-xl font-bold text-emerald-700 shadow-sm ring-1 ring-slate-200 transition group-hover:-translate-y-0.5 dark:bg-slate-950 dark:text-emerald-300 dark:ring-slate-800"
        >
          ↑
        </span>
        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
          {isDragging ? "Thả tệp để thêm vào thư viện" : prompt}
        </span>
        <span id={helpId} className="mt-2 max-w-lg text-xs leading-5 text-slate-500 dark:text-slate-400">
          {help}
        </span>
      </label>

      {hasError && (
        <div id={errorId} role="alert" className="mt-2 space-y-1 text-xs font-medium text-rose-600 dark:text-rose-400">
          {error && <p>{error}</p>}
          {internalErrors.map((message, index) => <p key={`${message}-${index}`}>{message}</p>)}
        </div>
      )}

      {showFileList && currentFiles.length > 0 && (
        <ul aria-label="Tệp đã chọn" className="mt-3 space-y-2">
          {currentFiles.map((file) => (
            <li
              key={`${file.name}-${file.size}-${file.lastModified}`}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3 dark:border-slate-800 dark:bg-slate-950"
            >
              <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-bold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {file.name.split(".").pop()?.slice(0, 4) || "FILE"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{file.name}</span>
                <span className="mt-0.5 block text-xs text-slate-400">{formatFileSize(file.size)}</span>
              </span>
              <button
                type="button"
                onClick={() => removeFile(file)}
                disabled={disabled}
                aria-label={`Xóa ${file.name}`}
                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/20 disabled:pointer-events-none dark:hover:bg-rose-950"
              >
                <span aria-hidden="true">×</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
