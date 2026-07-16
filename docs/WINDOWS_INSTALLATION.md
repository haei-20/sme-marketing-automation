# Môi trường phát triển và đóng gói Windows

## 1. Môi trường cho thành viên phát triển

| Công cụ | Mức yêu cầu | Mục đích |
|---|---|---|
| Windows 10/11 x64 | Bắt buộc | Nền tảng đích |
| Git | Bắt buộc | Quản lý mã nguồn |
| Node.js 24+ + npm | Bắt buộc với TV4 | Renderer, Electron và packaging |
| Java 17+ | Bắt buộc với TV3 | Spring Boot |
| Python 3.10+ | Bắt buộc với TV1/TV2 | FastAPI/RAG/Agent |
| Ollama | Bắt buộc khi chạy AI | Local LLM |
| MySQL 8 | Bắt buộc khi tích hợp | Dữ liệu nghiệp vụ local |
| Docker Desktop | Tùy chọn | Development/integration, không phải runtime cuối |

Kiểm tra nhanh trong PowerShell:

```powershell
git --version
node --version
npm.cmd --version
java -version
python --version
ollama --version
mysql --version
```

## 2. Chạy renderer hiện tại

```powershell
cd C:\DoAn\sme-marketing-automation\frontend
Copy-Item .env.example .env.local
npm.cmd ci
npm.cmd run dev
```

Không thêm `--host` cho chế độ Desktop. `--host` làm dev server mở ra LAN và không phù hợp mục tiêu local-first.

## 3. Biến môi trường phát triển

- `VITE_USE_MOCKS=true` khi Backend chưa sẵn sàng.
- `VITE_API_BASE_URL=http://127.0.0.1:8080` khi tích hợp local.
- `VITE_WS_URL=ws://127.0.0.1:8080/ws` khi tích hợp STOMP.

Mọi `VITE_*` là dữ liệu public trong renderer. Không đặt JWT secret, Facebook token, DB password hoặc session secret ở đây.

## 4. Quy trình đóng gói dự kiến

Sau khi thư mục `desktop/` được bổ sung:

```powershell
cd desktop
npm.cmd ci
npm.cmd run lint
npm.cmd test
npm.cmd run make
```

Artifact mục tiêu:

```text
desktop/out/make/squirrel.windows/x64/
└── SME-Marketing-Automation-Setup.exe
```

Tên đường dẫn có thể thay đổi theo cấu hình Forge thực tế; CI phải xuất checksum SHA-256 cùng installer.

## 5. Checklist máy sạch

1. Cài bằng tài khoản Windows không có môi trường dev.
2. Mở từ Start Menu và kiểm tra chỉ chạy một instance.
3. Kiểm tra Setup Assistant khi thiếu Ollama/MySQL/model.
4. Khởi động lại máy và mở app lần hai; dữ liệu cũ còn nguyên.
5. Tắt Internet: login local, upload, RAG, generate, review vẫn chạy.
6. Bật Internet và dùng tài khoản test: publish Facebook có xác nhận và log.
7. Đóng app: không còn tiến trình sidecar do app tạo.
8. Gỡ cài đặt: chương trình bị xóa; dữ liệu chỉ bị xóa nếu người dùng chọn rõ ràng.

## 6. Lỗi thường gặp

| Hiện tượng | Kiểm tra |
|---|---|
| Trang trắng | DevTools/log renderer; route error boundary; đường dẫn asset trong packaged app |
| Backend đỏ | Java runtime, port, MySQL, migration và health endpoint |
| AI đỏ | Python sidecar, Ollama đang chạy và model đã pull |
| Streaming không chạy | STOMP URL, auth CONNECT, firewall loopback và event contract |
| Build `.exe` lỗi | Node version, native dependency, icon `.ico`, Forge maker và code signing config |
| Windows cảnh báo | Installer chưa ký; ghi rõ trong demo hoặc dùng chứng thư code-signing khi có |

## 7. Phân biệt development và release

Development có thể chạy Vite, Docker và từng service bằng terminal. Release phải mở bằng `.exe`, tự kiểm tra sidecar và không yêu cầu người dùng thao tác với source code. Không được dùng việc `npm run dev` chạy thành công để tuyên bố installer đã nghiệm thu.
