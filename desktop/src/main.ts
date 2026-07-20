import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  app,
  BrowserWindow,
  ipcMain,
  net,
  Notification,
  protocol,
  session,
  shell,
  type IpcMainInvokeEvent,
} from "electron";

import {
  IPC_CHANNELS,
  type AppInfo,
  type DesktopRuntimeConfig,
  type ServiceHealth,
} from "./contracts";
import {
  configureDiagnostics,
  getDiagnosticFileName,
  readRecentDiagnostics,
  writeDiagnostic,
} from "./diagnostics";
import {
  canUseSpaFallback,
  isApprovedExternalUrl,
  isTrustedRendererUrl,
  resolveRendererAsset,
} from "./security";
import { checkLocalServices } from "./service-health";

const squirrelStartup = require("electron-squirrel-startup") as boolean;
if (squirrelStartup) {
  app.quit();
}

protocol.registerSchemesAsPrivileged([
  {
    scheme: "sme",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      codeCache: true,
    },
  },
]);

const developmentUrl = process.env.SME_RENDERER_URL;
const smokeTest = process.argv.includes("--smoke-test");
const runtimeConfig: DesktopRuntimeConfig = Object.freeze({
  apiBaseUrl: process.env.SME_API_BASE_URL ?? "http://127.0.0.1:8080",
  webSocketUrl: process.env.SME_WS_URL ?? "ws://127.0.0.1:8080/ws",
  desktop: true,
});

let mainWindow: BrowserWindow | null = null;
let healthTimer: NodeJS.Timeout | undefined;
let latestHealth: ServiceHealth[] = [];
const previousHealth = new Map<ServiceHealth["name"], ServiceHealth["status"]>();

const serviceLabels: Record<ServiceHealth["name"], string> = {
  backend: "Backend",
  ai: "AI Service",
  ollama: "Ollama",
  mysql: "MySQL",
};

function getAppInfo(): AppInfo {
  return {
    name: app.getName(),
    version: app.getVersion(),
    platform: process.platform,
    packaged: app.isPackaged,
  };
}

function assertTrustedSender(event: IpcMainInvokeEvent): void {
  const senderUrl = event.senderFrame?.url ?? event.sender.getURL();
  if (!isTrustedRendererUrl(senderUrl, developmentUrl)) {
    throw new Error("IPC sender không được phép");
  }
}

async function registerRendererProtocol(): Promise<void> {
  const rendererRoot = app.isPackaged
    ? path.join(process.resourcesPath, "dist")
    : path.resolve(__dirname, "../../frontend/dist");

  await protocol.handle("sme", async (request) => {
    const resolved = resolveRendererAsset(rendererRoot, request.url);
    if (!resolved) {
      return new Response("Bad request", { status: 400 });
    }

    let filePath = resolved.absolutePath;
    try {
      const stat = await fs.stat(filePath);
      if (stat.isDirectory()) {
        filePath = path.join(filePath, "index.html");
      }
    } catch {
      if (!canUseSpaFallback(resolved.pathname)) {
        return new Response("Not found", { status: 404 });
      }
      filePath = path.join(rendererRoot, "index.html");
    }

    return net.fetch(pathToFileURL(filePath).toString());
  });
}

function configureSessionSecurity(): void {
  session.defaultSession.setPermissionCheckHandler(() => false);
  session.defaultSession.setPermissionRequestHandler(
    (_webContents, _permission, callback) => callback(false),
  );
}

function configureIpc(): void {
  ipcMain.handle(IPC_CHANNELS.getAppInfo, (event) => {
    assertTrustedSender(event);
    return getAppInfo();
  });

  ipcMain.handle(IPC_CHANNELS.getDiagnostics, async (event) => {
    assertTrustedSender(event);
    if (latestHealth.length === 0) latestHealth = await checkLocalServices();
    return {
      generatedAt: new Date().toISOString(),
      app: getAppInfo(),
      services: latestHealth,
      logFileName: getDiagnosticFileName(),
      recentLogs: await readRecentDiagnostics(),
    };
  });

  ipcMain.handle(IPC_CHANNELS.getRuntimeConfig, (event) => {
    assertTrustedSender(event);
    return runtimeConfig;
  });

  ipcMain.handle(IPC_CHANNELS.getServiceHealth, async (event) => {
    assertTrustedSender(event);
    latestHealth = await checkLocalServices();
    return latestHealth;
  });

  ipcMain.handle(
    IPC_CHANNELS.openApprovedExternalUrl,
    async (event, value: unknown) => {
      assertTrustedSender(event);
      if (typeof value !== "string" || !isApprovedExternalUrl(value)) {
        throw new Error("URL ngoài không nằm trong allowlist");
      }
      await shell.openExternal(value);
    },
  );
}

function recordServiceTransitions(services: ServiceHealth[]): void {
  for (const service of services) {
    const previousStatus = previousHealth.get(service.name);
    previousHealth.set(service.name, service.status);
    if (!previousStatus || previousStatus === service.status) continue;

    const label = serviceLabels[service.name];
    const recovered = service.status === "UP";
    const message = recovered
      ? `${label} đã hoạt động lại trên máy.`
      : `${label} không còn phản hồi. Mở Trạng thái hệ thống để kiểm tra.`;

    void writeDiagnostic(
      recovered ? "INFO" : "WARN",
      "service_status_changed",
      `${label}: ${previousStatus} -> ${service.status}. ${service.message ?? ""}`,
    );

    if (Notification.isSupported()) {
      new Notification({
        title: recovered ? "Dịch vụ local đã phục hồi" : "Dịch vụ local bị gián đoạn",
        body: message,
        silent: recovered,
      }).show();
    }
  }
}

async function publishServiceHealth(): Promise<void> {
  latestHealth = await checkLocalServices();
  recordServiceTransitions(latestHealth);
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(
      IPC_CHANNELS.serviceHealthChanged,
      latestHealth,
    );
  }
}

function startHealthPolling(): void {
  void publishServiceHealth();
  healthTimer = setInterval(() => {
    void publishServiceHealth();
  }, 10_000);
}

async function waitForRendererContent(): Promise<boolean> {
  if (!mainWindow) return false;

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const hasContent = await mainWindow.webContents.executeJavaScript(
      "Boolean(document.getElementById('root')?.childElementCount)",
      true,
    );
    if (hasContent === true) return true;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return false;
}

async function createMainWindow(): Promise<void> {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    show: false,
    backgroundColor: "#f7faf9",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isApprovedExternalUrl(url)) {
      void shell.openExternal(url);
    }
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!isTrustedRendererUrl(url, developmentUrl)) {
      event.preventDefault();
    }
  });

  mainWindow.webContents.on("will-attach-webview", (event) => {
    event.preventDefault();
  });

  mainWindow.once("ready-to-show", () => {
    if (!smokeTest) mainWindow?.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  if (developmentUrl) {
    await mainWindow.loadURL(developmentUrl);
  } else {
    await mainWindow.loadURL("sme://bundle/");
  }
}

const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });

  void app
    .whenReady()
    .then(async () => {
      if (process.platform === "win32") {
        app.setAppUserModelId(
          "com.squirrel.SMEMarketingAutomation.SMEMarketingAutomation",
        );
      }

      configureDiagnostics(path.join(app.getPath("userData"), "logs"));
      await writeDiagnostic(
        "INFO",
        "desktop_started",
        `Version ${app.getVersion()}; packaged=${app.isPackaged}`,
      );
      configureSessionSecurity();
      configureIpc();
      await registerRendererProtocol();
      await createMainWindow();

      if (smokeTest) {
        if (!(await waitForRendererContent())) {
          throw new Error("Renderer không render nội dung trong smoke-test");
        }
        console.log("SME_DESKTOP_SMOKE_TEST_OK");
        app.exit(0);
        return;
      }

      startHealthPolling();

      app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          void createMainWindow();
        }
      });
    })
    .catch((error) => {
      void writeDiagnostic(
        "ERROR",
        "desktop_start_failed",
        error instanceof Error ? error.message : "Lỗi không xác định",
      );
      console.error("Không thể khởi động Desktop app", error);
      app.exit(1);
    });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (healthTimer) clearInterval(healthTimer);
});
