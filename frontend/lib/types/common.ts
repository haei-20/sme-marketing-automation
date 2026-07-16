export type EntityId = number;

/** Chuỗi ngày theo ISO-8601, ví dụ `2026-07-15`. */
export type ISODate = string;

/** Chuỗi ngày giờ theo ISO-8601, ví dụ `2026-07-15T09:30:00+07:00`. */
export type ISODateTime = string;

export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { [key: string]: JsonValue };
