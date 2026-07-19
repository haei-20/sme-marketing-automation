# KẾ HOẠCH ĐỒ ÁN TỐT NGHIỆP — 4 THÀNH VIÊN / 3 THÁNG
### Nền tảng Tự động hóa Marketing cho SME (Local AI + RAG)

---

## 1. Phân chia vai trò (4 thành viên)

Hệ thống theo kiến trúc **Microservices đa ngôn ngữ**, nên chia theo module tự nhiên. Mỗi người là **owner** của một mảng, nhưng vẫn hỗ trợ chéo.

| Thành viên | Vai trò chính | Module phụ trách |
|---|---|---|
| **TV1** | **AI / RAG Engineer** (Python) | Ingestion → Vector DB → RAG retrieval, Ollama + Local LLM |
| **TV2** | **AI Agent & Prompt + Đánh giá** | Multi-Agent, Prompt Patterns, Pydantic, Module lập kế hoạch, Framework kiểm thử |
| **TV3** | **Backend Engineer** (Java/Spring Boot) | Auth, MySQL, S3, WebSocket/STOMP, Scheduling, điều phối service |
| **TV4** | **Frontend + Automation/DevOps** | React/Vite, streaming UI, SEO, pipeline Auto-Posting, Docker/deploy |

> **Team Lead / điều phối:** đề xuất **TV3** (backend là trung tâm tích hợp) kiêm điều phối tiến độ, chốt API contract, chạy standup 2 buổi/tuần.

### Chi tiết trách nhiệm từng người

**TV1 — AI/RAG Engineer**
Xử lý tài liệu (PDF/Word/Excel), làm sạch lỗi OCR, cắt chunk (Recursive Character Text Splitter), embedding (model mã nguồn mở đa ngữ, ví dụ `bge-m3` / `multilingual-e5`), lưu FAISS/Pinecone, xây luồng RAG retrieval, cài đặt Ollama + Qwen/Llama, streaming token.

**TV2 — AI Agent & Prompt + Đánh giá**
Xây 3 Agent (Extracting Features → Description Generating → Post-checking & Editing), các Prompt Pattern (Persona, Output Automater, Fact Check List & Reflection), ràng buộc JSON bằng Pydantic, module AI lập kế hoạch tuần/tháng, và **toàn bộ phần kiểm thử/đánh giá** (LLM-as-a-judge, SEO scoring qua Ahrefs API, so sánh RAG vs LLM thuần).

**TV3 — Backend Engineer**
Spring Boot: nghiệp vụ, quản lý user/doanh nghiệp/chiến dịch, MySQL (ACID), JWT đa tầng (Access/Refresh), tích hợp S3, WebSocket + STOMP, module lịch trình (scheduler), điều phối gọi sang AI service, lưu Golden Sample & feedback loop.

**TV4 — Frontend + Automation/DevOps**
React/Vite SPA (component-based), UI streaming thời gian thực (giống ChatGPT) qua STOMP, React Helmet Async cho SEO/social preview, dashboard quản trị & duyệt bài, **pipeline Auto-Posting** (Google Sheets → webhook/router → Facebook Pages Graph API), Docker/docker-compose và triển khai.

---

## 2. Timeline 12 tuần (chia 5 giai đoạn)

| Giai đoạn | Tuần | Mục tiêu |
|---|---|---|
| **P0 — Nền móng** | 1–2 | Nghiên cứu, thiết kế kiến trúc, chốt API contract, dựng khung dự án |
| **P1 — MVP module** | 3–5 | Mỗi người dựng xong lõi module của mình |
| **P2 — Xây tính năng** | 6–8 | Hoàn thiện RAG, Agent, backend, frontend |
| **P3 — Tích hợp** | 9–10 | Ghép end-to-end, auto-posting chạy thật, streaming thông |
| **P4 — Kiểm thử + Báo cáo** | 11–12 | Chạy thí nghiệm đánh giá, fix bug, viết thuyết minh, demo |

### Mốc chốt (Milestones)
- **Cuối tuần 2:** Kiến trúc + API contract + repo + docker-compose chạy khung 3 service.
- **Cuối tuần 5:** MVP — upload tài liệu → RAG trả lời có dẫn chứng; auth + upload trên UI.
- **Cuối tuần 8:** Sinh bài hoàn chỉnh qua 3 Agent; streaming realtime lên UI.
- **Cuối tuần 10:** Chạy full luồng: upload → kế hoạch → sinh bài → duyệt → auto-post Facebook.
- **Cuối tuần 12:** Kết quả đánh giá + thuyết minh + demo.

---

## 3. Deadline theo tuần cho từng người

### TV1 — AI/RAG Engineer
| Tuần | Nhiệm vụ | Sản phẩm bàn giao |
|---|---|---|
| 1–2 | Dựng FastAPI, cài Ollama, chạy thử Qwen/Llama, benchmark latency; chọn embedding model | AI service chạy được + báo cáo chọn model |
| 3–4 | Document loaders (PDF/Word/Excel) + làm sạch OCR + chunking + embedding → FAISS | Upload tài liệu → lưu vector DB |
| 5 | Retrieval (similarity search) + luồng RAG cơ bản (retrieve→prompt→LLM) | Hỏi → trả lời bám dữ liệu upload |
| 6–7 | Tối ưu retrieval (top-k, metadata filter, re-rank), streaming token, đa knowledge base | RAG chất lượng + streaming |
| 8 | Cung cấp retrieval như service/tool cho Agent của TV2 | RAG phục vụ pipeline Agent |
| 9–10 | Tích hợp AI↔Java, xử lý lỗi, giảm latency | AI service tích hợp hoàn chỉnh |
| 11–12 | Đo latency phục vụ đánh giá, viết chương RAG, demo | Số liệu + chương thuyết minh |

### TV2 — AI Agent & Prompt + Đánh giá
| Tuần | Nhiệm vụ | Sản phẩm bàn giao |
|---|---|---|
| 1–2 | Nghiên cứu framework agent (LangGraph/CrewAI/custom), thiết kế workflow + schema Pydantic | Tài liệu kiến trúc Agent + schema |
| 3–4 | Agent trích xuất đặc trưng + Agent sinh nội dung; prompt Persona & Output Automater | Trích đặc trưng SP + bài viết đầu tiên |
| 5 | Agent hậu kiểm (Fact Check List & Reflection) | Pipeline 3 Agent hoàn chỉnh |
| 6–7 | Module AI lập kế hoạch tuần/tháng + nhắm long-tail keyword | Sinh kế hoạch chiến dịch + bài chuẩn SEO |
| 8 | Ổn định JSON output (Pydantic), ghép với RAG của TV1 | Output cấu trúc chuẩn cho auto-post |
| 9–10 | Xây framework đánh giá: LLM-as-a-judge + SEO scoring (Ahrefs API) + so sánh RAG vs LLM thuần | Pipeline đánh giá + kết quả đầu |
| 11–12 | Chạy thí nghiệm đầy đủ, vẽ biểu đồ, viết chương đánh giá, demo | Kết quả đánh giá + chương thuyết minh |

### TV3 — Backend Engineer (Java/Spring Boot)
| Tuần | Nhiệm vụ | Sản phẩm bàn giao |
|---|---|---|
| 1–2 | Dựng Spring Boot, thiết kế schema MySQL (users, businesses, campaigns, posts, knowledge_base, feedback), chốt API contract | Skeleton + ERD + hợp đồng API |
| 3–4 | JWT Access/Refresh, quản lý user/RBAC, CRUD chiến dịch | Auth + entity lõi hoạt động |
| 5 | Tích hợp S3, luồng upload → chuyển tiếp sang AI service | Upload end-to-end (phía backend) |
| 6–7 | WebSocket + STOMP streaming; module scheduler (lịch đăng bài) | Kênh realtime + scheduler |
| 8 | Điều phối gọi AI (kế hoạch, sinh bài), lưu Golden Sample & feedback loop | Backend điều phối full luồng sinh bài |
| 9–10 | Tích hợp AI + frontend + trigger auto-posting, xử lý transaction/lỗi | Backend tích hợp hoàn chỉnh |
| 11–12 | Test tải/ổn định, Swagger docs, viết chương kiến trúc/backend, demo | Backend đã test + tài liệu |

### TV4 — Frontend + Automation/DevOps
| Tuần | Nhiệm vụ | Sản phẩm bàn giao |
|---|---|---|
| 1–2 | Dựng React/Vite, kiến trúc component, routing, wireframe; dựng docker-compose cho toàn hệ | Khung FE + docker-compose chạy 3 service |
| 3–4 | UI auth (login/register), layout dashboard, màn upload tri thức | Màn auth + upload nối backend |
| 5 | UI lập kế hoạch chiến dịch + trình soạn thảo nội dung | Màn kế hoạch + editor |
| 6–7 | STOMP client streaming (giống ChatGPT); React Helmet Async cho SEO/social preview | UI streaming + SEO |
| 8 | Pipeline Auto-Posting: Google Sheets → webhook/router → Facebook Pages API | Auto-posting MVP |
| 9–10 | Workflow duyệt bài + ghi nhận feedback; hoàn thiện auto-post theo lịch | Sản phẩm chạy end-to-end |
| 11–12 | Triển khai (deploy VPS), polish UI, viết chương FE/deploy, chuẩn bị demo | App đã deploy + tài liệu |

---

## 4. Lưu ý phối hợp (quan trọng)
- **API contract chốt trong tuần 2** — TV1, TV2, TV3 phụ thuộc nhau nên định dạng JSON (Pydantic ↔ DTO Java) phải khóa sớm.
- **Auto-posting** nên cân nhắc dùng **n8n / Make.com** thay vì tự code webhook để tiết kiệm thời gian; TV4 làm, TV3 hỗ trợ phần trigger theo lịch.
- **Rủi ро latency Local LLM:** TV1 benchmark sớm; nếu quá chậm, chuẩn bị phương án model nhỏ hơn (quantized GGUF) hoặc chạy GPU.
- Standup 2 buổi/tuần + demo nội bộ cuối mỗi giai đoạn.

---

## 5. Tạo repo GitHub cho cả nhóm

### Bước 1 — Chọn cấu trúc: **Monorepo** (khuyến nghị cho nhóm 4 người)
Một repo duy nhất, chia thư mục theo service — dễ đồng bộ, dễ review, một chỗ CI/docker.

```
sme-marketing-automation/
├── ai-service/        # TV1, TV2 (Python/FastAPI)
├── backend/           # TV3 (Java/Spring Boot)
├── frontend/          # TV4 (React/Vite)
├── automation/        # TV4 (auto-posting, n8n flows, scripts)
├── docs/              # tài liệu, ERD, API contract, thuyết minh
├── docker-compose.yml
├── .gitignore
└── README.md
```
*(Nếu muốn tách biệt hoàn toàn có thể dùng GitHub Organization + 3–4 repo riêng, nhưng monorepo phù hợp hơn cho đồ án.)*

### Bước 2 — Tạo repo
1. Vào **github.com** → **New repository**.
2. Đặt tên `sme-marketing-automation`, chọn **Private**, tick **Add a README** và **Add .gitignore** (chọn Node — sẽ bổ sung Python/Java sau).
3. **Settings → Collaborators** → mời 3 thành viên còn lại (hoặc tạo **Organization** rồi thêm cả nhóm).

### Bước 3 — Chiến lược nhánh (branch)
- `main` — nhánh chính, **protected**, chỉ merge qua Pull Request.
- `develop` — nhánh tích hợp chung.
- Nhánh tính năng theo từng người:
  - `feature/ai-rag` (TV1)
  - `feature/ai-agent` (TV2)
  - `feature/backend` (TV3)
  - `feature/frontend` (TV4)

**Bật bảo vệ nhánh:** Settings → Branches → Add rule cho `main`: *Require pull request before merging* + *Require 1 approval*. Tránh push thẳng lên `main`.

### Bước 4 — Lệnh Git để mỗi người push code
```bash
# 1. Clone repo về máy
git clone https://github.com/<org-or-user>/sme-marketing-automation.git
cd sme-marketing-automation

# 2. Tạo & chuyển sang nhánh của mình (ví dụ TV1)
git checkout -b feature/ai-rag

# 3. Làm việc, rồi commit
git add .
git commit -m "feat(ai): add document chunking pipeline"

# 4. Push nhánh lên GitHub
git push -u origin feature/ai-rag

# 5. Lên GitHub tạo Pull Request: feature/ai-rag  ->  develop
#    Nhờ 1 thành viên review & approve rồi merge
```

Cập nhật code mới nhất từ nhóm trước khi làm tiếp:
```bash
git checkout develop
git pull origin develop
git checkout feature/ai-rag
git merge develop      # đồng bộ code chung vào nhánh của mình
```

### Bước 5 — Quy ước & công cụ
- **Commit message (Conventional Commits):** `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
  Ví dụ: `feat(backend): add JWT refresh token endpoint`
- **.gitignore** cho từng stack:
  - Python: `venv/`, `__pycache__/`, `*.pyc`, `.env`, `faiss_index/`
  - Java: `target/`, `*.class`, `.env`
  - Node: `node_modules/`, `dist/`, `.env`
  - **Không commit:** model LLM (nặng), file `.env`, khóa AWS/Facebook, vector index.
- **README.md** ghi rõ cách chạy từng service + `docker-compose up`.
- **GitHub Projects (board):** tạo bảng Kanban theo tuần để track deadline; gắn issue cho từng nhiệm vụ ở mục 3.

---

*Gợi ý: dùng chính bảng ở Mục 3 để tạo Issues trên GitHub, gán cho từng thành viên và đặt Milestone theo 5 giai đoạn — vừa quản lý tiến độ, vừa có "bằng chứng đóng góp" khi báo cáo.*
