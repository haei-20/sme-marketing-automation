import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

import { cn } from "./utils";

type FieldSize = "sm" | "md" | "lg";

interface FieldChromeProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  fieldId: string;
  hintId: string;
  errorId: string;
  children: ReactNode;
  className?: string;
}

function FieldChrome({
  label,
  hint,
  error,
  required,
  fieldId,
  hintId,
  errorId,
  children,
  className,
}: FieldChromeProps) {
  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label htmlFor={fieldId} className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
          {label}
          {required && <span className="ml-1 text-rose-600" aria-hidden="true">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p id={errorId} role="alert" className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="mt-1.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

const fieldSizes: Record<FieldSize, string> = {
  sm: "min-h-9 px-3 py-1.5 text-sm",
  md: "min-h-11 px-3.5 py-2.5 text-sm",
  lg: "min-h-12 px-4 py-3 text-base",
};

const fieldBase =
  "w-full rounded-xl border bg-white text-slate-950 outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-600 dark:disabled:bg-slate-900";

function describedBy(
  error: string | undefined,
  hint: string | undefined,
  errorId: string,
  hintId: string,
  external?: string,
) {
  return [external, error ? errorId : undefined, !error && hint ? hintId : undefined]
    .filter(Boolean)
    .join(" ") || undefined;
}

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "prefix"> {
  label?: string;
  hint?: string;
  error?: string;
  fieldSize?: FieldSize;
  leading?: ReactNode;
  trailing?: ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    id,
    label,
    hint,
    error,
    fieldSize = "md",
    leading,
    trailing,
    containerClassName,
    className,
    required,
    "aria-describedby": ariaDescribedBy,
    ...props
  },
  ref,
) {
  const reactId = useId();
  const fieldId = id ?? `input-${reactId}`;
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;

  return (
    <FieldChrome
      label={label}
      hint={hint}
      error={error}
      required={required}
      fieldId={fieldId}
      hintId={hintId}
      errorId={errorId}
      className={containerClassName}
    >
      <div className="relative">
        {leading && (
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400" aria-hidden="true">
            {leading}
          </span>
        )}
        <input
          ref={ref}
          id={fieldId}
          required={required}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={describedBy(error, hint, errorId, hintId, ariaDescribedBy)}
          className={cn(
            fieldBase,
            fieldSizes[fieldSize],
            error
              ? "border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
              : "border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700",
            Boolean(leading) && "pl-10",
            Boolean(trailing) && "pr-10",
            className,
          )}
          {...props}
        />
        {trailing && (
          <span className="absolute inset-y-0 right-3.5 flex items-center text-slate-400">
            {trailing}
          </span>
        )}
      </div>
    </FieldChrome>
  );
});

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  fieldSize?: FieldSize;
  containerClassName?: string;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    id,
    label,
    hint,
    error,
    fieldSize = "md",
    containerClassName,
    className,
    placeholder,
    required,
    children,
    "aria-describedby": ariaDescribedBy,
    ...props
  },
  ref,
) {
  const reactId = useId();
  const fieldId = id ?? `select-${reactId}`;
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;

  return (
    <FieldChrome
      label={label}
      hint={hint}
      error={error}
      required={required}
      fieldId={fieldId}
      hintId={hintId}
      errorId={errorId}
      className={containerClassName}
    >
      <select
        ref={ref}
        id={fieldId}
        required={required}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy(error, hint, errorId, hintId, ariaDescribedBy)}
        className={cn(
          fieldBase,
          fieldSizes[fieldSize],
          "appearance-auto pr-9",
          error
            ? "border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
            : "border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700",
          className,
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {children}
      </select>
    </FieldChrome>
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  fieldSize?: FieldSize;
  containerClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    id,
    label,
    hint,
    error,
    fieldSize = "md",
    containerClassName,
    className,
    required,
    rows = 4,
    "aria-describedby": ariaDescribedBy,
    ...props
  },
  ref,
) {
  const reactId = useId();
  const fieldId = id ?? `textarea-${reactId}`;
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;

  return (
    <FieldChrome
      label={label}
      hint={hint}
      error={error}
      required={required}
      fieldId={fieldId}
      hintId={hintId}
      errorId={errorId}
      className={containerClassName}
    >
      <textarea
        ref={ref}
        id={fieldId}
        required={required}
        rows={rows}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy(error, hint, errorId, hintId, ariaDescribedBy)}
        className={cn(
          fieldBase,
          fieldSizes[fieldSize],
          "resize-y leading-6",
          error
            ? "border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
            : "border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700",
          className,
        )}
        {...props}
      />
    </FieldChrome>
  );
});
