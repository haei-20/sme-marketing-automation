export type ClassValue = string | false | null | undefined;

/**
 * Ghép className mà không cần thêm dependency như clsx.
 */
export function cn(...classes: ClassValue[]) {
  return classes.filter(Boolean).join(" ");
}
