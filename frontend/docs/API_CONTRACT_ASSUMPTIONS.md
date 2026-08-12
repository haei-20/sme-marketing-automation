# Giả định contract Desktop, REST và STOMP

Tài liệu này là contract tạm để Renderer và Electron phát triển khi OpenAPI Backend chưa khóa. SRS Desktop 2.0 là nguồn yêu cầu; TV3 phải xác nhận REST/STOMP, TV4 chịu trách nhiệm IPC.

## 1. Ranh giới giao tiếp

- Renderer không gọi FastAPI, Ollama, MySQL, filesystem hoặc Facebook trực tiếp.
- Spring Boot và FastAPI chỉ bind `127.0.0.1`.
- Development dùng base URL cố định; packaged app có thể dùng cổng được Electron main chọn và truyền qua preload.
- Mỗi phiên app có session secret/token để tiến trình khác trên máy không gọi API tùy ý.
- REST dùng JSON; STOMP dùng event envelope có version/sequence.
- Thời gian trao đổi ISO-8601 UTC; UI hiển thị `Asia/Bangkok` mặc định.

## 2. Preload API đề xuất

```ts
interface DesktopAPI {
  getAppInfo(): Promise<{ version: string; platform: 'win32' }>;
  getDiagnostics(): Promise<DesktopDiagnostics>;
  getRuntimeConfig(): Promise<{ apiBaseUrl: string; wsUrl: string }>;
  getServiceHealth(): Promise<ServiceHealth[]>;
  restartService(name: 'backend' | 'ai' | 'ollama'): Promise<void>;
  openApprovedExternalUrl(url: string): Promise<void>;
  onServiceHealthChanged(listener: (items: ServiceHealth[]) => void): () => void;
}
```

`DesktopDiagnostics` chỉ chứa version, health snapshot, tên file log và sự kiện kỹ thuật đã redact; không trả đường dẫn tùy ý, token, email, prompt hoặc nội dung nghiệp vụ. Không phơi bày toàn bộ `ipcRenderer`, `shell`, `fs`, `child_process` hoặc biến môi trường. Main phải validate sender, URL, service name và payload.

## 3. REST endpoint cần chốt

| Nhóm | Method/path | Ghi chú Desktop/local-first |
|---|---|---|
| Auth | `POST /api/auth/register`, `/login`, `/refresh`, `/logout` | Refresh token ưu tiên cookie/session local bảo vệ; không lưu dài hạn trong localStorage. |
| Health | `GET /actuator/health` | Không trả secret; Electron dùng để điều phối startup. |
| KB | `POST /api/kb/upload`, `GET /api/kb`, update/delete | File lưu local; kiểm tra MIME/size/path; không S3. |
| Campaign | `POST/GET /api/campaigns` | Có phân trang/filter. |
| Plan | `POST /api/campaigns/{id}/plan`, `GET/PUT`, approve | Job dài có thể trả 202. |
| Post | generate/list/detail/update/approve/reject/schedule/feedback | Phải công bố state machine. |
| Publish | `GET /api/publishing/logs`, `POST /api/publishing/logs/{id}/retry`, cancel/reschedule | Backend giữ token và idempotency key; retry nhận consent version, không nhận token. |
| Integration | `GET /api/integrations/facebook`, `POST .../connect`, `DELETE .../facebook` | Renderer chỉ nhận Page metadata/authorization URL; không nhận raw Page token. |
| Evaluation | `POST /api/eval/run` | Mặc định local judge/SEO offline. |

Lỗi thống nhất:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Dữ liệu không hợp lệ",
  "details": {},
  "traceId": "local-trace-id"
}
```

## 4. Upload local

`POST /api/kb/upload` dùng multipart field `file`. Backend tạo tên lưu trữ riêng, không tin tên/đường dẫn client, từ chối path traversal và file quá giới hạn. Phản hồi có `UPLOADED | PROCESSING | INDEXED | FAILED`, `chunkCount` và lỗi đã làm sạch.

Không đưa absolute filesystem path ra renderer. Preview/download phải qua endpoint được phân quyền hoặc custom protocol an toàn.

## 5. Sinh nội dung và STOMP

```json
POST /api/posts/generate
{
  "campaignId": 101,
  "planId": 202,
  "productId": 45,
  "channel": "FACEBOOK",
  "message": "Ưu đãi mùa hè",
  "seoKeywords": ["máy lọc nước gia đình giá tốt"]
}
```

```json
HTTP/1.1 202 Accepted
{
  "jobId": "job-701",
  "postId": 301,
  "topic": "/topic/generate/job-701"
}
```

Event envelope đề xuất:

```json
{ "version": 1, "jobId": "job-701", "sequence": 1, "type": "TOKEN", "token": "Mùa" }
{ "version": 1, "jobId": "job-701", "sequence": 2, "type": "PROGRESS", "stage": "FACT_CHECK", "percent": 80 }
{ "version": 1, "jobId": "job-701", "sequence": 3, "type": "COMPLETED", "postId": 301 }
{ "version": 1, "jobId": "job-701", "sequence": 3, "type": "ERROR", "code": "AI_TIMEOUT", "message": "AI phản hồi quá thời gian" }
```

TV3 phải chốt auth CONNECT, heartbeat, replay/resume, sequence, terminal event và lỗi. Reconnect không được tạo job hoặc bài trùng.

## 6. Enum/state machine

- Role: `OWNER | ADMIN | EDITOR`.
- Knowledge: `UPLOADED | PROCESSING | INDEXED | FAILED`.
- Campaign: `DRAFT | ACTIVE | DONE`.
- Plan: `SUGGESTED | APPROVED`.
- Post: `DRAFT | PENDING | APPROVED | SCHEDULED | PUBLISHED | FAILED`.
- Job: `QUEUED | RUNNING | DONE | ERROR | CANCELLED`.
- Publish log: `SUCCESS | FAILED | RETRYING`.

Backend phải trả lỗi 409 cho transition không hợp lệ và kiểm tra RBAC server-side.

## 7. Facebook integration

Luồng: `APPROVED` → `SCHEDULED` → Backend Scheduler → Facebook Graph API → publish log. Google Sheets/webhook cloud bị loại khỏi MVP.

- Người dùng phải thấy rõ dữ liệu nào sẽ gửi ra ngoài trước khi kết nối/đăng.
- Page token nằm trong Windows Credential Manager hoặc Backend secret store.
- API trả trạng thái kết nối và Page metadata cần hiển thị, không trả token.
- Publish dùng idempotency, retry/backoff và ghi external post ID.
- Offline/API lỗi không làm mất bài; người dùng có thể retry theo quyền.
- Connect/reconnect và retry bắt buộc gửi `consentVersion: "2026-08"` cùng xác nhận dữ liệu rời máy; Backend ghi audit.
- Status response chỉ gồm `DISCONNECTED | CONNECTED | NEEDS_REAUTH`, Page ID/name, permission name và lỗi đã redact.
- Connect response chỉ trả authorization URL có thời hạn; renderer không có trường nhập/đọc Page token.
- Publish log gồm `SUCCESS | FAILED | RETRYING`, attempt, error code/message đã redact, external ID và thời điểm retry kế tiếp.

## 8. Các quyết định phải khóa

1. Runtime port/session secret giữa Electron và Backend.
2. Cách đóng gói/khởi động/dừng Spring Boot, FastAPI, MySQL và kiểm tra Ollama.
3. Auth/refresh/logout trong packaged app.
4. Pagination, state machine và endpoint còn thiếu.
5. STOMP envelope, auth, sequence và reconnect.
6. Thư mục dữ liệu, backup/restore và quyền xóa khi uninstall.
7. MIME/size/quarantine của upload.
8. Credential store, Facebook consent và audit log.
9. Bộ chấm SEO/judge local mặc định; mọi tích hợp cloud phải opt-in.
