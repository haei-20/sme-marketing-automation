import type { AuthSession, AuthTokens, User } from "../types";

const DEFAULT_SESSION_KEY = "sme-marketing.auth-session.v1";
const SESSION_VERSION = 1;

interface StoredSession {
  version: typeof SESSION_VERSION;
  savedAt: string;
  session: AuthSession;
}

export interface SessionStore {
  getSession(): AuthSession | null;
  setSession(session: AuthSession): void;
  getTokens(): AuthTokens | null;
  setTokens(tokens: AuthTokens): void;
  clear(): void;
  subscribe(listener: (session: AuthSession | null) => void): () => void;
}

export interface SessionStoreOptions {
  storageKey?: string;
  /** Có thể truyền storage giả khi test; mặc định là `window.sessionStorage`. */
  storage?: () => Storage | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isUser(value: unknown): value is User {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.email === "string" &&
    typeof value.fullName === "string" &&
    ["OWNER", "ADMIN", "EDITOR"].includes(String(value.role)) &&
    typeof value.businessId === "number"
  );
}

function isTokens(value: unknown): value is AuthTokens {
  return (
    isRecord(value) &&
    typeof value.accessToken === "string" &&
    typeof value.refreshToken === "string" &&
    typeof value.tokenType === "string"
  );
}

function isStoredSession(value: unknown): value is StoredSession {
  return (
    isRecord(value) &&
    value.version === SESSION_VERSION &&
    isRecord(value.session) &&
    isUser(value.session.user) &&
    isTokens(value.session.tokens)
  );
}

function browserSessionStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.sessionStorage;
  } catch {
    // Trình duyệt có thể chặn storage trong chế độ riêng tư hoặc iframe.
    return null;
  }
}

export function createSessionStore(
  options: SessionStoreOptions = {},
): SessionStore {
  const storageKey = options.storageKey ?? DEFAULT_SESSION_KEY;
  const resolveStorage = options.storage ?? browserSessionStorage;
  const listeners = new Set<(session: AuthSession | null) => void>();

  const read = (): AuthSession | null => {
    try {
      const raw = resolveStorage()?.getItem(storageKey);
      if (!raw) {
        return null;
      }

      const parsed: unknown = JSON.parse(raw);
      if (!isStoredSession(parsed)) {
        resolveStorage()?.removeItem(storageKey);
        return null;
      }

      return parsed.session;
    } catch {
      return null;
    }
  };

  const notify = (session: AuthSession | null) => {
    for (const listener of listeners) {
      listener(session);
    }
  };

  const write = (session: AuthSession): void => {
    const stored: StoredSession = {
      version: SESSION_VERSION,
      savedAt: new Date().toISOString(),
      session,
    };

    try {
      resolveStorage()?.setItem(storageKey, JSON.stringify(stored));
    } catch {
      // Không làm ứng dụng crash khi browser chặn hoặc đầy sessionStorage.
    }
    notify(session);
  };

  return {
    getSession: read,
    setSession: write,
    getTokens() {
      return read()?.tokens ?? null;
    },
    setTokens(tokens) {
      const current = read();
      if (!current) {
        return;
      }

      write({ ...current, tokens });
    },
    clear() {
      try {
        resolveStorage()?.removeItem(storageKey);
      } catch {
        // Giữ thao tác đăng xuất an toàn ngay cả khi storage không khả dụng.
      }
      notify(null);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/**
 * Ở SSR adapter trả về `null` và không lưu gì, do đó không có state người dùng
 * dùng chung giữa các request. Ở browser dữ liệu chỉ sống trong tab hiện tại.
 */
export const sessionStore = createSessionStore();
