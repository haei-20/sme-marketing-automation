import { net } from "electron";

import type {
  LocalServiceName,
  ServiceHealth,
} from "./contracts";

const HEALTH_TARGETS: ReadonlyArray<{
  name: LocalServiceName;
  url: string;
}> = [
  {
    name: "backend",
    url:
      process.env.SME_BACKEND_HEALTH_URL ??
      "http://127.0.0.1:8080/actuator/health",
  },
  {
    name: "ai",
    url: process.env.SME_AI_HEALTH_URL ?? "http://127.0.0.1:8000/health",
  },
  {
    name: "ollama",
    url: process.env.SME_OLLAMA_HEALTH_URL ?? "http://127.0.0.1:11434/api/tags",
  },
];

async function checkTarget(
  target: (typeof HEALTH_TARGETS)[number],
): Promise<ServiceHealth> {
  const checkedAt = new Date().toISOString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1_500);

  try {
    const response = await net.fetch(target.url, {
      method: "GET",
      signal: controller.signal,
    });

    return {
      name: target.name,
      status: response.ok ? "UP" : "DOWN",
      checkedAt,
      message: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      name: target.name,
      status: "DOWN",
      checkedAt,
      message: error instanceof Error ? error.message : "Không thể kết nối",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function checkLocalServices(): Promise<ServiceHealth[]> {
  return Promise.all(HEALTH_TARGETS.map(checkTarget));
}
