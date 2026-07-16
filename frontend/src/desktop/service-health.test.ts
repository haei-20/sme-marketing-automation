import { describe, expect, it } from "vitest";

import { areLocalServicesReady, sortServiceHealth, type ServiceHealth } from "./service-health";

const services: ServiceHealth[] = [
  { name: "ai", status: "UP", checkedAt: "2026-07-16T00:00:00.000Z" },
  { name: "backend", status: "UP", checkedAt: "2026-07-16T00:00:00.000Z" },
  { name: "ollama", status: "UP", checkedAt: "2026-07-16T00:00:00.000Z" },
  { name: "mysql", status: "UP", checkedAt: "2026-07-16T00:00:00.000Z" },
];

describe("service health", () => {
  it("chỉ sẵn sàng khi có đủ bốn dịch vụ ở trạng thái UP", () => {
    expect(areLocalServicesReady(services)).toBe(true);
    expect(areLocalServicesReady(services.slice(1))).toBe(false);
    expect(areLocalServicesReady(services.map((service, index) => index === 0 ? { ...service, status: "DOWN" } : service))).toBe(false);
  });

  it("sắp xếp prerequisite trước sidecar", () => {
    expect(sortServiceHealth(services).map((service) => service.name)).toEqual([
      "mysql",
      "ollama",
      "backend",
      "ai",
    ]);
  });
});
