
# AG-01 – Nghiên cứu và lựa chọn framework Multi-Agent

## 1. Thông tin đầu việc

- Mã công việc: AG-01
- Người thực hiện: TV2
- Vai trò: Agent/Eval
- Mức ưu tiên: P0 – Nền móng
- Trạng thái: Đang thực hiện

## 2. Mục tiêu

Nghiên cứu và so sánh LangGraph, CrewAI và workflow tự xây dựng bằng
Python để lựa chọn framework điều phối ba Agent của hệ thống.

Framework được chọn phải chạy được hoàn toàn trên máy người dùng, sử
dụng Local LLM qua Ollama và không gửi dữ liệu doanh nghiệp lên dịch vụ
AI đám mây.

## 3. Workflow ba Agent của dự án

### 3.1. Extracting Features Agent

Trích xuất các đặc trưng sản phẩm từ thông tin do người dùng cung cấp và
dữ liệu được truy xuất từ RAG.

### 3.2. Description Generating Agent

Sử dụng đặc trưng sản phẩm để sinh tiêu đề, nội dung marketing, CTA và
hashtag theo cấu trúc JSON.

### 3.3. Post-checking & Editing Agent

Kiểm tra tính trung thực, mức độ phù hợp và định dạng nội dung. Nếu nội
dung chưa đạt, Agent trả hướng dẫn để Description Generating Agent sửa lại.

## 4. Yêu cầu đối với framework

- Chạy hoàn toàn offline/local.
- Tích hợp được Ollama và Local LLM.
- Điều phối được ba Agent.
- Lưu và truyền trạng thái giữa các Agent.
- Hỗ trợ workflow có điều kiện.
- Cho phép Agent hậu kiểm yêu cầu sinh lại nội dung.
- Giới hạn số lần sinh lại để tránh vòng lặp vô hạn.
- Validate JSON bằng Pydantic.
- Ghi log và thời gian thực hiện của từng Agent.
- Dễ viết unit test và evaluation.
- Có thể tích hợp RAG của TV1.

## 5. Tiêu chí đánh giá

| Tiêu chí                            | Trọng số |
| ------------------------------------- | ---------: |
| Phù hợp workflow ba Agent           |        20% |
| Hỗ trợ state, rẽ nhánh và retry  |        20% |
| Tích hợp Ollama/Local LLM           |        15% |
| Hỗ trợ Pydantic/JSON                |        15% |
| Khả năng kiểm thử và đánh giá |        10% |
| Mức độ dễ phát triển            |        10% |
| Khả năng bảo trì và mở rộng    |        10% |

## 6. Đánh giá LangGraph

### Ưu điểm

- Mô hình workflow dưới dạng graph.
- Có state chung cho toàn bộ luồng.
- Hỗ trợ conditional edge và vòng lặp.
- Phù hợp luồng hậu kiểm rồi yêu cầu sinh lại.
- Có thể kiểm thử từng node độc lập.
- Tích hợp được Ollama và Pydantic.

### Hạn chế

- Cần thời gian học khái niệm graph và state.
- Cấu hình ban đầu phức tạp hơn workflow Python đơn giản.
- Cần kiểm soát vòng lặp và trạng thái cẩn thận.

## 7. Đánh giá CrewAI

### Ưu điểm

- Cách tổ chức Agent theo role và task dễ hiểu.
- Khai báo Agent nhanh.
- Phù hợp POC hoặc luồng làm việc tuần tự.

### Hạn chế

- Việc kiểm soát state và vòng lặp phức tạp kém trực quan hơn LangGraph.
- Khó kiểm soát chi tiết khi workflow có nhiều điều kiện.
- Có thể tạo thêm abstraction không cần thiết.

## 8. Đánh giá Custom Python

### Ưu điểm

- Toàn quyền kiểm soát source code.
- Ít dependency.
- Dễ hiểu khi workflow còn rất nhỏ.

### Hạn chế

- Phải tự xây state management.
- Phải tự xây routing, retry và error handling.
- Phải tự xây logging và khả năng quan sát.
- Chi phí bảo trì tăng khi workflow mở rộng.

## 9. Bảng so sánh

| Tiêu chí                  | LangGraph | CrewAI | Custom Python |
| --------------------------- | --------: | -----: | ------------: |
| Workflow ba Agent           |         5 |      4 |             3 |
| State và truyền dữ liệu |         5 |      4 |             3 |
| Rẽ nhánh và retry        |         5 |      3 |             3 |
| Ollama/Local LLM            |         4 |      4 |             5 |
| Pydantic/JSON               |         5 |      4 |             5 |
| Kiểm thử từng bước     |         5 |      4 |             4 |
| Dễ bắt đầu              |         3 |      5 |             4 |
| Bảo trì, mở rộng        |         5 |      4 |             2 |

Thang điểm: 1 = không phù hợp, 5 = rất phù hợp.

## 10. POC kiểm chứng

POC mô phỏng workflow:

1. Extracting Features Agent tạo danh sách đặc trưng sản phẩm.
2. Description Generating Agent sinh nội dung.
3. Post-checking & Editing Agent kiểm tra nội dung.
4. Nếu chưa đạt, workflow quay lại bước sinh nội dung.
5. Workflow chỉ cho phép sửa tối đa hai lần.
6. Khi đạt hoặc hết số lần sửa, workflow kết thúc.

File POC:

`ai-service/experiments/ag01_multi_agent_poc.py`

## 11. Đề xuất lựa chọn

TV2 đề xuất sử dụng LangGraph làm framework Multi-Agent.

LangGraph phù hợp nhất vì hệ thống cần state chung, luồng có điều kiện và
vòng lặp từ Post-checking & Editing Agent về Description Generating Agent.
Framework cũng thuận lợi cho việc kiểm thử, ghi log và đánh giá từng Agent.

## 12. Rủi ro và phương án xử lý

| Rủi ro                            | Phương án                                      |
| ---------------------------------- | ------------------------------------------------- |
| Thành viên chưa quen LangGraph  | Xây POC tối thiểu và viết hướng dẫn chạy |
| Vòng lặp Agent không kết thúc | Giới hạn`max_revisions`                       |
| LLM trả JSON sai                  | Validate bằng Pydantic                           |
| Local LLM xử lý chậm            | Ghi latency từng node để đánh giá           |
| RAG chưa hoàn thành             | Dùng mock RAG theo contract thống nhất         |
| Framework thay đổi phiên bản   | Khóa phiên bản dependency                      |

## 13. Kết luận

LangGraph hiện là framework được TV2 đề xuất. Quyết định chính thức được
chốt sau khi POC chạy thành công và có ít nhất một thành viên review.

## 14. Review

- Người review:
- Ngày review:
- Ý kiến:
- Quyết định cuối cùng:
