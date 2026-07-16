import { sessionStore, type SessionStore } from "../auth";
import { appEnv } from "../config";
import type { AuthTokens } from "../types";
import { ApiError, normalizeApiError } from "./error";

export interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  body?: BodyInit | null;
  /** Mặc định `true`; đặt `false` cho login, register và refresh. */
  auth?: boolean;
  /** Mặc định `true`; một request chỉ được thử lại tối đa một lần. */
  retryOnUnauthorized?: boolean;
  timeoutMs?: number;
}

export interface ApiClientOptions {
  baseUrl?: string;
  timeoutMs?: number;
  refreshPath?: string;
  fetchFn?: typeof fetch;
  session?: SessionStore;
  onUnauthorized?: () => void;
}

function joinUrl(baseUrl: string, path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl.replace(/\/$/, "")}${normalizedPath}`;
}

function isAuthTokens(value: unknown): value is Partial<AuthTokens> & {
  accessToken: string;
} {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Record<string, unknown>).accessToken === "string"
  );
}

async function parseSuccess<T>(response: Response): Promise<T> {
  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      return (await response.json()) as T;
    } catch (error) {
      throw new ApiError(
        {
          code: "INVALID_RESPONSE",
          message: "Máy chủ trả về dữ liệu JSON không hợp lệ.",
        },
        response.status,
        { cause: error },
      );
    }
  }

  return (await response.text()) as T;
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly refreshPath: string;
  private readonly fetchFn: typeof fetch;
  private readonly session: SessionStore;
  private readonly onUnauthorized?: () => void;
  private refreshPromise: Promise<AuthTokens> | null = null;

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? appEnv.apiBaseUrl;
    this.timeoutMs = options.timeoutMs ?? appEnv.requestTimeoutMs;
    this.refreshPath = options.refreshPath ?? "/api/auth/refresh";
    this.fetchFn = options.fetchFn ?? fetch;
    this.session = options.session ?? sessionStore;
    this.onUnauthorized = options.onUnauthorized;
  }

  private async performRequest(
    path: string,
    init: RequestInit,
    accessToken: string | null,
    timeoutMs: number,
  ): Promise<Response> {
    const controller = new AbortController();
    const externalSignal = init.signal;
    const forwardAbort = () => controller.abort(externalSignal?.reason);

    if (externalSignal?.aborted) {
      forwardAbort();
    } else {
      externalSignal?.addEventListener("abort", forwardAbort, { once: true });
    }

    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const headers = new Headers(init.headers);
    if (!headers.has("Accept")) {
      headers.set("Accept", "application/json");
    }
    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }

    try {
      return await this.fetchFn(joinUrl(this.baseUrl, path), {
        ...init,
        headers,
        signal: controller.signal,
      });
    } catch (error) {
      throw normalizeApiError(error);
    } finally {
      clearTimeout(timeoutId);
      externalSignal?.removeEventListener("abort", forwardAbort);
    }
  }

  private async performRefresh(): Promise<AuthTokens> {
    const currentTokens = this.session.getTokens();
    if (!currentTokens?.refreshToken) {
      throw new ApiError(
        {
          code: "SESSION_EXPIRED",
          message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
        },
        401,
      );
    }

    const response = await this.performRequest(
      this.refreshPath,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: currentTokens.refreshToken }),
      },
      null,
      this.timeoutMs,
    );

    if (!response.ok) {
      throw await ApiError.fromResponse(response);
    }

    const payload = await parseSuccess<unknown>(response);
    if (!isAuthTokens(payload)) {
      throw new ApiError(
        {
          code: "INVALID_REFRESH_RESPONSE",
          message: "Máy chủ không trả về access token hợp lệ.",
        },
        response.status,
      );
    }

    const tokens: AuthTokens = {
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken ?? currentTokens.refreshToken,
      tokenType: payload.tokenType ?? currentTokens.tokenType ?? "Bearer",
      expiresIn: payload.expiresIn,
      refreshExpiresIn:
        payload.refreshExpiresIn ?? currentTokens.refreshExpiresIn,
    };
    this.session.setTokens(tokens);
    return tokens;
  }

  private refreshAccessToken(): Promise<AuthTokens> {
    if (!this.refreshPromise) {
      this.refreshPromise = this.performRefresh()
        .catch((error: unknown) => {
          this.session.clear();
          this.onUnauthorized?.();
          throw normalizeApiError(error);
        })
        .finally(() => {
          this.refreshPromise = null;
        });
    }

    return this.refreshPromise;
  }

  async request<T>(
    path: string,
    options: ApiRequestOptions = {},
  ): Promise<T> {
    const {
      auth = true,
      retryOnUnauthorized = true,
      timeoutMs = this.timeoutMs,
      ...init
    } = options;
    const usedAccessToken = auth
      ? (this.session.getTokens()?.accessToken ?? null)
      : null;

    let response = await this.performRequest(
      path,
      init,
      usedAccessToken,
      timeoutMs,
    );

    if (response.status === 401 && auth && retryOnUnauthorized) {
      const latestAccessToken = this.session.getTokens()?.accessToken ?? null;
      const retryToken =
        latestAccessToken && latestAccessToken !== usedAccessToken
          ? latestAccessToken
          : (await this.refreshAccessToken()).accessToken;

      response = await this.performRequest(path, init, retryToken, timeoutMs);
    }

    if (!response.ok) {
      if (response.status === 401 && auth) {
        this.session.clear();
        this.onUnauthorized?.();
      }
      throw await ApiError.fromResponse(response);
    }

    return parseSuccess<T>(response);
  }

  get<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: "GET" });
  }

  delete<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: "DELETE" });
  }

  post<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: "POST" });
  }

  put<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: "PUT" });
  }

  postJson<T, TBody>(
    path: string,
    body: TBody,
    options: ApiRequestOptions = {},
  ): Promise<T> {
    const headers = new Headers(options.headers);
    headers.set("Content-Type", "application/json");
    return this.post<T>(path, {
      ...options,
      headers,
      body: JSON.stringify(body),
    });
  }

  putJson<T, TBody>(
    path: string,
    body: TBody,
    options: ApiRequestOptions = {},
  ): Promise<T> {
    const headers = new Headers(options.headers);
    headers.set("Content-Type", "application/json");
    return this.put<T>(path, {
      ...options,
      headers,
      body: JSON.stringify(body),
    });
  }
}

export const apiClient = new ApiClient();
