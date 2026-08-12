# SME Marketing Automation — React Renderer

Thư mục này chứa renderer React/Vite của ứng dụng Windows. Khi phát hành, renderer được Electron tải như nội dung local; người dùng không mở trình duyệt hoặc truy cập URL.

## Trạng thái

Đã có các màn: setup/service health, login/register, dashboard, knowledge base, campaign/plan, posts/editor/review, schedule, publishing logs, reports và integrations. Màn Facebook dùng consent mô tả dữ liệu rời máy và không có trường token; S3/Google Sheets không thuộc runtime local-first. Mock mode cho phép phát triển độc lập. Electron main/preload nằm tại [`../desktop`](../desktop/README.md); Backend và AI sidecar vẫn là phụ thuộc chưa được bàn giao.

## Môi trường

- Windows 10/11 x64.
- Node.js `>= 24` và npm.
- Backend/AI/Ollama/MySQL chỉ cần khi tích hợp thật.
- Docker Desktop tùy chọn cho development.

## Chạy renderer

```powershell
cd C:\DoAn\sme-marketing-automation\frontend
Copy-Item .env.example .env.local
npm.cmd ci
npm.cmd run dev
```

Mở `http://localhost:5173`. Đây chỉ là development server. Không chạy `--host` trong luồng Desktop vì sẽ mở dịch vụ ra LAN.

## Scripts

```powershell
npm.cmd run dev
npm.cmd run lint
npm.cmd test
npm.cmd run build
npm.cmd run preview
```

Trước Pull Request phải chạy lint, test và build.

## Cấu hình public

| Biến | Development mẫu | Ý nghĩa |
|---|---|---|
| `VITE_API_BASE_URL` | rỗng hoặc `http://127.0.0.1:8080` | Core Backend local |
| `VITE_WS_URL` | `ws://127.0.0.1:8080/ws` | STOMP loopback |
| `VITE_USE_MOCKS` | `true` | Dùng mock khi service chưa sẵn sàng |
| `VITE_API_TIMEOUT_MS` | `20000` | Timeout REST |
| `VITE_WS_RECONNECT_DELAY_MS` | `3000` | Delay reconnect |

`VITE_*` được nhúng vào bundle và không phải nơi lưu secret. Facebook token, DB password, session secret và credential không được xuất hiện ở đây.

Trong bản packaged app, Electron main chọn cổng/session runtime và preload cung cấp cấu hình tối thiểu. Renderer không được tự đọc filesystem hoặc process environment ngoài contract đã duyệt.

## Cấu trúc

```text
frontend/
├── src/            # bootstrap, layout, route và pages
├── components/     # design system
├── lib/
│   ├── api/        # REST adapter
│   ├── auth/       # auth/session phía UI
│   ├── config/     # public runtime config
│   ├── mock/       # dữ liệu phát triển
│   ├── realtime/   # STOMP client
│   └── types/      # TypeScript contracts
└── docs/
```

## Giao tiếp trong Desktop

- Renderer gọi Spring Boot qua `127.0.0.1` với session authentication hoặc qua adapter do Electron cung cấp.
- Renderer nhận stream qua STOMP loopback.
- Renderer không gọi FastAPI, Ollama, FAISS, Facebook hoặc MySQL trực tiếp.
- Tác vụ native như service health, mở URL ngoài và app version đi qua preload API có whitelist.
- Khi service chưa sẵn sàng, app hiển thị trạng thái khắc phục; không để trang trắng.

## Electron security contract

Phần `desktop/` phải cấu hình:

- `nodeIntegration: false`.
- `contextIsolation: true`.
- `sandbox: true`.
- CSP chặt và không tải remote code.
- Chặn navigation/window ngoài allowlist.
- Không phơi bày `ipcRenderer.send/on/invoke` nguyên bản cho renderer.

## Docker và Nginx

Dockerfile/Nginx hiện có chỉ dùng để kiểm tra renderer hoặc tích hợp service trong development. Chúng không còn là đầu ra FE-12 và không chứng minh ứng dụng Desktop đã đóng gói.

```powershell
docker compose up --build frontend
```

Khi Backend/AI source chưa có, chỉ chạy frontend mock. Profile `full` chỉ dùng sau khi các Dockerfile thật được bàn giao.

## Social preview và auto-post

`react-helmet-async` chỉ hỗ trợ metadata trong renderer, không bảo đảm crawler Facebook đọc được SPA/packaged app. MVP Desktop ưu tiên preview nội bộ; nếu cần URL chia sẻ công khai, Backend phải cung cấp trang public riêng và người dùng phải đồng ý đưa bài đã duyệt ra Internet.

Frontend chỉ hiển thị lịch, trạng thái và publish logs. Backend local giữ token và gọi Facebook Graph API trực tiếp; không dùng Google Sheets và không gọi Facebook từ renderer.

## Truy vết

- [Kiến trúc Desktop](../docs/DESKTOP_ARCHITECTURE.md)
- [Cài đặt Windows](../docs/WINDOWS_INSTALLATION.md)
- [Giả định contract](docs/API_CONTRACT_ASSUMPTIONS.md)
- [Ma trận công việc TV4](docs/FE_TASK_TRACEABILITY.md)
