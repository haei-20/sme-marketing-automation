import fs from "node:fs/promises";
import path from "node:path";

import type { DiagnosticLevel, DiagnosticLogEntry } from "./contracts";

const LOG_FILE_NAME = "desktop.log";
const MAX_LOG_BYTES = 1_000_000;
const SENSITIVE_PAIR = /\b(token|password|secret|api[_-]?key|authorization)\b\s*[:=]\s*([^\s,;]+)/gi;
const BEARER_TOKEN = /\bBearer\s+[A-Za-z0-9._~+\/-]+=*/gi;
const JWT_TOKEN = /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g;
const EMAIL_ADDRESS = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;

let logDirectory: string | undefined;

export function redactDiagnosticText(value: string): string {
  return value
    .replace(BEARER_TOKEN, "Bearer [REDACTED]")
    .replace(JWT_TOKEN, "[REDACTED_JWT]")
    .replace(SENSITIVE_PAIR, (_match, key: string) => `${key}=[REDACTED]`)
    .replace(EMAIL_ADDRESS, "[REDACTED_EMAIL]");
}

export function configureDiagnostics(directory: string): void {
  logDirectory = directory;
}

export function getDiagnosticFileName(): string {
  return LOG_FILE_NAME;
}

function getLogPath(): string | undefined {
  return logDirectory ? path.join(logDirectory, LOG_FILE_NAME) : undefined;
}

async function rotateIfNeeded(logPath: string): Promise<void> {
  try {
    const stat = await fs.stat(logPath);
    if (stat.size < MAX_LOG_BYTES) return;
    await fs.rename(logPath, `${logPath}.1`).catch(async () => {
      await fs.rm(`${logPath}.1`, { force: true });
      await fs.rename(logPath, `${logPath}.1`);
    });
  } catch {
    // File chưa tồn tại hoặc chưa cần rotate.
  }
}

export async function writeDiagnostic(
  level: DiagnosticLevel,
  event: string,
  message: string,
): Promise<void> {
  const logPath = getLogPath();
  if (!logPath) return;

  const entry: DiagnosticLogEntry = {
    timestamp: new Date().toISOString(),
    level,
    event: redactDiagnosticText(event).slice(0, 80),
    message: redactDiagnosticText(message).slice(0, 500),
  };

  try {
    await fs.mkdir(path.dirname(logPath), { recursive: true });
    await rotateIfNeeded(logPath);
    await fs.appendFile(logPath, `${JSON.stringify(entry)}\n`, "utf8");
  } catch {
    // Diagnostics không được làm ứng dụng lỗi theo.
  }
}

export async function readRecentDiagnostics(limit = 50): Promise<DiagnosticLogEntry[]> {
  const logPath = getLogPath();
  if (!logPath) return [];

  try {
    const content = await fs.readFile(logPath, "utf8");
    return content
      .split(/\r?\n/)
      .filter(Boolean)
      .slice(-Math.max(1, Math.min(limit, 100)))
      .flatMap((line) => {
        try {
          const entry = JSON.parse(line) as DiagnosticLogEntry;
          if (!entry.timestamp || !entry.level || !entry.event || !entry.message) return [];
          return [{
            timestamp: entry.timestamp,
            level: entry.level,
            event: redactDiagnosticText(entry.event),
            message: redactDiagnosticText(entry.message),
          }];
        } catch {
          return [];
        }
      });
  } catch {
    return [];
  }
}
