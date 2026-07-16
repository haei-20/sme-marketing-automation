param(
    [string]$WorkspaceRoot = "C:\DoAn"
)

$ErrorActionPreference = "Stop"

$srsPath = Join-Path $WorkspaceRoot "SRS_Phan_tich_thiet_ke.docx"
$taskDocPath = Join-Path $WorkspaceRoot "Giai_thich_dau_viec.docx"
$workbookPath = Join-Path $WorkspaceRoot "Bang_cong_viec_do_an (1).xlsx"
$tempRoot = Join-Path $env:TEMP "sme-desktop-docs"
New-Item -ItemType Directory -Force -Path $tempRoot | Out-Null

function Backup-Once([string]$source, [string]$backupName) {
    $destination = Join-Path $WorkspaceRoot $backupName
    if ((Test-Path -LiteralPath $source) -and -not (Test-Path -LiteralPath $destination)) {
        Copy-Item -LiteralPath $source -Destination $destination
    }
}

Backup-Once $srsPath "SRS_Phan_tich_thiet_ke_Web_v1_backup.docx"
Backup-Once $taskDocPath "Giai_thich_dau_viec_Web_v1_backup.docx"
Backup-Once $workbookPath "Bang_cong_viec_do_an_Web_v1_backup.xlsx"

$taskUpdates = @(
    @{ Code="AI-01"; Task="Khởi tạo FastAPI local sidecar, cấu hình loopback và endpoint health"; Output="AI Service chạy trên 127.0.0.1; /health trả 200 và không mở ra LAN"; Accept="Khởi động/dừng lặp lại được; health có version; port chỉ bind loopback; có test smoke." },
    @{ Code="AI-04"; Task="Thiết kế pipeline RAG local và chốt contract AI ↔ Backend"; Output="Sơ đồ pipeline + JSON contract + quy ước timeout/error/stream"; Accept="TV1/TV2/TV3 xác nhận contract; không có Pinecone/cloud LLM trong đường dữ liệu mặc định." },
    @{ Code="AI-09"; Task="Streaming token và nhiều knowledge base cô lập theo tenant trên FAISS local"; Output="API stream ổn định; tenant A không truy xuất được dữ liệu tenant B"; Accept="Có test cô lập tenant, sequence stream, timeout và ngắt kết nối; không bind LAN." },
    @{ Code="AI-11"; Task="Tích hợp AI sidecar với Spring Boot local, xử lý timeout/retry/cancel"; Output="Backend loopback gọi AI thành công; lỗi được chuẩn hóa và không treo ứng dụng"; Accept="Có integration test, retry hữu hạn, cancellation và traceId; không ghi prompt/secret vào log." },
    @{ Code="AI-12"; Task="Test end-to-end Desktop → Backend → AI và tối ưu latency/edge case"; Output="Luồng trong Electron chạy ổn định cả offline; có xử lý file rỗng/câu hỏi ngoài phạm vi"; Accept="Có checklist E2E và số liệu; tắt Internet vẫn ingest, RAG và generate được." },
    @{ Code="AI-14"; Task="Đóng gói AI sidecar, viết chương RAG/Desktop và chuẩn bị demo"; Output="Artifact AI có version + hướng dẫn chạy/đóng gói + chương RAG"; Accept="Artifact chạy trên máy không có môi trường dev hoặc có prerequisite được mô tả rõ; nội dung khớp bản phát hành." },

    @{ Code="AG-09"; Task="Xây framework Local LLM-as-a-judge cho tính trung thực và phù hợp ngữ cảnh"; Output="Bộ chấm local, rubric và kết quả mẫu tái lập được"; Accept="Không gửi bài/context lên cloud; rubric/version model/seed được ghi; có kiểm tra độ ổn định." },
    @{ Code="AG-10"; Task="Xây bộ chấm SEO offline; Ahrefs chỉ là adapter opt-in"; Output="Điểm SEO local cho từng bài và giải thích tiêu chí"; Accept="Chạy được khi mất Internet; nếu thử Ahrefs phải có consent và không gửi dữ liệu nhạy cảm." },
    @{ Code="AG-11"; Task="Thiết kế và chạy so sánh RAG với LLM thuần hoàn toàn local"; Output="Bảng số liệu độ trung thực, ảo giác và SEO"; Accept="Cùng model/cấu hình/tập mẫu; phương pháp đủ để chạy lại; không phụ thuộc cloud judge." },
    @{ Code="AG-12"; Task="Chạy full thí nghiệm local, tổng hợp số liệu tài nguyên và biểu đồ"; Output="Bộ kết quả gồm accuracy, SEO, latency, RAM/CPU/GPU"; Accept="Dữ liệu nguồn, cấu hình model và script được version hóa; biểu đồ khớp bảng số liệu." },

    @{ Code="BE-01"; Task="Khởi tạo Spring Boot + MySQL local, bind loopback và health endpoint"; Output="Backend chạy trên 127.0.0.1, kết nối MySQL local, migration thành công"; Accept="Không lắng nghe trên LAN; health không lộ secret; migration chạy lại an toàn." },
    @{ Code="BE-03"; Task="Chốt REST/STOMP contract và runtime contract với Electron"; Output="OpenAPI draft + STOMP envelope + health/startup/shutdown contract"; Accept="TV1/TV2/TV4 xác nhận; có request/response/error/state machine và version contract." },
    @{ Code="BE-04"; Task="JWT Access/Refresh, RBAC và bảo vệ phiên local Desktop"; Output="Login/refresh/logout hoạt động; route/API được phân quyền"; Accept="Refresh/revoke đúng; chống XSS/CSRF theo cách lưu token; renderer không giữ secret dài hạn." },
    @{ Code="BE-06"; Task="Lưu tệp cục bộ an toàn và chuyển tài liệu sang AI sidecar"; Output="Upload → file local → AI ingest; không dùng Amazon S3 trong MVP"; Accept="Chống path traversal, kiểm tra MIME/size, tên lưu riêng; renderer không nhận absolute path." },
    @{ Code="BE-07"; Task="WebSocket/STOMP loopback chuyển tiếp stream AI tới Desktop"; Output="Kênh realtime có auth, heartbeat, sequence và terminal event"; Accept="Reconnect không tạo dữ liệu trùng; lỗi/timeout/cancel rõ; chỉ bind loopback." },
    @{ Code="BE-10"; Task="Tích hợp AI + Desktop và đăng trực tiếp Facebook sau khi duyệt"; Output="Luồng end-to-end; Backend gọi Facebook Graph API, không dùng Google Sheets"; Accept="Chỉ bài APPROVED được gửi; consent rõ; token không trả về renderer; có idempotency." },
    @{ Code="BE-12"; Task="Test tải/ổn định, Swagger và đóng gói Backend sidecar cùng Java runtime"; Output="Báo cáo test + OpenAPI + artifact Backend có version"; Accept="Artifact khởi động/health/shutdown theo contract Electron; p95 và giới hạn tải được ghi." },
    @{ Code="BE-13"; Task="Viết chương Backend/Desktop, bảo mật local-first và demo"; Output="Chương kiến trúc/backend khớp artifact phát hành"; Accept="Mô tả đúng loopback, file local, credential, scheduler, Facebook adapter và kịch bản lỗi." },

    @{ Code="FE-01"; Role="Frontend/Desktop"; Task="Hoàn thiện React/Vite renderer, routing, design system và error boundary"; Output="Renderer lint/test/build đạt; các route nghiệp vụ chạy bằng mock"; Status="Đã xong"; Accept="npm run lint, npm test, npm run build đều đạt; không có trang trắng khi route lỗi." },
    @{ Code="FE-02"; Role="Frontend/Desktop"; Task="Tạo Electron main/preload, BrowserWindow an toàn và IPC whitelist"; Output="Desktop shell mở renderer; nodeIntegration=false, contextIsolation/sandbox bật"; Deps="FE-01"; Status="Chưa bắt đầu"; Accept="Có test preload/IPC; renderer không truy cập Node/fs/shell trực tiếp; chặn navigation ngoài allowlist." },
    @{ Code="FE-03"; Role="Frontend/Desktop"; Task="Hoàn thiện wireframe Desktop gồm setup, service health và toàn bộ luồng nghiệp vụ"; Output="Bộ wireframe/màn hình có loading, empty, error và trạng thái offline"; Deps="FE-01;FE-02"; Status="Đang làm"; Accept="Bao phủ login → upload → plan → generate → review → schedule → logs và màn khắc phục service lỗi." },
    @{ Code="FE-04"; Role="Frontend/Desktop"; Task="UI Auth nối Backend local, refresh/logout và protected routes"; Output="Login/register/session trong app; lỗi 401/403 rõ"; Deps="FE-02;BE-04"; Status="Đang làm"; Accept="Không giữ refresh secret dài hạn trong renderer; route guard, refresh single-flight và logout có test." },
    @{ Code="FE-05"; Role="Frontend/Desktop"; Task="Dashboard và upload tri thức vào lưu trữ local"; Output="Upload PDF/DOCX/XLSX, theo dõi PROCESSING/INDEXED/FAILED"; Deps="FE-04;BE-06;AI-05"; Status="Đang làm"; Accept="Có progress/error/retry; không hiển thị absolute path; file lỗi không làm app trắng." },
    @{ Code="FE-06"; Role="Frontend/Desktop"; Task="Màn chiến dịch/kế hoạch và editor nội dung"; Output="Plan tuần/tháng, editor lưu/chuyển trạng thái đúng"; Deps="FE-05;BE-05;AG-06"; Status="Đang làm"; Accept="Loading/empty/error; validation; state transition và autosave/lưu thủ công rõ ràng." },
    @{ Code="FE-07"; Role="Frontend/Desktop"; Task="STOMP client loopback hiển thị streaming realtime"; Output="Token/progress/done/error hiện dần; reconnect an toàn"; Deps="FE-06;BE-07;AI-09"; Status="Đang làm"; Accept="Parser/sequence/reconnect có test; mất kết nối không nhân đôi nội dung; TTFT được đo." },
    @{ Code="FE-08"; Role="Frontend/Desktop"; Task="Desktop integration: Setup Assistant, service health, notification và diagnostics"; Output="Màn trạng thái Backend/AI/Ollama/MySQL; restart có kiểm soát; thông báo desktop"; Deps="FE-02;BE-01;AI-01"; Status="Chưa bắt đầu"; Accept="Service lỗi có nguyên nhân/cách sửa; IPC validate payload; log chẩn đoán không chứa token/nội dung nhạy cảm." },
    @{ Code="FE-09"; Role="Frontend/Desktop"; Task="UI tích hợp Facebook, consent, lịch đăng, publish logs và retry"; Output="Người dùng thấy dữ liệu sắp rời máy; kết quả đăng và lỗi hiển thị rõ"; Deps="FE-08;BE-08;BE-10"; Status="Chưa bắt đầu"; Accept="Renderer không nhận raw token; chỉ bài APPROVED được gửi; retry không tạo bài trùng." },
    @{ Code="FE-10"; Role="Frontend/Desktop"; Task="Workflow duyệt bài và ghi nhận Golden Sample/feedback"; Output="Editor/reviewer sửa, gửi duyệt, approve/reject và lưu feedback"; Deps="FE-06;BE-09"; Status="Đang làm"; Accept="RBAC/state rõ; chống stored XSS; lịch sử chỉnh sửa/Golden Sample lưu qua Backend." },
    @{ Code="FE-11"; Role="Frontend/Desktop"; Task="Quản lý vòng đời local sidecar và trạng thái offline/reconnect"; Output="Electron start/health/restart/shutdown Backend/AI; không để process mồ côi"; Deps="FE-02;BE-12;AI-14"; Status="Chưa bắt đầu"; Accept="Single instance; cổng không xung đột; shutdown timeout; app mở lại phục hồi trạng thái và dữ liệu." },
    @{ Code="FE-12"; Role="Frontend/Desktop"; Task="Đóng gói Electron Forge/Squirrel thành Windows Setup.exe"; Output="SME-Marketing-Automation-Setup.exe + checksum + hướng dẫn cài/gỡ"; Deps="FE-11"; Status="Chưa bắt đầu"; Accept="Cài/mở/gỡ trên máy sạch; shortcut/version/icon đúng; không cần browser; dữ liệu chỉ xóa khi người dùng chọn." },
    @{ Code="FE-13"; Role="Frontend/Desktop"; Task="Viết chương FE/Desktop, hướng dẫn cài đặt và chuẩn bị demo"; Output="Chương tài liệu + sơ đồ + test evidence + video/kịch bản fallback"; Deps="FE-12"; Status="Đang làm"; Accept="Nội dung khớp installer cuối; demo offline và lỗi service có phương án; bằng chứng đóng góp rõ." }
)

function Html([object]$value) {
    return [System.Net.WebUtility]::HtmlEncode([string]$value)
}

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
try {
    $book = $excel.Workbooks.Open($workbookPath)
    $tasks = $book.Worksheets.Item("Danh sách công việc")
    $tasks.Cells.Item(1,10).Value2 = "Tiêu chí nghiệm thu chính"
    $tasks.Cells.Item(1,11).Value2 = "Bằng chứng / lưu ý Local-first"

    $rowByCode = @{}
    for ($row=2; $row -le $tasks.UsedRange.Rows.Count; $row++) {
        $code = [string]$tasks.Cells.Item($row,1).Text
        if ($code) { $rowByCode[$code] = $row }
    }

    foreach ($update in $taskUpdates) {
        $row = $rowByCode[$update.Code]
        if (-not $row) { throw "Không tìm thấy mã công việc $($update.Code)" }
        if ($update.Role) { $tasks.Cells.Item($row,5).Value2 = $update.Role }
        if ($update.Task) { $tasks.Cells.Item($row,6).Value2 = $update.Task }
        if ($update.Output) { $tasks.Cells.Item($row,7).Value2 = $update.Output }
        if ($update.Deps) { $tasks.Cells.Item($row,8).Value2 = $update.Deps }
        if ($update.Status) { $tasks.Cells.Item($row,9).Value2 = $update.Status }
        if ($update.Accept) { $tasks.Cells.Item($row,10).Value2 = $update.Accept }
    }

    for ($row=2; $row -le 54; $row++) {
        if (-not [string]$tasks.Cells.Item($row,10).Text) {
            $tasks.Cells.Item($row,10).Value2 = "Sản phẩm bàn giao chạy lại được theo hướng dẫn, đạt test liên quan, xử lý lỗi chính và được ít nhất một thành viên review."
        }
        $role = [string]$tasks.Cells.Item($row,5).Text
        $evidence = switch -Regex ($role) {
            "AI/RAG" { "Unit/integration test, input-output mẫu, log latency/tài nguyên; không gọi cloud AI/vector DB."; break }
            "Agent/Eval" { "Schema/rubric/tập mẫu/version model và kết quả tái lập; mặc định chạy offline."; break }
            "Backend" { "Test, migration/OpenAPI/health log; bind 127.0.0.1; secret không nằm trong source/log."; break }
            "Frontend/Desktop" { "Ảnh/video, test report, IPC/API evidence; không để secret trong renderer."; break }
            default { "Bằng chứng chạy thực tế, test và review." }
        }
        $tasks.Cells.Item($row,11).Value2 = $evidence
    }

    $header = $tasks.Range("A1:K1")
    $header.Font.Bold = $true
    $header.Font.Color = 0xFFFFFF
    $header.Interior.Color = 0x7030A0
    $tasks.Range("A1:K54").WrapText = $true
    $tasks.Range("A1:K54").VerticalAlignment = -4160
    $tasks.Range("A1:K54").Borders.LineStyle = 1
    $tasks.Columns.Item("A").ColumnWidth = 11
    $tasks.Columns.Item("B").ColumnWidth = 7
    $tasks.Columns.Item("C").ColumnWidth = 18
    $tasks.Columns.Item("D").ColumnWidth = 10
    $tasks.Columns.Item("E").ColumnWidth = 18
    $tasks.Columns.Item("F").ColumnWidth = 42
    $tasks.Columns.Item("G").ColumnWidth = 38
    $tasks.Columns.Item("H").ColumnWidth = 18
    $tasks.Columns.Item("I").ColumnWidth = 14
    $tasks.Columns.Item("J").ColumnWidth = 45
    $tasks.Columns.Item("K").ColumnWidth = 38
    $tasks.Range("A1:K54").AutoFilter() | Out-Null
    $tasks.Activate()
    $excel.ActiveWindow.SplitRow = 1
    $excel.ActiveWindow.FreezePanes = $true

    $schedule = $book.Worksheets.Item("Lịch theo tuần")
    $schedule.Cells.Item(2,6).Value2 = "[FE-01] React/Vite renderer, design system, routing`n[FE-02] Electron main/preload + secure IPC"
    $schedule.Cells.Item(3,6).Value2 = "[FE-03] Desktop wireframe: setup, service health và toàn bộ luồng"
    $schedule.Cells.Item(4,6).Value2 = "[FE-04] Auth UI nối Backend local"
    $schedule.Cells.Item(5,6).Value2 = "[FE-05] Dashboard + upload file local"
    $schedule.Cells.Item(6,6).Value2 = "[FE-06] Campaign/plan/editor"
    $schedule.Cells.Item(7,6).Value2 = "[FE-07] STOMP loopback streaming"
    $schedule.Cells.Item(8,6).Value2 = "[FE-08] Setup Assistant, service health, notification"
    $schedule.Cells.Item(9,6).Value2 = "[FE-09] Facebook consent/schedule/log UI"
    $schedule.Cells.Item(10,6).Value2 = "[FE-10] Review + Golden Sample"
    $schedule.Cells.Item(11,6).Value2 = "[FE-11] Sidecar lifecycle + offline/reconnect"
    $schedule.Cells.Item(12,6).Value2 = "[FE-12] Windows Setup.exe + clean-machine test"
    $schedule.Cells.Item(13,6).Value2 = "[FE-13] Chương FE/Desktop + cài đặt + demo"
    $schedule.Range("A1:F13").WrapText = $true
    $schedule.Range("A1:F13").Borders.LineStyle = 1
    $schedule.Columns.Item("F").ColumnWidth = 42

    $progress = $book.Worksheets.Item("Mốc & Tiến độ")
    $progress.Cells.Item(4,2).Value2 = "Electron mở renderer; REST/STOMP/IPC contract được duyệt; service chỉ bind loopback"
    $progress.Cells.Item(5,2).Value2 = "Desktop login → upload local → FAISS/RAG có dẫn chứng; plan/editor hoạt động"
    $progress.Cells.Item(6,2).Value2 = "Pipeline 3 Agent và streaming chạy trong app; xử lý vẫn hoạt động offline"
    $progress.Cells.Item(7,2).Value2 = "Full flow upload → plan → generate → review → schedule → Facebook/log"
    $progress.Cells.Item(8,2).Value2 = "Setup.exe cài/chạy/gỡ trên máy sạch + kết quả đánh giá + báo cáo + demo"
    $progress.Cells.Item(13,2).Formula = '=COUNTIF(''Danh sách công việc''!$I$2:$I$54,"Chưa bắt đầu")'
    $progress.Cells.Item(14,2).Formula = '=COUNTIF(''Danh sách công việc''!$I$2:$I$54,"Đang làm")'
    $progress.Cells.Item(15,2).Formula = '=COUNTIF(''Danh sách công việc''!$I$2:$I$54,"Đã xong")'
    $progress.Cells.Item(16,2).Formula = '=COUNTIF(''Danh sách công việc''!$I$2:$I$54,"Trễ")'
    $progress.Cells.Item(17,2).Formula = '=SUM(B13:B16)'
    $progress.Cells.Item(19,2).Formula = '=IFERROR(B15/B17,0)'
    $progress.Cells.Item(19,2).NumberFormat = "0%"

    try { $architecture = $book.Worksheets.Item("Kiến trúc Desktop") }
    catch { $architecture = $book.Worksheets.Add(); $architecture.Name = "Kiến trúc Desktop" }
    $architecture.Cells.Clear()
    $architecture.Range("A1:D1").Merge()
    $architecture.Cells.Item(1,1).Value2 = "KIẾN TRÚC DESKTOP 2.0 — LOCAL-FIRST"
    $architecture.Cells.Item(1,1).Font.Bold = $true
    $architecture.Cells.Item(1,1).Font.Size = 16
    $architecture.Cells.Item(3,1).Value2 = "Thành phần"
    $architecture.Cells.Item(3,2).Value2 = "Công nghệ"
    $architecture.Cells.Item(3,3).Value2 = "Vị trí chạy"
    $architecture.Cells.Item(3,4).Value2 = "Nguyên tắc"
    $archRows = @(
        @("Desktop shell","Electron main + preload","Windows app","Secure IPC, sandbox, không remote code"),
        @("Renderer","React/TypeScript/Vite","Trong Electron","Không Node/fs/secret trực tiếp"),
        @("Core Backend","Java 17 + Spring Boot","127.0.0.1","REST/STOMP, auth, scheduler, Facebook adapter"),
        @("AI Service","Python/FastAPI","127.0.0.1","RAG/Agent/Evaluation offline"),
        @("LLM","Ollama","Máy người dùng","Không cloud LLM"),
        @("Vector DB","FAISS","Máy người dùng","Không Pinecone"),
        @("Tệp","Local app data","Máy người dùng","Không S3 trong MVP"),
        @("Auto-post","Facebook Graph API","Chỉ khi publish","Không Google Sheets; chỉ bài APPROVED"),
        @("Release","Electron Forge/Squirrel","Setup.exe","Docker chỉ dùng development")
    )
    $r = 4
    foreach ($values in $archRows) {
        for ($c=1; $c -le 4; $c++) { $architecture.Cells.Item($r,$c).Value2 = $values[$c-1] }
        $r++
    }
    $architecture.Range("A3:D3").Font.Bold = $true
    $architecture.Range("A3:D3").Font.Color = 0xFFFFFF
    $architecture.Range("A3:D3").Interior.Color = 0x7030A0
    $architecture.Range("A3:D12").WrapText = $true
    $architecture.Range("A3:D12").Borders.LineStyle = 1
    $architecture.Columns.Item("A").ColumnWidth = 20
    $architecture.Columns.Item("B").ColumnWidth = 28
    $architecture.Columns.Item("C").ColumnWidth = 22
    $architecture.Columns.Item("D").ColumnWidth = 48

    $book.Save()

    $taskRows = @()
    for ($row=2; $row -le 54; $row++) {
        $taskRows += [pscustomobject]@{
            Code=[string]$tasks.Cells.Item($row,1).Text
            Week=[string]$tasks.Cells.Item($row,2).Text
            Phase=[string]$tasks.Cells.Item($row,3).Text
            Member=[string]$tasks.Cells.Item($row,4).Text
            Role=[string]$tasks.Cells.Item($row,5).Text
            Task=[string]$tasks.Cells.Item($row,6).Text
            Output=[string]$tasks.Cells.Item($row,7).Text
            Dependencies=[string]$tasks.Cells.Item($row,8).Text
            Status=[string]$tasks.Cells.Item($row,9).Text
            Acceptance=[string]$tasks.Cells.Item($row,10).Text
            Evidence=[string]$tasks.Cells.Item($row,11).Text
        }
    }
    $book.Close($true)
} finally {
    $excel.Quit()
    [Runtime.InteropServices.Marshal]::FinalReleaseComObject($excel) | Out-Null
}

$srsHtml = @'
<!doctype html><html><head><meta charset="utf-8"><style>
@page { size:A4; margin:2cm 2cm 2cm 2.5cm; }
body { font-family:"Times New Roman"; font-size:13pt; line-height:1.35; color:#111827; }
h1 { color:#4c1d95; font-size:22pt; page-break-before:always; border-bottom:2px solid #7c3aed; padding-bottom:6px; }
h1.first { page-break-before:avoid; }
h2 { color:#5b21b6; font-size:17pt; margin-top:20px; }
h3 { color:#6d28d9; font-size:14pt; }
table { border-collapse:collapse; width:100%; margin:8px 0 16px; }
th,td { border:1px solid #6b7280; padding:6px; vertical-align:top; }
th { background:#ede9fe; font-weight:bold; }
.cover { text-align:center; margin-top:140px; }
.cover h1 { page-break-before:avoid; border:0; font-size:26pt; }
.subtitle { font-size:18pt; color:#374151; }
.note { background:#f5f3ff; border-left:5px solid #7c3aed; padding:10px; }
pre { font-family:Consolas; font-size:9pt; background:#f3f4f6; border:1px solid #d1d5db; padding:10px; }
ul,ol { margin-top:4px; }
</style></head><body>
<div class="cover"><h1 class="first">ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS)<br>VÀ PHÂN TÍCH – THIẾT KẾ HỆ THỐNG</h1><p class="subtitle">SME Marketing Automation Desktop<br>Local AI + RAG</p><p><b>Phiên bản 2.0 — Windows Desktop</b><br>Cập nhật ngày 15/07/2026<br>Đồ án tốt nghiệp — Nhóm 4 thành viên</p></div>

<h1>Kiểm soát tài liệu</h1>
<table><tr><th>Phiên bản</th><th>Ngày</th><th>Thay đổi</th></tr><tr><td>1.0</td><td>15/07/2026</td><td>Kiến trúc web microservices ban đầu.</td></tr><tr><td>2.0</td><td>15/07/2026</td><td>Chuyển đầu ra sang ứng dụng Windows .exe; thêm Electron, secure IPC, local sidecar, local storage và installer; loại S3/Pinecone/Google Sheets/cloud AI khỏi MVP.</td></tr></table>
<div class="note"><b>Quyết định nền tảng:</b> sản phẩm cuối là ứng dụng Windows cài bằng <code>SME-Marketing-Automation-Setup.exe</code>. React/Vite vẫn được tái sử dụng làm renderer. Toàn bộ xử lý tài liệu, RAG, Agent và LLM diễn ra trên máy người dùng.</div>

<h1>PHẦN I — ĐẶC TẢ YÊU CẦU</h1>
<h2>1. Giới thiệu</h2>
<h3>1.1. Mục đích</h3><p>Tài liệu mô tả yêu cầu, kiến trúc, giao diện, dữ liệu, bảo mật, đóng gói và tiêu chí nghiệm thu cho ứng dụng SME Marketing Automation Desktop. Đây là cơ sở để bốn thành viên triển khai, kiểm thử, truy vết đầu việc và bảo vệ đồ án.</p>
<h3>1.2. Phạm vi</h3><p>Hệ thống cho phép SME nạp tài liệu nội bộ, xây kho tri thức local, lập kế hoạch marketing, sinh nội dung bám nguồn bằng RAG + đa tác tử, chỉnh sửa/duyệt, lên lịch và đăng nội dung đã duyệt lên Facebook.</p>
<p><b>Trong phạm vi:</b> Windows desktop app, setup/health local service, auth/RBAC, file local, MySQL local, FAISS, Ollama, kế hoạch, sinh bài, streaming, review, scheduler, Facebook adapter, Golden Sample, đánh giá offline và Windows installer.</p>
<p><b>Ngoài phạm vi MVP:</b> mobile native, macOS/Linux release, paid ads, Pinecone, Amazon S3, cloud LLM, Google Sheets trung gian, tự động gửi nội dung chưa duyệt ra Internet, tự nhúng model nhiều GB vào installer và auto-update production.</p>
<h3>1.3. Thuật ngữ</h3>
<table><tr><th>Thuật ngữ</th><th>Ý nghĩa</th></tr>
<tr><td>Desktop shell</td><td>Electron main/preload quản lý cửa sổ, IPC và local service.</td></tr><tr><td>Renderer</td><td>Giao diện React/Vite chạy trong tiến trình renderer được sandbox.</td></tr><tr><td>Sidecar</td><td>Spring Boot hoặc FastAPI chạy cục bộ và được desktop app kiểm tra/quản lý vòng đời.</td></tr><tr><td>Local-first</td><td>Mặc định lưu và xử lý dữ liệu trên máy; kết nối ngoài phải rõ mục đích và có hành động/đồng ý của người dùng.</td></tr><tr><td>RAG</td><td>Retrieval-Augmented Generation, sinh nội dung dựa trên đoạn nguồn truy xuất.</td></tr><tr><td>FAISS</td><td>Vector index local dùng cho retrieval.</td></tr><tr><td>Ollama</td><td>Runtime chạy mô hình ngôn ngữ local.</td></tr><tr><td>Golden Sample</td><td>Nội dung chuẩn sau chỉnh sửa được dùng làm ví dụ cho các lần sinh sau.</td></tr><tr><td>IPC</td><td>Kênh giao tiếp main/preload/renderer của Electron.</td></tr><tr><td>STOMP</td><td>Giao thức messaging trên WebSocket cho streaming.</td></tr></table>

<h2>2. Mô tả tổng quan</h2>
<h3>2.1. Góc nhìn sản phẩm</h3><p>Sản phẩm là ứng dụng desktop độc lập về trải nghiệm: người dùng cài và mở từ Start Menu, không mở trình duyệt, không nhập URL và không thao tác source code. Bên trong vẫn dùng kiến trúc đa tiến trình/service để tận dụng React, Java và Python.</p>
<h3>2.2. Người dùng</h3><table><tr><th>Nhóm</th><th>Nhu cầu</th><th>Quyền chính</th></tr><tr><td>OWNER</td><td>Thiết lập doanh nghiệp và tích hợp</td><td>Toàn quyền, kết nối/ngắt Facebook</td></tr><tr><td>ADMIN</td><td>Quản trị tri thức, kế hoạch và duyệt bài</td><td>Upload, generate, approve, schedule, report</td></tr><tr><td>EDITOR</td><td>Biên tập nội dung</td><td>Sửa, gửi duyệt, xem trạng thái được cấp</td></tr></table>
<h3>2.3. Môi trường vận hành</h3><ul><li>Windows 10/11 64-bit.</li><li>Tối thiểu đề xuất: CPU 4 nhân, RAM 16 GB, còn trống 20 GB; khuyến nghị GPU tương thích Ollama và RAM 32 GB.</li><li>Ollama + model local và MySQL local là prerequisite của MVP; Setup Assistant phải kiểm tra và hướng dẫn.</li><li>Ứng dụng nghiệp vụ hoạt động khi mất Internet; chỉ publish/integration ngoài bị tạm dừng.</li></ul>
<h3>2.4. Ràng buộc</h3><ul><li>Electron + React/Vite; Java 17/Spring Boot; Python/FastAPI; MySQL; FAISS; Ollama.</li><li>Backend/AI bind 127.0.0.1, không bind 0.0.0.0 trong release.</li><li>Renderer không có Node integration; mọi native capability đi qua preload API hẹp.</li><li>Tài liệu, prompt, context RAG và nội dung chưa duyệt không gửi lên cloud.</li><li>Facebook chỉ nhận nội dung APPROVED/SCHEDULED do người dùng cấu hình.</li></ul>
<h3>2.5. Giả định và phụ thuộc</h3><p>Máy đủ tài nguyên; người dùng có quyền cài prerequisite; tài liệu đầu vào hợp lệ; Facebook Page và token có quyền phù hợp. API Facebook/điều khoản nền tảng có thể thay đổi. Code signing là tùy nguồn lực nhưng cảnh báo SmartScreen phải được ghi trong hướng dẫn.</p>

<h2>3. Yêu cầu chức năng</h2>
<h3>3.1. Vòng đời Desktop (FR-0)</h3><table><tr><th>Mã</th><th>Yêu cầu</th><th>Ưu tiên</th></tr>
<tr><td>FR-0.1</td><td>Cài/mở/gỡ ứng dụng bằng bộ cài Windows và Start Menu.</td><td>Cao</td></tr><tr><td>FR-0.2</td><td>Chỉ cho phép một instance; instance sau chuyển focus sang cửa sổ hiện có.</td><td>Trung bình</td></tr><tr><td>FR-0.3</td><td>Kiểm tra MySQL, Ollama, model, Backend và AI Service khi khởi động.</td><td>Cao</td></tr><tr><td>FR-0.4</td><td>Hiển thị Setup Assistant/service health và cách khắc phục, không để trang trắng.</td><td>Cao</td></tr><tr><td>FR-0.5</td><td>Khởi động/dừng sidecar do app sở hữu; không để tiến trình mồ côi.</td><td>Cao</td></tr><tr><td>FR-0.6</td><td>Lưu dữ liệu ứng dụng dưới thư mục local chuẩn của Windows.</td><td>Cao</td></tr><tr><td>FR-0.7</td><td>Cung cấp thông tin version, log chẩn đoán đã lọc secret và restart service có kiểm soát.</td><td>Trung bình</td></tr><tr><td>FR-0.8</td><td>Gỡ app không xóa dữ liệu nếu người dùng chưa chọn rõ ràng.</td><td>Trung bình</td></tr></table>
<h3>3.2. Tài khoản và phân quyền (FR-1)</h3><table><tr><th>Mã</th><th>Yêu cầu</th></tr><tr><td>FR-1.1</td><td>Đăng ký tài khoản gắn doanh nghiệp.</td></tr><tr><td>FR-1.2</td><td>Đăng nhập bằng email/mật khẩu; cấp access/refresh session.</td></tr><tr><td>FR-1.3</td><td>Làm mới phiên an toàn, single-flight khi nhiều request cùng 401.</td></tr><tr><td>FR-1.4</td><td>RBAC OWNER/ADMIN/EDITOR được kiểm tra server-side.</td></tr><tr><td>FR-1.5</td><td>Đăng xuất/revoke; renderer không giữ secret dài hạn.</td></tr></table>
<h3>3.3. Kho tri thức (FR-2)</h3><table><tr><th>Mã</th><th>Yêu cầu</th></tr><tr><td>FR-2.1</td><td>Upload PDF, DOCX, XLSX vào lưu trữ local.</td></tr><tr><td>FR-2.2</td><td>Làm sạch/OCR theo khả năng và báo file không đọc được.</td></tr><tr><td>FR-2.3</td><td>Chunk, embed và lưu FAISS local cùng metadata tenant/source.</td></tr><tr><td>FR-2.4</td><td>Hiển thị UPLOADED/PROCESSING/INDEXED/FAILED, số chunk và lỗi.</td></tr><tr><td>FR-2.5</td><td>Cô lập tenant ở DB, file và FAISS.</td></tr><tr><td>FR-2.6</td><td>Xóa/cập nhật tài liệu và đồng bộ index.</td></tr><tr><td>FR-2.7</td><td>Chống path traversal, kiểm MIME/kích thước và không lộ absolute path.</td></tr></table>
<h3>3.4. Kế hoạch (FR-3)</h3><table><tr><th>Mã</th><th>Yêu cầu</th></tr><tr><td>FR-3.1</td><td>Đề xuất kế hoạch tuần/tháng dựa trên tri thức local.</td></tr><tr><td>FR-3.2</td><td>Nêu sản phẩm, thông điệp, kênh, lịch dự kiến và nguồn.</td></tr><tr><td>FR-3.3</td><td>Hỗ trợ mùa vụ và ưu tiên owned media.</td></tr><tr><td>FR-3.4</td><td>Cho phép sửa/duyệt trước khi sinh nội dung.</td></tr></table>
<h3>3.5. Sinh nội dung RAG + Agent (FR-4)</h3><table><tr><th>Mã</th><th>Yêu cầu</th></tr><tr><td>FR-4.1</td><td>Workflow: trích đặc trưng → sinh nội dung → hậu kiểm/chỉnh sửa.</td></tr><tr><td>FR-4.2</td><td>Retrieval có citation/source và filter tenant.</td></tr><tr><td>FR-4.3</td><td>Kết hợp từ khóa SEO/long-tail tự nhiên.</td></tr><tr><td>FR-4.4</td><td>Fact Check List + Reflection đối chiếu nguồn.</td></tr><tr><td>FR-4.5</td><td>Không khẳng định thông số/giá khi không có bằng chứng; phải cảnh báo thiếu dữ liệu.</td></tr><tr><td>FR-4.6</td><td>Stream TOKEN/PROGRESS/COMPLETED/ERROR theo sequence.</td></tr><tr><td>FR-4.7</td><td>Output JSON tuân schema Pydantic/DTO có version.</td></tr><tr><td>FR-4.8</td><td>Cho phép cancel và không tạo post/job trùng khi reconnect.</td></tr></table>
<h3>3.6. Duyệt và chỉnh sửa (FR-5)</h3><table><tr><th>Mã</th><th>Yêu cầu</th></tr><tr><td>FR-5.1</td><td>Editor sửa title/content/image và lưu an toàn.</td></tr><tr><td>FR-5.2</td><td>State DRAFT → PENDING → APPROVED → SCHEDULED → PUBLISHED/FAILED.</td></tr><tr><td>FR-5.3</td><td>Approve/reject theo RBAC và ghi người/thời gian.</td></tr><tr><td>FR-5.4</td><td>Preview Facebook/SEO trong app; không giả định metadata SPA là public.</td></tr><tr><td>FR-5.5</td><td>Sanitize rich text để chống stored XSS.</td></tr></table>
<h3>3.7. Lịch và phân phối (FR-6)</h3><table><tr><th>Mã</th><th>Yêu cầu</th></tr><tr><td>FR-6.1</td><td>Đặt/reschedule/cancel lịch với múi giờ rõ.</td></tr><tr><td>FR-6.2</td><td>Chỉ nội dung APPROVED được publish.</td></tr><tr><td>FR-6.3</td><td>Backend gọi trực tiếp Facebook Graph API; không Google Sheets.</td></tr><tr><td>FR-6.4</td><td>Trước kết nối/đăng, hiển thị dữ liệu sẽ rời máy và xin xác nhận phù hợp.</td></tr><tr><td>FR-6.5</td><td>Retry/backoff/idempotency và publish log có external ID hoặc lỗi.</td></tr><tr><td>FR-6.6</td><td>Token không được trả cho renderer hoặc ghi log.</td></tr></table>
<h3>3.8. Phản hồi và đánh giá (FR-7/FR-8)</h3><table><tr><th>Mã</th><th>Yêu cầu</th></tr><tr><td>FR-7.1</td><td>Lưu chỉnh sửa làm Golden Sample có tenant/source/version.</td></tr><tr><td>FR-7.2</td><td>Ghi feedback explicit/implicit theo sự đồng ý.</td></tr><tr><td>FR-8.1</td><td>Chấm SEO offline mặc định; giải thích thành phần điểm.</td></tr><tr><td>FR-8.2</td><td>Local LLM-as-a-judge chấm trung thực/phù hợp.</td></tr><tr><td>FR-8.3</td><td>So sánh RAG và LLM thuần cùng cấu hình.</td></tr><tr><td>FR-8.4</td><td>Đo latency p50/p95, TTFT, RAM/CPU/GPU và độ ổn định.</td></tr><tr><td>FR-8.5</td><td>Mọi adapter đánh giá cloud là opt-in và không bắt buộc cho nghiệm thu.</td></tr></table>

<h2>4. Yêu cầu phi chức năng</h2>
<table><tr><th>Nhóm</th><th>Mã và tiêu chí</th></tr>
<tr><td>Hiệu năng</td><td>NFR-P1 retrieval &lt;1 giây cho kho vài nghìn chunk trên máy chuẩn; NFR-P2 TTFT mục tiêu &lt;3 giây sau khi model sẵn sàng; NFR-P3 UI không block khi AI chạy; ghi p50/p95.</td></tr>
<tr><td>Bảo mật</td><td>NFR-S1 dữ liệu nhạy cảm local; S2 contextIsolation/sandbox/no nodeIntegration; S3 IPC whitelist/validate sender; S4 loopback + session auth; S5 tenant isolation; S6 secret store; S7 upload validation/CSP/XSS protection.</td></tr>
<tr><td>Quyền riêng tư</td><td>NFR-L1 màn consent mô tả dữ liệu gửi ngoài; L2 không telemetry mặc định; L3 log có thời hạn và redact; L4 tuân điều khoản Facebook.</td></tr>
<tr><td>Khả dụng</td><td>NFR-U1 không cần browser; U2 luồng chính trực quan; U3 service lỗi có màn khắc phục; U4 hỗ trợ cửa sổ 1280×720 trở lên và bàn phím cơ bản.</td></tr>
<tr><td>Tin cậy</td><td>NFR-R1 ACID/migration/backup; R2 retry idempotent; R3 shutdown sạch; R4 crash renderer không phá dữ liệu; R5 hoạt động nghiệp vụ offline.</td></tr>
<tr><td>Đóng gói</td><td>NFR-D1 Setup.exe x64; D2 shortcut/uninstall/version/icon; D3 checksum; D4 clean-machine test; D5 không nhúng model nếu vượt ngân sách dung lượng.</td></tr>
<tr><td>Bảo trì</td><td>NFR-M1 contract version; M2 module tách biệt; M3 log/health; M4 tài liệu cài/chạy/khắc phục; M5 Docker chỉ là công cụ dev.</td></tr></table>

<h2>5. Giao diện ngoài</h2>
<h3>5.1. UI Desktop</h3><p>Các màn: Setup Assistant/service health, login/register, dashboard, knowledge base, campaigns/plans, post editor/review, schedule, publishing logs, reports và integrations. Tất cả lỗi route/service phải được Error Boundary hoặc trạng thái lỗi bắt và cung cấp hành động thử lại.</p>
<h3>5.2. Phần mềm</h3><table><tr><th>Hệ thống</th><th>Mục đích</th><th>Kết nối</th></tr><tr><td>Electron main/preload</td><td>Native lifecycle/IPC</td><td>IPC nội bộ có whitelist</td></tr><tr><td>Spring Boot</td><td>Core nghiệp vụ</td><td>REST/STOMP loopback</td></tr><tr><td>FastAPI</td><td>RAG/Agent/Eval</td><td>REST/stream loopback từ Backend</td></tr><tr><td>MySQL</td><td>Dữ liệu ACID</td><td>Local DB connection</td></tr><tr><td>FAISS</td><td>Vector retrieval</td><td>Thư viện/file local</td></tr><tr><td>Ollama</td><td>LLM local</td><td>HTTP loopback</td></tr><tr><td>Facebook Graph API</td><td>Publish đã duyệt</td><td>HTTPS ra ngoài theo consent</td></tr></table>

<h1>PHẦN II — PHÂN TÍCH VÀ THIẾT KẾ</h1>
<h2>6. Use Case chính</h2>
<h3>UC-00 — Khởi động ứng dụng</h3><table><tr><th>Mục</th><th>Nội dung</th></tr><tr><td>Actor</td><td>Người dùng; Electron main</td></tr><tr><td>Luồng</td><td>Single-instance → tạo data dir/session → kiểm MySQL/Ollama/model → start/check Backend/AI → mở renderer → hiển thị login/dashboard.</td></tr><tr><td>Ngoại lệ</td><td>Thiếu prerequisite hoặc health fail: mở Setup Assistant với log đã redact và nút thử lại.</td></tr><tr><td>Hậu điều kiện</td><td>UI sẵn sàng hoặc lỗi được giải thích; không có trang trắng.</td></tr></table>
<h3>UC-01 — Upload và ingest</h3><table><tr><th>Mục</th><th>Nội dung</th></tr><tr><td>Tiền điều kiện</td><td>Đã đăng nhập; service local khỏe.</td></tr><tr><td>Luồng</td><td>Chọn file → Backend kiểm MIME/size/path → lưu local → tạo PROCESSING → AI clean/chunk/embed FAISS theo tenant → INDEXED.</td></tr><tr><td>Ngoại lệ</td><td>File lỗi/quá lớn/không đọc: FAILED, không để file rác hoặc index dang dở.</td></tr></table>
<h3>UC-02 — Sinh nội dung</h3><table><tr><th>Mục</th><th>Nội dung</th></tr><tr><td>Luồng</td><td>Generate → Backend tạo job → Agent retrieve/cite → generate → fact-check/reflection → STOMP stream → lưu DRAFT.</td></tr><tr><td>Ngoại lệ</td><td>Thiếu nguồn: cảnh báo; timeout/cancel: terminal event và không tạo bài trùng.</td></tr></table>
<h3>UC-03 — Duyệt, lịch và publish</h3><table><tr><th>Mục</th><th>Nội dung</th></tr><tr><td>Luồng</td><td>Editor sửa/gửi duyệt → Admin approve → đặt lịch → Scheduler → xác nhận/integration policy → Graph API → SUCCESS/external ID.</td></tr><tr><td>Ngoại lệ</td><td>Offline/token hết hạn/API lỗi: retry/backoff hoặc FAILED; bài local không mất.</td></tr></table>

<h2>7. Kiến trúc</h2>
<pre>SME Marketing Automation.exe
├─ Electron main: window · preload · IPC · service manager
├─ React/Vite renderer: UI nghiệp vụ
├─ Spring Boot @ 127.0.0.1
│  ├─ MySQL local
│  ├─ file storage local
│  ├─ REST/STOMP + scheduler
│  └─ Facebook adapter
└─ FastAPI @ 127.0.0.1
   ├─ RAG + 3 Agent + evaluation
   ├─ FAISS local
   └─ Ollama local</pre>
<h3>7.1. Trách nhiệm thành phần</h3><table><tr><th>Thành phần</th><th>Trách nhiệm</th></tr><tr><td>Electron main</td><td>Window, single instance, IPC, paths, sidecar health/lifecycle, notification và external URL allowlist.</td></tr><tr><td>Preload</td><td>Context bridge với API tối thiểu; validate channel/payload.</td></tr><tr><td>Renderer</td><td>UI, form/state, REST/STOMP adapter; không native capability trực tiếp.</td></tr><tr><td>Backend</td><td>Auth/RBAC, nghiệp vụ, DB/file, scheduler, API/STOMP, AI orchestration và publish.</td></tr><tr><td>AI Service</td><td>Ingestion, retrieval, Agent, local judge và Ollama.</td></tr></table>
<h3>7.2. Khởi động và shutdown</h3><ol><li>Main lấy lock và data path.</li><li>Chọn/kiểm cổng, tạo session secret.</li><li>Kiểm prerequisite.</li><li>Start sidecar với environment bảo vệ.</li><li>Chờ health có timeout.</li><li>Mở renderer và cấp runtime config tối thiểu.</li><li>Khi thoát: yêu cầu shutdown, chờ, chỉ kết thúc PID do app sở hữu.</li></ol>

<h2>8. Luồng dữ liệu Local-first</h2><table><tr><th>Dữ liệu</th><th>Nơi xử lý/lưu</th><th>Ra Internet</th></tr><tr><td>Tài liệu và chunk</td><td>File local/FAISS</td><td>Không</td></tr><tr><td>Prompt/context/token AI</td><td>FastAPI/Ollama</td><td>Không</td></tr><tr><td>Nháp/Golden Sample</td><td>MySQL local</td><td>Không</td></tr><tr><td>Bài APPROVED để publish</td><td>Backend</td><td>Có, tới Facebook sau consent/cấu hình</td></tr><tr><td>Credential</td><td>Windows Credential Manager hoặc Backend secret store</td><td>Chỉ dùng trong request nền tảng</td></tr></table>

<h2>9. Thiết kế dữ liệu</h2><table><tr><th>Bảng/nhóm</th><th>Trường chính</th><th>Ràng buộc</th></tr><tr><td>businesses/users/refresh_tokens</td><td>tenant, role, credential/session metadata</td><td>Unique email theo chính sách; revoke/expiry</td></tr><tr><td>knowledge_base</td><td>business_id, local_storage_id, status, chunk_count, checksum</td><td>Không lưu đường dẫn tùy ý từ client</td></tr><tr><td>campaigns/plans/posts</td><td>tenant, state, content, schedule_at, version</td><td>State machine + optimistic lock</td></tr><tr><td>generation_jobs</td><td>job_id, state, stage, error, timestamps</td><td>Idempotency/cancel/terminal state</td></tr><tr><td>feedback/golden_samples</td><td>post/version/edits/rating</td><td>Tenant isolation/audit</td></tr><tr><td>publish_logs</td><td>post, attempt, status, external_id, redacted_error</td><td>Idempotency; không token</td></tr><tr><td>integration_settings</td><td>provider, page metadata, credential reference</td><td>Không lưu raw token trong renderer/DB nếu dùng Credential Manager</td></tr></table>
<p>FAISS index tách namespace/thư mục theo tenant, có manifest/version/checksum và quy trình rebuild từ tài liệu nguồn.</p>

<h2>10. API, STOMP và IPC</h2><p>REST có tiền tố <code>/api</code>, lỗi gồm code/message/details/traceId. STOMP event có version/jobId/sequence/type. Cần khóa login/refresh/logout, KB, campaign/plan, generate/posts, approve/reject, schedule, feedback, logs/retry, integrations và evaluation trong OpenAPI.</p>
<p>Preload API tối thiểu: getAppInfo, getRuntimeConfig, getServiceHealth, restartService, openApprovedExternalUrl và subscription health. Không phơi bày fs/shell/process/ipcRenderer nguyên bản.</p>

<h2>11. Thiết kế bảo mật</h2><ol><li>Electron: nodeIntegration=false, contextIsolation=true, sandbox=true, CSP và navigation allowlist.</li><li>IPC: validate sender/channel/schema; một method cho một capability.</li><li>Loopback: bind 127.0.0.1, session auth, CORS/origin chặt, port/PID ownership.</li><li>Input: validation, sanitize HTML, MIME/size/path checks, prepared statements/ORM.</li><li>Secret: Windows Credential Manager/Backend store; redact log; không VITE_*/localStorage/source.</li><li>Privacy: offline default, consent cho dữ liệu ra ngoài, không telemetry mặc định.</li><li>Supply chain: lockfile, version pin, dependency audit, checksum artifact và cập nhật Electron ổn định.</li></ol>

<h2>12. Đóng gói và phát hành</h2><p>Electron Forge/Squirrel.Windows tạo Setup.exe. Renderer build thành static local assets. Backend đóng JAR cùng runtime Java rút gọn; AI đóng sidecar executable/versioned artifact. Ollama/model và MySQL là prerequisite MVP được Setup Assistant kiểm tra. Docker Compose không phải runtime bắt buộc của người dùng.</p>
<table><tr><th>Artifact</th><th>Tiêu chí</th></tr><tr><td>Setup.exe</td><td>Cài/gỡ, shortcut, version/icon, x64, checksum.</td></tr><tr><td>Backend sidecar</td><td>Health/start/shutdown contract, migration, loopback.</td></tr><tr><td>AI sidecar</td><td>Health/version/model check, loopback, log redact.</td></tr><tr><td>Data directory</td><td>Quyền phù hợp, backup/restore, uninstall không xóa mặc định.</td></tr></table>

<h2>13. Kiểm thử</h2><table><tr><th>Nhóm</th><th>Bằng chứng</th></tr><tr><td>Unit/component</td><td>Renderer components, API client, STOMP parser, schema, service logic.</td></tr><tr><td>Contract</td><td>OpenAPI, Pydantic/DTO, STOMP envelope và IPC schemas.</td></tr><tr><td>Integration</td><td>Upload/ingest, generate/stream, state transition, scheduler/publish.</td></tr><tr><td>Security</td><td>IPC abuse, XSS, path traversal, tenant isolation, port binding, secret scan.</td></tr><tr><td>Offline</td><td>Tắt Internet vẫn ingest/RAG/generate/review; publish báo chờ/lỗi rõ.</td></tr><tr><td>Packaging</td><td>Cài/mở/nâng phiên bản/gỡ, restart Windows, clean-machine smoke test.</td></tr><tr><td>Performance</td><td>p50/p95, TTFT, RAM/CPU/GPU, startup time và stability soak.</td></tr></table>

<h2>14. Truy vết yêu cầu – đầu việc</h2><table><tr><th>Yêu cầu</th><th>Đầu việc chính</th></tr><tr><td>FR-0 Desktop lifecycle</td><td>FE-02, FE-08, FE-11, FE-12, BE-12, AI-14</td></tr><tr><td>FR-1 Auth</td><td>BE-04, FE-04</td></tr><tr><td>FR-2 Knowledge</td><td>AI-05…AI-09, BE-06, FE-05</td></tr><tr><td>FR-3/4 Plan & Generation</td><td>AG-03…AG-08, AI-07…AI-11, BE-07/09, FE-06/07</td></tr><tr><td>FR-5 Review</td><td>BE-05/09, FE-10</td></tr><tr><td>FR-6 Publish</td><td>BE-08/10/11, FE-09</td></tr><tr><td>FR-7/8 Feedback/Eval</td><td>AG-09…AG-13, AI-13, BE-09, FE-10/13</td></tr></table>

<h2>15. Rủi ro và giảm thiểu</h2><table><tr><th>Rủi ro</th><th>Giảm thiểu</th></tr><tr><td>Installer/model quá lớn</td><td>Không nhúng model; Setup Assistant tải khi đồng ý; model quantized.</td></tr><tr><td>Máy yếu/AI chậm</td><td>Benchmark sớm, preset model, giới hạn context, progress/cancel.</td></tr><tr><td>Sidecar/cổng lỗi</td><td>Health, timeout, PID ownership, cổng kiểm tra/động, diagnostics.</td></tr><tr><td>RCE/XSS trong Electron</td><td>Sandbox/context isolation/CSP/IPC whitelist/no remote code.</td></tr><tr><td>Lộ dữ liệu</td><td>Offline default, consent, secret store, redact, loopback.</td></tr><tr><td>Facebook thay API/token hết hạn</td><td>Adapter riêng, health integration, retry/idempotency, demo fallback.</td></tr></table>

<h2>16. Tiêu chí chấp nhận cuối</h2><ol><li>Có Setup.exe và checksum; cài/mở/gỡ được trên Windows sạch.</li><li>Người dùng không cần browser hoặc chạy terminal để dùng luồng chính.</li><li>Tắt Internet vẫn login local, upload, RAG, plan, generate và review.</li><li>Không service nào listen trên LAN; IPC/renderer không có quyền quá mức.</li><li>Không S3/Pinecone/Google Sheets/cloud LLM trong đường dữ liệu mặc định.</li><li>Full flow chạy; chỉ bài đã duyệt mới ra Facebook và có publish log.</li><li>Không trang trắng; service lỗi có chẩn đoán/try again.</li><li>Tài liệu, bảng công việc, code và bản demo nhất quán với phiên bản 2.0.</li></ol>
</body></html>
'@

$srsHtmlPath = Join-Path $tempRoot "srs-desktop.html"
[IO.File]::WriteAllText($srsHtmlPath, $srsHtml, [Text.UTF8Encoding]::new($false))

$taskHtmlBuilder = [Text.StringBuilder]::new()
[void]$taskHtmlBuilder.Append(@'
<!doctype html><html><head><meta charset="utf-8"><style>
@page { size:A4; margin:2cm; } body{font-family:"Times New Roman";font-size:13pt;line-height:1.35;color:#111827} h1{color:#4c1d95;font-size:22pt;page-break-before:always;border-bottom:2px solid #7c3aed} h1.first{page-break-before:avoid} h2{color:#5b21b6;font-size:17pt;page-break-before:always} h3{color:#6d28d9;font-size:14pt;margin-bottom:4px} table{border-collapse:collapse;width:100%;margin:8px 0 15px} th,td{border:1px solid #6b7280;padding:6px;vertical-align:top} th{background:#ede9fe}.task{border-left:5px solid #7c3aed;background:#fafafa;padding:8px;margin:8px 0 18px}.cover{text-align:center;margin-top:150px}.cover h1{border:0;page-break-before:avoid}.status{font-weight:bold;color:#5b21b6}
</style></head><body><div class="cover"><h1 class="first">GIẢI THÍCH CHI TIẾT ĐẦU VIỆC</h1><p>SME Marketing Automation Desktop — Local AI + RAG</p><p><b>Phiên bản 2.0 — 53 công việc / 12 tuần</b><br>Cập nhật ngày 15/07/2026</p></div>
<h1>Hướng dẫn sử dụng tài liệu</h1><p>Mỗi đầu việc có mô tả, output, phụ thuộc, tiêu chí nghiệm thu và bằng chứng. “Đã xong” chỉ được dùng khi output chạy lại được và có bằng chứng. “Đang làm” có thể là UI/mock đã có nhưng chưa tích hợp service thật.</p><table><tr><th>Nguyên tắc</th><th>Áp dụng</th></tr><tr><td>Đầu ra</td><td>Windows Setup.exe; Docker/Vite dev server không phải sản phẩm cuối.</td></tr><tr><td>Local-first</td><td>Không S3/Pinecone/Google Sheets/cloud LLM trong MVP.</td></tr><tr><td>Bảo mật</td><td>Loopback, secure IPC, secret store và không secret trong renderer/log.</td></tr><tr><td>Definition of Done</td><td>Code/artifact + test + tài liệu + bằng chứng + review.</td></tr></table>
'@)

$groups = $taskRows | Group-Object Member
foreach ($group in $groups) {
    $first = $group.Group | Select-Object -First 1
    [void]$taskHtmlBuilder.Append("<h2>$(Html $group.Name) — $(Html $first.Role)</h2>")
    foreach ($task in $group.Group) {
        [void]$taskHtmlBuilder.Append("<div class='task'><h3>$(Html $task.Code) — Tuần $(Html $task.Week) — $(Html $task.Task)</h3>")
        [void]$taskHtmlBuilder.Append("<p><b>Giai đoạn:</b> $(Html $task.Phase)<br><b>Trạng thái:</b> <span class='status'>$(Html $task.Status)</span><br><b>Phụ thuộc:</b> $(Html $task.Dependencies)</p>")
        [void]$taskHtmlBuilder.Append("<p><b>Mô tả:</b> $(Html $task.Task). Công việc phải triển khai theo kiến trúc Desktop 2.0, có xử lý trường hợp lỗi và không làm suy yếu ranh giới local-first.</p>")
        [void]$taskHtmlBuilder.Append("<p><b>Output / sản phẩm bàn giao:</b> $(Html $task.Output)</p>")
        [void]$taskHtmlBuilder.Append("<p><b>Tiêu chí hoàn thành:</b> $(Html $task.Acceptance)</p>")
        [void]$taskHtmlBuilder.Append("<p><b>Bằng chứng và lưu ý:</b> $(Html $task.Evidence)</p></div>")
    }
}
[void]$taskHtmlBuilder.Append("<h1>Checklist nghiệm thu toàn hệ</h1><ol><li>Setup.exe cài/mở/gỡ trên Windows sạch.</li><li>Không cần browser; service chỉ bind loopback.</li><li>Tắt Internet vẫn chạy toàn bộ AI/RAG và nghiệp vụ local.</li><li>Chỉ bài APPROVED được gửi Facebook; có consent và log.</li><li>Không secret trong Git, renderer hoặc log.</li><li>API/STOMP/IPC contract và tài liệu khớp artifact cuối.</li></ol></body></html>")
$taskHtmlPath = Join-Path $tempRoot "task-explanations-desktop.html"
[IO.File]::WriteAllText($taskHtmlPath, $taskHtmlBuilder.ToString(), [Text.UTF8Encoding]::new($false))

$docxGenerator = Join-Path $PSScriptRoot "html_to_docx.cjs"
& node $docxGenerator
if ($LASTEXITCODE -ne 0) {
    throw "Không thể tạo DOCX bằng $docxGenerator"
}

$repoDocs = Join-Path (Split-Path $PSScriptRoot -Parent) "docs"
New-Item -ItemType Directory -Force -Path $repoDocs | Out-Null
Copy-Item -LiteralPath $srsPath -Destination (Join-Path $repoDocs "SRS_Phan_tich_thiet_ke_Desktop_v2.docx") -Force
Copy-Item -LiteralPath $taskDocPath -Destination (Join-Path $repoDocs "Giai_thich_dau_viec_Desktop_v2.docx") -Force
Copy-Item -LiteralPath $workbookPath -Destination (Join-Path $repoDocs "Bang_cong_viec_do_an_Desktop_v2.xlsx") -Force

Write-Output "Đã cập nhật:"
Write-Output $srsPath
Write-Output $taskDocPath
Write-Output $workbookPath
