# Kiến trúc SME Marketing Automation Desktop

## 1. Quyết định kiến trúc

| Mục | Quyết định |
|---|---|
| Sản phẩm | Ứng dụng Windows 10/11 x64, phát hành bằng bộ cài `.exe` |
| Desktop shell | Electron main + preload |
| Renderer | React + TypeScript + Vite hiện có |
| Core | Java 17 + Spring Boot local sidecar |
| AI | Python/FastAPI + Ollama + FAISS local sidecar |
| CSDL | MySQL chạy local trong MVP |
| Tệp | Lưu dưới thư mục dữ liệu ứng dụng, Backend kiểm soát |
| Giao tiếp | IPC Electron có whitelist; REST/STOMP chỉ qua loopback |
| Internet | Chỉ cho tích hợp người dùng chủ động bật, chủ yếu Facebook Graph API |
| Đóng gói | Electron Forge + Squirrel.Windows; runtime sidecar đóng gói theo giai đoạn |

## 2. Sơ đồ thành phần

```text
┌─────────────────────────────────────────────────────────┐
│ SME Marketing Automation Desktop                       │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Electron main                                      │ │
│ │ window lifecycle · preload · IPC · service manager │ │
│ └───────────────────┬─────────────────────────────────┘ │
│                     │ API tối thiểu có whitelist        │
│ ┌───────────────────▼─────────────────────────────────┐ │
│ │ React/Vite renderer                                │ │
│ │ dashboard · KB · plan · editor · review · reports  │ │
│ └───────────────────┬─────────────────────────────────┘ │
└─────────────────────┼───────────────────────────────────┘
                      │ REST + STOMP, 127.0.0.1
              ┌───────▼────────┐
              │ Spring Boot    │
              │ auth · DB ·    │
              │ scheduler · FB │
              └───┬─────────┬──┘
                  │         └──── MySQL + file local
                  │ REST/stream
              ┌───▼────────────┐
              │ FastAPI        │
              │ RAG · Agent    │
              │ Evaluation     │
              └───┬─────────┬──┘
                  │         └──── FAISS local
                  └────────────── Ollama local
```

## 3. Trách nhiệm Electron

Main process:

- Tạo và quản lý cửa sổ.
- Khởi động, kiểm tra sức khỏe và dừng Backend/AI sidecar.
- Phát hiện Ollama/MySQL và hiển thị hướng dẫn khi thiếu.
- Quản lý đường dẫn dữ liệu theo `app.getPath('userData')`.
- Mở URL ngoài sau khi kiểm tra allowlist.
- Cung cấp thông báo desktop, phiên bản và log chẩn đoán đã lọc secret.

Preload chỉ phơi bày API hẹp như `getAppInfo`, `getServiceHealth`, `restartService`, `openExternalApprovedUrl` và sự kiện health/status. Không phơi bày toàn bộ `ipcRenderer`, filesystem, shell hoặc process.

Renderer chỉ chịu trách nhiệm giao diện. Không dùng `require`, không đọc tệp hệ thống trực tiếp, không giữ Facebook token và không tự khởi chạy tiến trình.

## 4. Vòng đời khởi động

1. Electron tạo single-instance lock và thư mục dữ liệu.
2. Main process chọn/kiểm tra cổng loopback và tạo session secret ngẫu nhiên.
3. Kiểm tra MySQL và Ollama; hiển thị màn Setup Assistant nếu thiếu.
4. Khởi động Spring Boot và FastAPI với biến môi trường local, không ghi secret vào command line/log.
5. Chờ `/actuator/health` và `/health`; chỉ mở màn nghiệp vụ khi service sẵn sàng.
6. Renderer nhận base URL/session đã giới hạn qua preload.
7. Khi thoát, Electron yêu cầu sidecar shutdown, chờ timeout rồi kết thúc tiến trình do app sở hữu.

## 5. Ranh giới dữ liệu

| Dữ liệu | Nơi lưu/xử lý | Được ra Internet? |
|---|---|---|
| Tài liệu doanh nghiệp | File local + FAISS | Không |
| Prompt/context RAG | FastAPI/Ollama local | Không |
| Nội dung nháp/chờ duyệt | MySQL local | Không |
| Nội dung APPROVED được đăng | Backend local | Có, chỉ tới API nền tảng đã cấu hình |
| Token Facebook | Windows Credential Manager/Backend secret store | Chỉ dùng khi gọi Facebook |
| Log | Local, đã loại token và nội dung nhạy cảm | Không mặc định |

## 6. Bảo mật bắt buộc

- `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`.
- CSP tối thiểu `default-src 'self'`; chỉ mở rộng `connect-src` cho loopback cần thiết.
- Chặn navigation/new-window ngoài allowlist.
- Kiểm tra sender, channel và payload cho mọi IPC.
- Không tải/execute JavaScript từ remote.
- REST/STOMP có session authentication; CORS chỉ cho origin/protocol của app.
- Service bind `127.0.0.1`, dùng cổng không xung đột, không bind LAN.
- File upload kiểm tra MIME, kích thước, tên file và đường dẫn; chống path traversal.
- Token/secret không nằm trong `VITE_*`, localStorage, source hoặc log.

## 7. Chiến lược đóng gói

Giai đoạn MVP:

- Đóng gói Electron + renderer thành installer Windows.
- Kiểm tra prerequisite Ollama/MySQL và hướng dẫn cài/khởi tạo model.
- Có thể chạy Backend/AI từ artifact local trong lúc tích hợp.

Giai đoạn phát hành đồ án:

- Spring Boot đóng gói JAR cùng Java runtime rút gọn.
- FastAPI đóng gói executable/sidecar có version.
- Installer tạo shortcut, thư mục dữ liệu và entry gỡ cài đặt.
- Model Ollama không nhúng để tránh installer nhiều GB; Setup Assistant tải model khi người dùng đồng ý.

## 8. Điều kiện nghiệm thu kiến trúc

- Cài đặt và mở app bằng Start Menu trên Windows sạch.
- Không cần người dùng mở trình duyệt hoặc nhập URL.
- Tắt Internet vẫn upload, RAG, lập kế hoạch, sinh và duyệt bài được.
- Port scan không thấy service lắng nghe trên địa chỉ LAN.
- Đóng app không để sidecar mồ côi.
- Khi Ollama/MySQL lỗi, app hiển thị nguyên nhân và cách khắc phục thay vì trang trắng.
- Chỉ thao tác publish mới tạo kết nối Facebook; kết quả được ghi log có external ID hoặc lỗi.
