import { describe, expect, it } from "vitest";
import type { SessionStore } from "../auth";
import type { AuthSession, AuthTokens } from "../types";
import { ApiClient } from "./client";

function createMemorySession(): SessionStore {
  let current: AuthSession | null = {
    user: {
      id: 4,
      email: "nguyen@example.com",
      fullName: "Nguyễn Minh Nguyên",
      role: "ADMIN",
      businessId: 12,
    },
    tokens: {
      accessToken: "expired-token",
      refreshToken: "refresh-token",
      tokenType: "Bearer",
    },
  };

  return {
    getSession: () => current,
    setSession: (session) => {
      current = session;
    },
    getTokens: () => current?.tokens ?? null,
    setTokens: (tokens: AuthTokens) => {
      if (current) current = { ...current, tokens };
    },
    clear: () => {
      current = null;
    },
    subscribe: () => () => undefined,
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("ApiClient", () => {
  it("chỉ gọi refresh một lần khi nhiều request cùng nhận 401", async () => {
    const session = createMemorySession();
    let refreshCalls = 0;
    const fetchFn: typeof fetch = async (input, init) => {
      const url = String(input);
      if (url.endsWith("/api/auth/refresh")) {
        refreshCalls += 1;
        await new Promise((resolve) => setTimeout(resolve, 5));
        return jsonResponse({
          accessToken: "new-access-token",
          refreshToken: "new-refresh-token",
          tokenType: "Bearer",
        });
      }

      const authorization = new Headers(init?.headers).get("Authorization");
      return authorization === "Bearer new-access-token"
        ? jsonResponse({ ok: true })
        : jsonResponse(
            { code: "TOKEN_EXPIRED", message: "Access token đã hết hạn" },
            401,
          );
    };
    const client = new ApiClient({
      baseUrl: "https://api.example.test",
      fetchFn,
      session,
    });

    const results = await Promise.all([
      client.get<{ ok: boolean }>("/api/posts"),
      client.get<{ ok: boolean }>("/api/campaigns"),
      client.get<{ ok: boolean }>("/api/kb"),
    ]);

    expect(results.every((result) => result.ok)).toBe(true);
    expect(refreshCalls).toBe(1);
    expect(session.getTokens()?.accessToken).toBe("new-access-token");
  });

  it("chuẩn hóa payload lỗi của backend thành ApiError", async () => {
    const client = new ApiClient({
      baseUrl: "https://api.example.test",
      session: createMemorySession(),
      fetchFn: async () =>
        jsonResponse(
          {
            code: "VALIDATION_ERROR",
            message: "Ngày kết thúc phải sau ngày bắt đầu",
            details: { field: "endDate" },
          },
          400,
        ),
    });

    await expect(
      client.postJson("/api/campaigns", { title: "Chiến dịch" }),
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      status: 400,
      details: { field: "endDate" },
    });
  });
});
