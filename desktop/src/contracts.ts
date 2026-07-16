export const IPC_CHANNELS = Object.freeze({
  getAppInfo: "desktop:get-app-info",
  getRuntimeConfig: "desktop:get-runtime-config",
  getServiceHealth: "desktop:get-service-health",
  openApprovedExternalUrl: "desktop:open-approved-external-url",
  serviceHealthChanged: "desktop:service-health-changed",
});

export type LocalServiceName = "backend" | "ai" | "ollama";
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

export interface DesktopApi {
  getAppInfo(): Promise<AppInfo>;
  getRuntimeConfig(): Promise<DesktopRuntimeConfig>;
  getServiceHealth(): Promise<ServiceHealth[]>;
  openApprovedExternalUrl(url: string): Promise<void>;
  onServiceHealthChanged(
    listener: (services: ServiceHealth[]) => void,
  ): () => void;
}
