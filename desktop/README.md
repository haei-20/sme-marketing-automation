# SME Marketing Automation — Electron Desktop

Desktop shell cho renderer React/Vite. Đây là phạm vi FE-02: cửa sổ Electron, preload API, secure IPC, custom protocol và quy trình package Windows.

## Chạy development

```powershell
cd C:\DoAn\sme-marketing-automation\frontend
npm.cmd ci

cd ..\desktop
npm.cmd ci
npm.cmd run dev
```

Lệnh `dev` khởi động Vite trên `127.0.0.1:5173`, chờ renderer sẵn sàng rồi mở Electron. Đóng cửa sổ Electron sẽ dừng Vite.

## Kiểm tra và đóng gói

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run package
npm.cmd run make
```

- `package`: tạo thư mục ứng dụng unpacked dưới `out/`.
- `make`: tạo Squirrel.Windows installer `SME-Marketing-Automation-Setup.exe`.

Smoke test bản package mà không mở cửa sổ tương tác:

```powershell
& '.\out\SMEMarketingAutomation-win32-x64\SME Marketing Automation.exe' --smoke-test
```

Kết quả hợp lệ in `SME_DESKTOP_SMOKE_TEST_OK` và thoát với mã `0`.

## Ranh giới bảo mật

- Renderer dùng `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`.
- Production tải bundle qua `sme://bundle/`, không dùng `file://`.
- Mọi browser permission bị từ chối mặc định.
- Navigation và cửa sổ mới bị chặn; URL ngoài chỉ mở khi dùng HTTPS và nằm trong allowlist.
- Preload chỉ expose `getAppInfo`, `getRuntimeConfig`, `getServiceHealth`, `openApprovedExternalUrl` và sự kiện health.
- Backend/AI/Ollama health chỉ gọi qua `127.0.0.1`.

FE-02 không khởi động/dừng Spring Boot hoặc FastAPI. Quản lý vòng đời sidecar thuộc FE-11 sau khi TV1/TV3 bàn giao artifact thật.
