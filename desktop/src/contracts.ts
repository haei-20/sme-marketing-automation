export const IPC_CHANNELS = Object.freeze({
  getAppInfo: "desktop:get-app-info",
  getDiagnostics: "desktop:get-diagnostics",
  getRuntimeConfig: "desktop:get-runtime-config",
  getServiceHealth: "desktop:get-service-health",
  openApprovedExternalUrl: "desktop:open-approved-external-url",
  serviceHealthChanged: "desktop:service-health-changed",
});

export type LocalServiceName = "backend" | "ai" | "ollama" | "mysql";
export type LocalServiceStatus = "UP" | "DOWN" | "UNKNOWN";

export interface AppInfo {
  name: string;
  version: string;
  platform: NodeJS.Platform;
  packaged: boolean;
}

export interface DesktopRuntimeConfig {
  apiBaseUrl: string;
  webSocketUrl: string;
  desktop: true;
}

export interface ServiceHealth {
  name: LocalServiceName;
  status: LocalServiceStatus;
  checkedAt: string;
  message?: string;
}

export type DiagnosticLevel = "INFO" | "WARN" | "ERROR";

export interface DiagnosticLogEntry {
  timestamp: string;
  level: DiagnosticLevel;
  event: string;
  message: string;
}

export interface DesktopDiagnostics {
  generatedAt: string;
  app: AppInfo;
  services: ServiceHealth[];
  logFileName: string;
  recentLogs: DiagnosticLogEntry[];
}

export interface DesktopApi {
  getAppInfo(): Promise<AppInfo>;
  getDiagnostics(): Promise<DesktopDiagnostics>;
  getRuntimeConfig(): Promise<DesktopRuntimeConfig>;
  getServiceHealth(): Promise<ServiceHealth[]>;
  openApprovedExternalUrl(url: string): Promise<void>;
  onServiceHealthChanged(
    listener: (services: ServiceHealth[]) => void,
  ): () => void;
}
