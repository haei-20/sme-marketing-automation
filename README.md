# SME Marketing Automation Desktop

Ứng dụng Windows local-first giúp SME quản lý tri thức, lập kế hoạch, sinh và duyệt nội dung marketing bằng Local AI + RAG, sau đó lên lịch đăng nội dung đã duyệt.

## Kiến trúc mục tiêu

```text
Electron main/preload
└── React/Vite renderer
    └── Spring Boot @ 127.0.0.1
        ├── MySQL + file storage local
        ├── WebSocket/STOMP
        ├── Facebook adapter
        └── FastAPI @ 127.0.0.1
            ├── RAG/Agent/Evaluation
            ├── FAISS
            └── Ollama
```

Đầu ra phát hành là `SME-Marketing-Automation-Setup.exe`. Docker Compose chỉ phục vụ development/integration; không phải giao diện hay hình thức phát hành cuối.

## Trạng thái repository

Nhánh `feature/frontend` hiện có React/Vite renderer chạy độc lập bằng mock, gồm auth, dashboard, knowledge base, campaign/plan, post editor/review, schedule, publishing logs, reports và integrations. Electron shell, Backend và AI Service chưa có trong nhánh này và được theo dõi như các phụ thuộc riêng.

## Chạy renderer hiện tại

```powershell
cd frontend
Copy-Item .env.example .env.local
npm.cmd ci
npm.cmd run dev
```

Mở `http://localhost:5173`. Đây là chế độ phát triển renderer; bản Desktop sau này sẽ mở UI trong Electron và không cần người dùng truy cập URL.

Kiểm tra trước Pull Request:

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run build
```

## Cấu trúc mục tiêu

```text
sme-marketing-automation/
├── desktop/       # Electron main/preload/launcher/packaging — TV4
├── frontend/      # React/Vite renderer — TV4 (Nguyên)
├── backend/       # Spring Boot — TV3
├── ai-service/    # FastAPI + RAG + Agent — TV1/TV2
├── automation/    # Facebook adapter server-side/local
├── docs/
└── docker-compose.yml
```

## Tài liệu

- [Danh mục tài liệu Desktop 2.0](docs/README.md)
- [Kiến trúc Desktop](docs/DESKTOP_ARCHITECTURE.md)
- [Hướng dẫn môi trường và đóng gói Windows](docs/WINDOWS_INSTALLATION.md)
- [Giả định REST/STOMP/IPC](frontend/docs/API_CONTRACT_ASSUMPTIONS.md)
- [Truy vết đầu việc TV4](frontend/docs/FE_TASK_TRACEABILITY.md)

## Quy tắc Local-first

- Không gửi tài liệu, prompt, context RAG hoặc nội dung chưa duyệt lên cloud.
- Chỉ dùng FAISS và Ollama local trong MVP; không Pinecone/cloud LLM.
- Tệp nằm trong thư mục dữ liệu ứng dụng; không Amazon S3 trong MVP.
- Không dùng Google Sheets làm trung gian đăng bài.
- Chỉ Backend được giữ token và gọi Facebook Graph API.
- Mọi local service bind `127.0.0.1`; không mở bằng `--host` trong bản Desktop.
- Electron bật sandbox/context isolation và không cấp Node.js trực tiếp cho renderer.
