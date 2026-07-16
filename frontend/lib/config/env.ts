type ViteEnvironment = Record<string, string | boolean | undefined>;

const viteEnvironment = (import.meta as ImportMeta & { readonly env?: ViteEnvironment }).env;

function publicValue(viteName: string): string | undefined {
  const viteValue = viteEnvironment?.[viteName];
  return typeof viteValue === "string" ? viteValue : undefined;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

function parsePositiveInteger(
  value: string | undefined,
  fallback: number,
): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function trimTrailingSlash(value: string): string {
  return value === "/" ? "" : value.replace(/\/+$/, "");
}

export interface AppEnvironment {
  /** Origin của Spring Boot, không bao gồm `/api`, hoặc rỗng để dùng cùng origin. */
  apiBaseUrl: string;
  /** URL WebSocket đầy đủ, ví dụ `ws://localhost:8080/ws`. */
  webSocketUrl: string;
  useMocks: boolean;
  requestTimeoutMs: number;
  reconnectDelayMs: number;
}

/**
 * Chỉ đọc biến có tiền tố VITE_ để không làm lộ bí mật phía server.
 */
export const appEnv: Readonly<AppEnvironment> = Object.freeze({
  apiBaseUrl: trimTrailingSlash(
    publicValue("VITE_API_BASE_URL") ?? "",
  ),
  webSocketUrl:
    publicValue("VITE_WS_URL") ??
    "ws://localhost:8080/ws",
  useMocks: parseBoolean(
    publicValue("VITE_USE_MOCKS"),
    true,
  ),
  requestTimeoutMs: parsePositiveInteger(
    publicValue("VITE_API_TIMEOUT_MS"),
    20_000,
  ),
  reconnectDelayMs: parsePositiveInteger(
    publicValue("VITE_WS_RECONNECT_DELAY_MS"),
    3_000,
  ),
});

export const PUBLIC_ENV_KEYS = {
  apiBaseUrl: "VITE_API_BASE_URL",
  webSocketUrl: "VITE_WS_URL",
  useMocks: "VITE_USE_MOCKS",
  requestTimeoutMs: "VITE_API_TIMEOUT_MS",
  reconnectDelayMs: "VITE_WS_RECONNECT_DELAY_MS",
} as const;
