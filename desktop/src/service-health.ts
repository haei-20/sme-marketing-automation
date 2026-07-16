import { net } from "electron";
import { createConnection } from "node:net";

import type {
  LocalServiceName,
  ServiceHealth,
} from "./contracts";

const HEALTH_TARGETS: ReadonlyArray<{
  name: Exclude<LocalServiceName, "mysql">;
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
      message: response.ok ? "Sẵn sàng" : `Phản hồi HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      name: target.name,
      status: "DOWN",
      checkedAt,
      message:
        error instanceof Error && error.name === "AbortError"
          ? "Quá thời gian chờ phản hồi"
          : "Không thể kết nối tới dịch vụ local",
    };
  } finally {
    clearTimeout(timeout);
  }
}

function getMysqlPort(): number {
  const value = Number.parseInt(process.env.SME_MYSQL_PORT ?? "3306", 10);
  return Number.isInteger(value) && value > 0 && value <= 65_535 ? value : 3306;
}

async function checkMysql(): Promise<ServiceHealth> {
  const checkedAt = new Date().toISOString();

  return new Promise((resolve) => {
    const socket = createConnection({ host: "127.0.0.1", port: getMysqlPort() });

    const finish = (status: ServiceHealth["status"], message: string) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve({ name: "mysql", status, checkedAt, message });
    };

    socket.setTimeout(1_500);
    socket.once("connect", () => finish("UP", "Cổng MySQL local đang mở"));
    socket.once("timeout", () => finish("DOWN", "Quá thời gian chờ MySQL"));
    socket.once("error", () => finish("DOWN", "Không thể kết nối MySQL trên máy"));
  });
}

export async function checkLocalServices(): Promise<ServiceHealth[]> {
  return Promise.all([...HEALTH_TARGETS.map(checkTarget), checkMysql()]);
}
