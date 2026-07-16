# Ma trận truy vết TV4 — Nguyên — Frontend/Desktop/Release

Ma trận này thay thế phạm vi FE web/VPS cũ bằng đầu ra Windows `.exe`. Trạng thái phản ánh repository ngày 15/07/2026; “Đang làm” nghĩa là UI/mock hoặc adapter đã có nhưng chưa nghiệm thu với Backend/Desktop thật.

## Tuyến màn hình nội bộ

React Router vẫn dùng các route nội bộ `/login`, `/dashboard`, `/knowledge-base`, `/campaigns`, `/posts`, `/schedule`, `/publishing/logs`, `/reports`, `/integrations`. Đây không phải URL công khai; Electron tải renderer local.

## Ma trận FE-01…FE-13

| Mã / tuần | Sản phẩm và tiêu chí nghiệm thu | Phụ thuộc | Trạng thái 15/07/2026 |
|---|---|---|---|
| FE-01 / T1 | React/Vite renderer, routing, design system, error boundary; lint/test/build đạt. | — | **Đã xong** ở mức renderer độc lập. |
| FE-02 / T1–2 | Electron main/preload, BrowserWindow an toàn, IPC whitelist, desktop dev script. | FE-01 | **Chưa bắt đầu**; Docker Compose cũ chỉ giữ cho development. |
| FE-03 / T2 | Desktop wireframe cho setup/service health và toàn bộ màn nghiệp vụ; loading/empty/error. | FE-01 | **Đã xong** phần màn nghiệp vụ; còn bổ sung setup/health khi FE-02 có. |
| FE-04 / T3 | Auth UI, route guard, refresh/logout, lỗi 401/403; secret không nằm trong renderer. | BE-04, FE-02 | **Đang làm**; mock/session và route guard đã có, Backend contract chưa tích hợp. |
| FE-05 / T4 | Dashboard + upload PDF/DOCX/XLSX vào Backend local; trạng thái PROCESSING/INDEXED/FAILED. | BE-06, AI-05/06 | **Đang làm**; UI/mock đã có. |
| FE-06 / T5 | Campaign/plan/editor, lưu và duyệt kế hoạch, state rõ ràng. | BE-05/09, AG-06 | **Đang làm**; UI/mock đã có. |
| FE-07 / T6 | STOMP loopback, connecting/generating/done/error, reconnect và TTFT đo được. | BE-07, AI-09 | **Đang làm**; client/parser/test đã có, chờ stream thật. |
| FE-08 / T7–8 | Desktop integration: service health, Setup Assistant, notification, version/log diagnostics, IPC test. | FE-02, BE/AI health | **Chưa bắt đầu**. Helmet chỉ còn hỗ trợ title/preview nội bộ. |
| FE-09 / T8–9 | UI cấu hình tích hợp, xác nhận dữ liệu rời máy, schedule/publish logs/retry; không giữ token. | BE-08/10, Facebook test Page | **Chưa bắt đầu tích hợp**; integrations/log UI hiện mới là mock. |
| FE-10 / T9 | Editor/reviewer, state machine, Golden Sample, chống stored XSS. | BE-09 | **Đang làm**; màn editor/review đã có, chờ API/RBAC. |
| FE-11 / T10 | Electron quản lý vòng đời sidecar, offline/reconnect, shutdown sạch, không để process mồ côi. | FE-02, artifact BE/AI | **Chưa bắt đầu**. |
| FE-12 / T11 | Electron Forge/Squirrel tạo `Setup.exe`, shortcut/uninstall, checksum và smoke test máy sạch. | FE-11, artifact BE/AI | **Chưa bắt đầu**; deploy VPS không còn là tiêu chí. |
| FE-13 / T12 | Chương FE/Desktop, hướng dẫn cài, sơ đồ, test evidence, video/kịch bản demo. | FE-12 | **Đang làm**; tài liệu kiến trúc đã cập nhật, còn phụ thuộc artifact cuối. |

## Mốc nghiệm thu

| Mốc | Bằng chứng TV4 |
|---|---|
| Tuần 2 | Electron mở renderer local; security preferences và IPC test; wireframe setup/health. |
| Tuần 5 | Auth/upload/plan/editor chạy trong cửa sổ desktop với Backend local. |
| Tuần 8 | Stream thật; service health; offline mode; review/schedule UI. |
| Tuần 10 | Upload → plan → generate → review → schedule → publish/log end-to-end. |
| Tuần 12 | Installer cài trên máy sạch; app không cần browser; báo cáo và demo có fallback. |

## Bằng chứng kiểm tra renderer hiện tại

```powershell
cd frontend
npm.cmd ci
npm.cmd run lint
npm.cmd test
npm.cmd run build
```

Khi `desktop/` được tạo phải bổ sung kiểm tra main/preload, IPC contract, packaged asset path, service lifecycle và `npm run make`. Frontend `/healthz` hoặc Vite chạy được không đồng nghĩa installer/sidecar đã nghiệm thu.
