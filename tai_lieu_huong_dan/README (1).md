# SME Marketing Automation — Local AI & RAG

Nền tảng tự động hóa marketing cho doanh nghiệp vừa và nhỏ (SME), dùng mô hình ngôn ngữ chạy cục bộ (Local AI) kết hợp RAG để tự động lập kế hoạch, sinh nội dung bám dữ liệu thật và phân phối bài đăng.

## Cấu trúc dự án (monorepo)

```
sme-marketing-automation/
├── ai-service/     # Python / FastAPI — RAG, đa tác tử, Local LLM (Ollama)   [TV1, TV2]
├── backend/        # Java / Spring Boot — nghiệp vụ, JWT, MySQL, S3, WebSocket [TV3]
├── frontend/       # ReactJS / Vite — SPA quản trị, streaming UI, SEO          [TV4]
├── automation/     # Auto-posting: Google Sheets, webhook, Facebook Graph API  [TV4]
├── docs/           # Tài liệu: SRS, ERD, API contract, kế hoạch
├── docker-compose.yml
├── .gitignore
├── CONTRIBUTING.md # Quy trình Git & commit của nhóm
└── README.md
```

## Yêu cầu môi trường
- Node.js 18+ (frontend, automation)
- Java 17+ & Maven/Gradle (backend)
- Python 3.10+ (ai-service)
- Docker & Docker Compose
- Ollama (chạy Local LLM: Qwen/Llama)

## Chạy nhanh (khi đã có docker-compose)
```bash
cp .env.example .env      # điền các khóa bí mật
docker compose up --build
```

## Chạy từng service khi phát triển
```bash
# AI Service
cd ai-service && python -m venv venv && source venv/bin/activate
pip install -r requirements.txt && uvicorn main:app --reload

# Backend
cd backend && ./mvnw spring-boot:run

# Frontend
cd frontend && npm install && npm run dev
```

## Nhánh & thành viên
| Nhánh | Thành viên | Phạm vi |
|---|---|---|
| `feature/ai-rag` | TV1 | ai-service (RAG, embedding, Ollama) |
| `feature/ai-agent` | TV2 | ai-service (đa tác tử, prompt, đánh giá) |
| `feature/backend` | TV3 | backend (auth, MySQL, S3, WebSocket) |
| `feature/frontend` | TV4 | frontend + automation |

Quy trình làm việc và commit: xem `CONTRIBUTING.md`.
