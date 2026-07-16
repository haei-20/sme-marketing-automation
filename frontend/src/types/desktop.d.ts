interface SmeDesktopApi {
  getAppInfo(): Promise<{
    name: string;
    version: string;
    platform: NodeJS.Platform;
    packaged: boolean;
  }>;
  getRuntimeConfig(): Promise<{
    apiBaseUrl: string;
    webSocketUrl: string;
    desktop: true;
  }>;
  getServiceHealth(): Promise<
    Array<{
      name: "backend" | "ai" | "ollama" | "mysql";
      status: "UP" | "DOWN" | "UNKNOWN";
      checkedAt: string;
      message?: string;
    }>
  >;
  openApprovedExternalUrl(url: string): Promise<void>;
  onServiceHealthChanged(
    listener: (
      services: Array<{
        name: "backend" | "ai" | "ollama" | "mysql";
        status: "UP" | "DOWN" | "UNKNOWN";
        checkedAt: string;
        message?: string;
      }>,
    ) => void,
  ): () => void;
}

interface Window {
  smeDesktop?: SmeDesktopApi;
}
