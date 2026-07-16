import { sessionStore } from "../auth";
import { appEnv } from "../config";

export type StompHeaders = Record<string, string>;
export type RealtimeState =
  | "DISCONNECTED"
  | "CONNECTING"
  | "CONNECTED"
  | "RECONNECTING";

export interface StompFrame {
  command: string;
  headers: StompHeaders;
  body: string;
}

export interface WebSocketLike {
  readonly readyState: number;
  onopen: ((event: Event) => void) | null;
  onmessage: ((event: MessageEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onclose: ((event: CloseEvent) => void) | null;
  send(data: string): void;
  close(code?: number, reason?: string): void;
}

/** Cho phép inject SockJS hoặc socket giả khi backend/test cần fallback. */
export type WebSocketFactory = (
  url: string,
  protocols?: string | string[],
) => WebSocketLike;

export interface StompSubscription {
  id: string;
  unsubscribe(): void;
}

interface StoredSubscription {
  id: string;
  destination: string;
  headers: StompHeaders;
  listener: (frame: StompFrame) => void;
}

export interface StompClientOptions {
  url: string;
  connectHeaders?: StompHeaders | (() => StompHeaders);
  webSocketFactory?: WebSocketFactory;
  reconnectDelayMs?: number;
  connectionTimeoutMs?: number;
  heartbeatIncomingMs?: number;
  heartbeatOutgoingMs?: number;
  onStateChange?: (state: RealtimeState) => void;
  onError?: (error: Error) => void;
  debug?: (message: string) => void;
}

export class RealtimeUnavailableError extends Error {
  constructor(message = "WebSocket không khả dụng trong môi trường hiện tại.") {
    super(message);
    this.name = "RealtimeUnavailableError";
  }
}

function defaultWebSocketFactory(
  url: string,
  protocols?: string | string[],
): WebSocketLike {
  if (typeof WebSocket === "undefined") {
    throw new RealtimeUnavailableError();
  }

  return new WebSocket(url, protocols) as WebSocketLike;
}

function escapeHeader(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n")
    .replace(/:/g, "\\c");
}

function unescapeHeader(value: string): string {
  return value.replace(/\\([crn\\])/g, (_, character: string) => {
    if (character === "c") return ":";
    if (character === "r") return "\r";
    if (character === "n") return "\n";
    return "\\";
  });
}

function serializeFrame(
  command: string,
  headers: StompHeaders = {},
  body = "",
): string {
  const lines = [command];
  const shouldEscapeHeaders = command !== "CONNECT" && command !== "CONNECTED";
  for (const [key, value] of Object.entries(headers)) {
    lines.push(
      shouldEscapeHeaders
        ? `${escapeHeader(key)}:${escapeHeader(value)}`
        : `${key}:${value}`,
    );
  }
  lines.push("", body);
  return `${lines.join("\n")}\0`;
}

function parseFrame(rawFrame: string): StompFrame | null {
  const normalized = rawFrame.replace(/^\n+/, "").replace(/\r\n/g, "\n");
  if (!normalized.trim()) {
    return null;
  }

  const headerEnd = normalized.indexOf("\n\n");
  const headerBlock = headerEnd >= 0 ? normalized.slice(0, headerEnd) : normalized;
  const body = headerEnd >= 0 ? normalized.slice(headerEnd + 2) : "";
  const [command = "", ...headerLines] = headerBlock.split("\n");
  const headers: StompHeaders = {};

  for (const line of headerLines) {
    const separator = line.indexOf(":");
    if (separator < 0) continue;
    const key = unescapeHeader(line.slice(0, separator));
    const value = unescapeHeader(line.slice(separator + 1));
    if (!(key in headers)) {
      headers[key] = value;
    }
  }

  return { command, headers, body };
}

async function socketDataToText(data: unknown): Promise<string> {
  if (typeof data === "string") return data;
  if (data instanceof ArrayBuffer) return new TextDecoder().decode(data);
  if (typeof Blob !== "undefined" && data instanceof Blob) return data.text();
  return String(data ?? "");
}

function hostFromUrl(url: string): string {
  try {
    return new URL(url).host || "localhost";
  } catch {
    return "localhost";
  }
}

export class StompClient {
  private readonly options: Required<
    Pick<
      StompClientOptions,
      | "reconnectDelayMs"
      | "connectionTimeoutMs"
      | "heartbeatIncomingMs"
      | "heartbeatOutgoingMs"
    >
  > &
    StompClientOptions;
  private readonly webSocketFactory: WebSocketFactory;
  private readonly subscriptions = new Map<string, StoredSubscription>();
  private socket: WebSocketLike | null = null;
  private state: RealtimeState = "DISCONNECTED";
  private incomingBuffer = "";
  private subscriptionCounter = 0;
  private manualDisconnect = false;
  private connectPromise: Promise<void> | null = null;
  private resolveConnect: (() => void) | null = null;
  private rejectConnect: ((error: Error) => void) | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private connectionTimer: ReturnType<typeof setTimeout> | null = null;
  private outgoingHeartbeat: ReturnType<typeof setInterval> | null = null;
  private incomingHeartbeat: ReturnType<typeof setTimeout> | null = null;
  private negotiatedIncomingMs = 0;
  private lastServerActivity = 0;

  constructor(options: StompClientOptions) {
    this.options = {
      ...options,
      reconnectDelayMs: options.reconnectDelayMs ?? appEnv.reconnectDelayMs,
      connectionTimeoutMs: options.connectionTimeoutMs ?? 10_000,
      heartbeatIncomingMs: options.heartbeatIncomingMs ?? 10_000,
      heartbeatOutgoingMs: options.heartbeatOutgoingMs ?? 10_000,
    };
    this.webSocketFactory =
      options.webSocketFactory ?? defaultWebSocketFactory;
  }

  get connectionState(): RealtimeState {
    return this.state;
  }

  get connected(): boolean {
    return this.state === "CONNECTED";
  }

  private setState(state: RealtimeState): void {
    if (this.state === state) return;
    this.state = state;
    this.options.onStateChange?.(state);
    this.options.debug?.(`STOMP state: ${state}`);
  }

  private clearTimers(): void {
    if (this.connectionTimer) clearTimeout(this.connectionTimer);
    if (this.outgoingHeartbeat) clearInterval(this.outgoingHeartbeat);
    if (this.incomingHeartbeat) clearTimeout(this.incomingHeartbeat);
    this.connectionTimer = null;
    this.outgoingHeartbeat = null;
    this.incomingHeartbeat = null;
  }

  private sendFrame(
    command: string,
    headers: StompHeaders = {},
    body = "",
  ): void {
    if (!this.socket || this.socket.readyState !== 1) {
      throw new RealtimeUnavailableError("Kết nối WebSocket chưa sẵn sàng.");
    }
    this.socket.send(serializeFrame(command, headers, body));
  }

  private connectHeaders(): StompHeaders {
    const configured = this.options.connectHeaders;
    return typeof configured === "function" ? configured() : (configured ?? {});
  }

  private openSocket(): void {
    try {
      const socket = this.webSocketFactory(this.options.url, "v12.stomp");
      this.socket = socket;
      socket.onopen = () => {
        this.sendFrame("CONNECT", {
          "accept-version": "1.2",
          host: hostFromUrl(this.options.url),
          "heart-beat": `${this.options.heartbeatOutgoingMs},${this.options.heartbeatIncomingMs}`,
          ...this.connectHeaders(),
        });
      };
      socket.onmessage = (event) => {
        void socketDataToText(event.data)
          .then((data) => this.receive(data))
          .catch((error: unknown) => {
            this.options.onError?.(
              error instanceof Error
                ? error
                : new Error("Không thể đọc gói WebSocket."),
            );
          });
      };
      socket.onerror = () => {
        this.options.onError?.(
          new RealtimeUnavailableError("Kết nối WebSocket gặp lỗi."),
        );
      };
      socket.onclose = (event) => this.handleClose(event);

      this.connectionTimer = setTimeout(() => {
        const error = new RealtimeUnavailableError(
          "Quá thời gian chờ kết nối WebSocket.",
        );
        this.rejectPendingConnect(error);
        socket.close(4000, "Connection timeout");
      }, this.options.connectionTimeoutMs);
    } catch (error) {
      const normalized =
        error instanceof Error ? error : new RealtimeUnavailableError();
      this.rejectPendingConnect(normalized);
      this.setState("DISCONNECTED");
      this.scheduleReconnect();
    }
  }

  connect(): Promise<void> {
    if (this.connected) return Promise.resolve();
    if (this.connectPromise) return this.connectPromise;

    this.manualDisconnect = false;
    this.setState(this.state === "RECONNECTING" ? "RECONNECTING" : "CONNECTING");
    const pendingConnect = new Promise<void>((resolve, reject) => {
      this.resolveConnect = resolve;
      this.rejectConnect = reject;
    });
    this.connectPromise = pendingConnect;
    this.openSocket();
    return pendingConnect;
  }

  disconnect(): void {
    this.manualDisconnect = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    this.clearTimers();

    if (this.socket?.readyState === 1) {
      try {
        this.sendFrame("DISCONNECT");
      } finally {
        this.socket.close(1000, "Client disconnect");
      }
    } else {
      this.socket?.close();
    }

    this.socket = null;
    this.rejectPendingConnect(
      new RealtimeUnavailableError("Kết nối đã được đóng bởi người dùng."),
    );
    this.setState("DISCONNECTED");
  }

  subscribe(
    destination: string,
    listener: (frame: StompFrame) => void,
    headers: StompHeaders = {},
  ): StompSubscription {
    const id = `sub-${++this.subscriptionCounter}`;
    const stored = { id, destination, listener, headers };
    this.subscriptions.set(id, stored);
    if (this.connected) this.sendSubscription(stored);

    return {
      id,
      unsubscribe: () => {
        if (!this.subscriptions.delete(id)) return;
        if (this.connected) this.sendFrame("UNSUBSCRIBE", { id });
      },
    };
  }

  publish(
    destination: string,
    body: string,
    headers: StompHeaders = {},
  ): void {
    this.sendFrame("SEND", {
      destination,
      "content-type": "application/json;charset=UTF-8",
      ...headers,
    }, body);
  }

  private sendSubscription(subscription: StoredSubscription): void {
    this.sendFrame("SUBSCRIBE", {
      id: subscription.id,
      destination: subscription.destination,
      ack: "auto",
      ...subscription.headers,
    });
  }

  private receive(data: string): void {
    this.lastServerActivity = Date.now();
    this.incomingBuffer += data;
    let frameEnd = this.incomingBuffer.indexOf("\0");

    while (frameEnd >= 0) {
      const rawFrame = this.incomingBuffer.slice(0, frameEnd);
      this.incomingBuffer = this.incomingBuffer.slice(frameEnd + 1);
      const frame = parseFrame(rawFrame);
      if (frame) this.handleFrame(frame);
      frameEnd = this.incomingBuffer.indexOf("\0");
    }

    if (/^\n+$/.test(this.incomingBuffer)) this.incomingBuffer = "";
  }

  private handleFrame(frame: StompFrame): void {
    this.options.debug?.(`STOMP <= ${frame.command}`);

    if (frame.command === "CONNECTED") {
      if (this.connectionTimer) clearTimeout(this.connectionTimer);
      this.connectionTimer = null;
      this.setState("CONNECTED");
      this.startHeartbeats(frame.headers["heart-beat"]);
      for (const subscription of this.subscriptions.values()) {
        this.sendSubscription(subscription);
      }
      this.resolveConnect?.();
      this.resolveConnect = null;
      this.rejectConnect = null;
      this.connectPromise = null;
      return;
    }

    if (frame.command === "MESSAGE") {
      const subscriptionId = frame.headers.subscription;
      try {
        this.subscriptions.get(subscriptionId)?.listener(frame);
      } catch (error) {
        this.options.onError?.(
          error instanceof Error ? error : new Error("Lỗi xử lý gói STOMP."),
        );
      }
      return;
    }

    if (frame.command === "ERROR") {
      const error = new Error(
        frame.headers.message || frame.body || "STOMP server error",
      );
      error.name = "StompServerError";
      this.options.onError?.(error);
      this.rejectPendingConnect(error);
      this.socket?.close(4001, "STOMP error");
    }
  }

  private startHeartbeats(serverHeartbeat = "0,0"): void {
    const [serverOutgoing = 0, serverIncoming = 0] = serverHeartbeat
      .split(",")
      .map(Number);
    const outgoingMs =
      this.options.heartbeatOutgoingMs === 0 || serverIncoming === 0
        ? 0
        : Math.max(this.options.heartbeatOutgoingMs, serverIncoming);
    this.negotiatedIncomingMs =
      this.options.heartbeatIncomingMs === 0 || serverOutgoing === 0
        ? 0
        : Math.max(this.options.heartbeatIncomingMs, serverOutgoing);
    this.lastServerActivity = Date.now();

    if (outgoingMs > 0) {
      this.outgoingHeartbeat = setInterval(() => {
        if (this.socket?.readyState === 1) this.socket.send("\n");
      }, outgoingMs);
    }
    if (this.negotiatedIncomingMs > 0) this.watchIncomingHeartbeat();
  }

  private watchIncomingHeartbeat(): void {
    this.incomingHeartbeat = setTimeout(() => {
      const toleratedDelay = this.negotiatedIncomingMs * 2;
      if (Date.now() - this.lastServerActivity > toleratedDelay) {
        this.options.onError?.(
          new RealtimeUnavailableError("Mất heartbeat từ máy chủ."),
        );
        this.socket?.close(4002, "Heartbeat timeout");
        return;
      }
      this.watchIncomingHeartbeat();
    }, this.negotiatedIncomingMs);
  }

  private rejectPendingConnect(error: Error): void {
    this.rejectConnect?.(error);
    this.resolveConnect = null;
    this.rejectConnect = null;
    this.connectPromise = null;
  }

  private handleClose(event: CloseEvent): void {
    this.options.debug?.(`WebSocket closed: ${event.code} ${event.reason}`);
    this.clearTimers();
    this.socket = null;
    this.incomingBuffer = "";
    this.rejectPendingConnect(
      new RealtimeUnavailableError("Kết nối WebSocket đã bị đóng."),
    );
    this.setState("DISCONNECTED");
    if (!this.manualDisconnect) this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    if (this.manualDisconnect || this.reconnectTimer) return;
    this.setState("RECONNECTING");
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.connect().catch((error: unknown) => {
        this.options.onError?.(
          error instanceof Error ? error : new RealtimeUnavailableError(),
        );
      });
    }, this.options.reconnectDelayMs);
  }
}

export type GenerationStreamEventType = "TOKEN" | "COMPLETED" | "ERROR";

export interface GenerationStreamEvent {
  jobId: string;
  type: GenerationStreamEventType;
  token?: string;
  content?: string;
  message?: string;
}

function generationEventFromFrame(
  frame: StompFrame,
  jobId: string,
): GenerationStreamEvent {
  try {
    const payload = JSON.parse(frame.body) as Record<string, unknown>;
    const rawType = String(payload.type ?? payload.status ?? "TOKEN").toUpperCase();
    const type: GenerationStreamEventType = ["DONE", "COMPLETE", "COMPLETED"].includes(
      rawType,
    )
      ? "COMPLETED"
      : rawType === "ERROR" || rawType === "FAILED"
        ? "ERROR"
        : "TOKEN";

    return {
      jobId: String(payload.jobId ?? payload.job_id ?? jobId),
      type,
      token:
        typeof payload.token === "string"
          ? payload.token
          : typeof payload.delta === "string"
            ? payload.delta
            : undefined,
      content: typeof payload.content === "string" ? payload.content : undefined,
      message: typeof payload.message === "string" ? payload.message : undefined,
    };
  } catch {
    return { jobId, type: "TOKEN", token: frame.body };
  }
}

export function subscribeToGeneration(
  client: StompClient,
  jobId: string,
  listener: (event: GenerationStreamEvent) => void,
): StompSubscription {
  return client.subscribe(`/topic/generate/${jobId}`, (frame) => {
    listener(generationEventFromFrame(frame, jobId));
  });
}

export function createAppStompClient(
  options: Omit<StompClientOptions, "url" | "connectHeaders"> & {
    url?: string;
    connectHeaders?: StompClientOptions["connectHeaders"];
  } = {},
): StompClient {
  return new StompClient({
    ...options,
    url: options.url ?? appEnv.webSocketUrl,
    connectHeaders:
      options.connectHeaders ??
      (() => {
        const accessToken = sessionStore.getTokens()?.accessToken;
        const headers: StompHeaders = {};
        if (accessToken) {
          headers.Authorization = `Bearer ${accessToken}`;
        }
        return headers;
      }),
  });
}
