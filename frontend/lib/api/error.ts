import type { ApiErrorPayload } from "../types";

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(
    payload: ApiErrorPayload,
    status = 0,
    options?: ErrorOptions,
  ) {
    super(payload.message, options);
    this.name = "ApiError";
    this.code = payload.code;
    this.status = status;
    this.details = payload.details;
  }

  static async fromResponse(response: Response): Promise<ApiError> {
    let payload: Partial<ApiErrorPayload> | undefined;

    try {
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        payload = (await response.json()) as Partial<ApiErrorPayload>;
      } else {
        const message = await response.text();
        payload = message ? { message } : undefined;
      }
    } catch {
      payload = undefined;
    }

    return new ApiError(
      {
        code: payload?.code ?? `HTTP_${response.status}`,
        message:
          (payload?.message ?? response.statusText) ||
          "Yêu cầu không thể hoàn tất.",
        details: payload?.details,
      },
      response.status,
    );
  }
}

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (
    typeof DOMException !== "undefined" &&
    error instanceof DOMException &&
    error.name === "AbortError"
  ) {
    return new ApiError(
      {
        code: "REQUEST_ABORTED",
        message: "Yêu cầu đã bị hủy hoặc hết thời gian chờ.",
      },
      0,
      { cause: error },
    );
  }

  return new ApiError(
    {
      code: "NETWORK_ERROR",
      message:
        "Không thể kết nối tới máy chủ. Vui lòng kiểm tra mạng và thử lại.",
      details: error instanceof Error ? error.message : undefined,
    },
    0,
    { cause: error },
  );
}
