# Công cụ cập nhật tài liệu

`update_project_documents.ps1` cập nhật workbook công việc bằng Excel COM, tạo nguồn HTML UTF-8 và gọi `html_to_docx.cjs` để tạo hai DOCX chính.

## Chuẩn bị một lần

```powershell
npm.cmd install --prefix .doc-tools
```

## Tạo lại toàn bộ tài liệu

Mở PowerShell với quyền cho phép chạy Excel COM:

```powershell
$source = Get-Content -Raw -Encoding UTF8 .\scripts\update_project_documents.ps1
& ([ScriptBlock]::Create($source)) -WorkspaceRoot C:\DoAn
```

Script giữ bản sao tài liệu web v1 nếu backup chưa tồn tại, cập nhật Excel rồi tạo:

- `C:\DoAn\SRS_Phan_tich_thiet_ke.docx`
- `C:\DoAn\Giai_thich_dau_viec.docx`
- `C:\DoAn\Bang_cong_viec_do_an (1).xlsx`

Đồng thời script sao chép ba artifact với hậu tố `Desktop_v2` vào thư mục `docs/` của repository để nhóm có thể review và commit.

Nếu workbook đã cập nhật và chỉ cần tạo lại Word:

```powershell
node .\scripts\html_to_docx.cjs
```

Hai file HTML trung gian được tạo dưới `%TEMP%\sme-desktop-docs`. Không chỉnh DOCX thủ công nếu thay đổi có thể được đưa vào script, vì SRS, giải thích đầu việc và Excel cần giữ đồng bộ.
