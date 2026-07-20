import { contextBridge, ipcRenderer } from "electron";

import {
  IPC_CHANNELS,
  type DesktopApi,
  type ServiceHealth,
} from "./contracts";

const desktopApi: DesktopApi = Object.freeze({
  getAppInfo: () => ipcRenderer.invoke(IPC_CHANNELS.getAppInfo),
  getDiagnostics: () => ipcRenderer.invoke(IPC_CHANNELS.getDiagnostics),
  getRuntimeConfig: () => ipcRenderer.invoke(IPC_CHANNELS.getRuntimeConfig),
  getServiceHealth: () => ipcRenderer.invoke(IPC_CHANNELS.getServiceHealth),
  openApprovedExternalUrl: (url: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.openApprovedExternalUrl, url),
  onServiceHealthChanged: (listener: (services: ServiceHealth[]) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, services: ServiceHealth[]) => {
      listener(services);
    };

    ipcRenderer.on(IPC_CHANNELS.serviceHealthChanged, handler);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.serviceHealthChanged, handler);
    };
  },
});

contextBridge.exposeInMainWorld("smeDesktop", desktopApi);
