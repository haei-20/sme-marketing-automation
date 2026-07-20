// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DesktopDiagnosticsPanel } from "./DesktopDiagnosticsPanel";

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(window, "smeDesktop");
});

describe("DesktopDiagnosticsPanel", () => {
  it("hiển thị version và log đã được Electron lọc", async () => {
    Object.defineProperty(window, "smeDesktop", {
      configurable: true,
      value: {
        getAppInfo: vi.fn(),
        getDiagnostics: vi.fn().mockResolvedValue({
          generatedAt: "2026-07-20T00:00:00.000Z",
          app: { name: "SMEFlow AI", version: "0.1.0", platform: "win32", packaged: true },
          services: [],
          logFileName: "desktop.log",
          recentLogs: [{
            timestamp: "2026-07-20T00:00:00.000Z",
            level: "WARN",
            event: "service_status_changed",
            message: "Ollama: UP -> DOWN; token=[REDACTED]",
          }],
        }),
        getRuntimeConfig: vi.fn(),
        getServiceHealth: vi.fn(),
        openApprovedExternalUrl: vi.fn(),
        onServiceHealthChanged: vi.fn().mockReturnValue(vi.fn()),
      } satisfies SmeDesktopApi,
    });

    render(<DesktopDiagnosticsPanel />);

    expect(await screen.findByText("0.1.0")).toBeInTheDocument();
    expect(screen.getByText("desktop.log")).toBeInTheDocument();
    expect(screen.getByText(/token=\[REDACTED\]/)).toBeInTheDocument();
  });
});
