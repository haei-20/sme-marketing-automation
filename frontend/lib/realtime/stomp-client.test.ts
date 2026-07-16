import { describe, expect, it } from "vitest";
import {
  StompClient,
  subscribeToGeneration,
  type GenerationStreamEvent,
  type WebSocketLike,
} from "./stomp-client";

class FakeWebSocket implements WebSocketLike {
  readyState = 0;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  readonly sent: string[] = [];

  open(): void {
    this.readyState = 1;
    this.onopen?.({} as Event);
  }

  message(data: string): void {
    this.onmessage?.({ data } as MessageEvent);
  }

  send(data: string): void {
    this.sent.push(data);
  }

  close(code = 1000, reason = ""): void {
    this.readyState = 3;
    this.onclose?.({ code, reason } as CloseEvent);
  }
}

describe("StompClient", () => {
  it("kết nối STOMP 1.2 và đọc stream sinh nội dung", async () => {
    const socket = new FakeWebSocket();
    const client = new StompClient({
      url: "ws://localhost:8080/ws",
      webSocketFactory: () => socket,
      reconnectDelayMs: 60_000,
      heartbeatIncomingMs: 10_000,
      heartbeatOutgoingMs: 10_000,
    });
    const received: GenerationStreamEvent[] = [];
    const connected = client.connect();

    socket.open();
    expect(socket.sent[0]).toContain("host:localhost:8080");
    expect(socket.sent[0]).not.toContain("localhost\\c8080");
    socket.message("CONNECTED\nversion:1.2\nheart-beat:0,0\n\n\0");
    await connected;

    const subscription = subscribeToGeneration(client, "job-123", (event) => {
      received.push(event);
    });
    expect(socket.sent.at(-1)).toContain("destination:/topic/generate/job-123");

    socket.message(
      `MESSAGE\nsubscription:${subscription.id}\ndestination:/topic/generate/job-123\n\n` +
        `${JSON.stringify({ type: "TOKEN", token: "Xin chào" })}\0`,
    );
    await Promise.resolve();

    expect(received).toEqual([
      { jobId: "job-123", type: "TOKEN", token: "Xin chào" },
    ]);
    client.disconnect();
    expect(client.connectionState).toBe("DISCONNECTED");
  });
});
