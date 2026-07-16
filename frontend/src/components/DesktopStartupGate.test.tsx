// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ServiceHealth } from "../desktop/service-health";
import { DesktopStartupGate } from "./DesktopStartupGate";

const allServicesUp: ServiceHealth[] = ["backend", "ai", "ollama", "mysql"].map((name) => ({
  name: name as ServiceHealth["name"],
  status: "UP",
  checkedAt: "2026-07-16T00:00:00.000Z",
  message: "Sẵn sàng",
}));

function installDesktopApi(services: ServiceHealth[]) {
  Object.defineProperty(window, "smeDesktop", {
    configurable: true,
    value: {
      getAppInfo: vi.fn(),
      getRuntimeConfig: vi.fn(),
      getServiceHealth: vi.fn().mockResolvedValue(services),
      openApprovedExternalUrl: vi.fn(),
      onServiceHealthChanged: vi.fn().mockReturnValue(vi.fn()),
    } satisfies SmeDesktopApi,
  });
}

function renderGate() {
  return render(
    <MemoryRouter>
      <DesktopStartupGate><p>Không gian làm việc</p></DesktopStartupGate>
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(window, "smeDesktop");
});

describe("DesktopStartupGate", () => {
  it("không chặn renderer khi chạy ngoài Electron", () => {
    renderGate();
    expect(screen.getByText("Không gian làm việc")).toBeInTheDocument();
  });

  it("hiện Setup Assistant khi một dịch vụ local bị lỗi", async () => {
    installDesktopApi(
      allServicesUp.map((service) =>
        service.name === "ollama"
          ? { ...service, status: "DOWN", message: "Không thể kết nối tới dịch vụ local" }
          : service,
      ),
    );

    renderGate();

    expect(await screen.findByText("Chuẩn bị môi trường AI trên máy")).toBeInTheDocument();
    expect(screen.getByText("Không thể kết nối tới dịch vụ local")).toBeInTheDocument();
    expect(screen.queryByText("Không gian làm việc")).not.toBeInTheDocument();
  });

  it("mở ứng dụng khi đủ bốn dịch vụ đều sẵn sàng", async () => {
    installDesktopApi(allServicesUp);
    renderGate();
    expect(await screen.findByText("Không gian làm việc")).toBeInTheDocument();
  });
});
