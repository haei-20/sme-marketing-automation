# AI-02 – LLM Model Benchmark and Selection

## 1. Mục tiêu

AI-02 thực hiện benchmark các mô hình ngôn ngữ có khả năng chạy local để lựa chọn model phù hợp cho AI Service của hệ thống SME Marketing Automation.

Model được lựa chọn cần cân bằng ba yếu tố chính:

- Chất lượng đầu ra, đặc biệt với nội dung tiếng Việt và dữ liệu có grounding.
- Hiệu năng suy luận trên phần cứng hiện tại.
- Mức sử dụng tài nguyên phù hợp với môi trường phát triển/demo.

Benchmark được thực hiện với 3 model:

- `qwen3:0.6b`
- `qwen3:1.7b`
- `llama3.2:3b`

Các model được chạy local thông qua Ollama.

---

## 2. Môi trường benchmark

### 2.1. Phần cứng

| Thành phần | Cấu hình |
|---|---|
| CPU | Intel Core i5-11300H @ 3.10 GHz |
| RAM | Khoảng 8 GB |
| GPU | Intel Iris Xe Graphics |
| Inference processor | 100% CPU |

Do máy benchmark không có GPU rời phù hợp cho inference, các model trong phép thử đều được Ollama chạy bằng CPU.

### 2.2. Phần mềm

- Python 3.13
- Ollama
- FastAPI AI Service
- `httpx`
- Windows
- Context được Ollama cấp trong phép đo tài nguyên: `4096`

---

## 3. Các model được đánh giá

| Model | Kích thước tải về | Runtime SIZE (`ollama ps`) | Processor | Context |
|---|---:|---:|---|---:|
| `qwen3:0.6b` | 522 MB | 1.0 GB | 100% CPU | 4096 |
| `qwen3:1.7b` | 1.4 GB | 1.9 GB | 100% CPU | 4096 |
| `llama3.2:3b` | 2.0 GB | 2.6 GB | 100% CPU | 4096 |

> `Runtime SIZE` là giá trị do `ollama ps` báo khi model đang được load. Giá trị này được sử dụng để so sánh tương đối mức tài nguyên runtime giữa các model, không được xem là phép đo chính xác toàn bộ RAM hệ thống.

---

## 4. Thiết kế benchmark

### 4.1. Bộ prompt

Benchmark sử dụng 5 nhóm prompt:

| ID | Nhóm kiểm thử | Mục đích |
|---|---|---|
| BM-01 | Vietnamese Marketing | Kiểm tra khả năng tạo nội dung marketing tiếng Việt và bám dữ liệu nguồn |
| BM-02 | Hallucination Check | Kiểm tra khả năng từ chối suy diễn khi dữ liệu không đủ |
| BM-03 | JSON Output | Kiểm tra khả năng trả structured output đúng yêu cầu |
| BM-04 | Vietnamese Summary | Kiểm tra khả năng tóm tắt tiếng Việt và grounding |
| BM-05 | Instruction Following | Kiểm tra mức độ tuân thủ yêu cầu về format và nội dung |

Mỗi prompt được chạy 3 lần trên mỗi model.

Tổng số request:

```text
3 models × 5 prompts × 3 runs = 45 requests
```

Kết quả chi tiết được lưu tại:

```text
benchmark/results_3runs.csv
```

### 4.2. Các chỉ số hiệu năng

#### Total latency

Thời gian tổng cộng để Ollama xử lý một request:

```text
total_seconds = total_duration / 1,000,000,000
```

Đơn vị: giây.

Giá trị càng thấp thì phản hồi càng nhanh.

#### Load time

Thời gian cần để load model:

```text
load_seconds = load_duration / 1,000,000,000
```

Chỉ số này đặc biệt ảnh hưởng đến cold start.

#### Prompt evaluation time

Thời gian model xử lý prompt đầu vào:

```text
prompt_eval_seconds = prompt_eval_duration / 1,000,000,000
```

#### Generation time

Thời gian model sinh output:

```text
eval_seconds = eval_duration / 1,000,000,000
```

#### Generation throughput

Tốc độ sinh token:

```text
tokens_per_second = generated_tokens / eval_seconds
```

Đơn vị: token/giây.

Giá trị càng cao thì model sinh nội dung càng nhanh.

#### Average latency

```text
Average = Sum(total_seconds) / Number of requests
```

Cho biết thời gian phản hồi trung bình.

#### Median latency

Median là giá trị ở giữa sau khi sắp xếp latency của các request.

Chỉ số này thể hiện latency của một request điển hình và ít bị ảnh hưởng bởi outlier hơn Average.

#### P95 latency

P95 biểu diễn ngưỡng mà khoảng 95% request có latency nhỏ hơn hoặc bằng giá trị này.

Chỉ số này được dùng để đánh giá các trường hợp phản hồi tương đối chậm.

---

## 5. Kết quả hiệu năng

Kết quả tổng hợp từ 45 lượt benchmark:

| Model | Avg Latency | Median | P95 | Avg Token/s |
|---|---:|---:|---:|---:|
| `qwen3:0.6b` | **7.70 s** | **7.50 s** | **12.40 s** | **36.76** |
| `qwen3:1.7b` | 24.89 s | 19.07 s | 48.49 s | 15.32 |
| `llama3.2:3b` | 11.21 s | 10.26 s | 24.25 s | 9.44 |

### Nhận xét

`qwen3:0.6b` đạt hiệu năng tốt nhất trên phần cứng benchmark:

- Average latency thấp nhất.
- Median latency thấp nhất.
- P95 thấp nhất.
- Token/s cao nhất.
- Runtime SIZE nhỏ nhất.

`qwen3:1.7b` có thời gian phản hồi cao nhất trong benchmark hiện tại.

`llama3.2:3b` có latency thấp hơn `qwen3:1.7b`, nhưng tốc độ sinh token thấp nhất và runtime footprint lớn nhất.

---

## 6. Đánh giá chất lượng

Chất lượng được đánh giá thủ công trên các output benchmark theo 4 tiêu chí.

### 6.1. Factual / Grounding

Đánh giá model có sử dụng đúng dữ liệu được cung cấp và tránh tạo thêm claim không có nguồn hay không.

Trọng số:

```text
40%
```

### 6.2. Instruction Following

Đánh giá khả năng tuân thủ các yêu cầu như:

- Số câu.
- Số bullet.
- Không thêm thông tin.
- Đúng format yêu cầu.

Trọng số:

```text
25%
```

### 6.3. Vietnamese Quality

Đánh giá:

- Độ tự nhiên của tiếng Việt.
- Khả năng diễn đạt.
- Tính rõ ràng.
- Lỗi ngôn ngữ.

Trọng số:

```text
20%
```

### 6.4. Structured Output

Đánh giá khả năng trả structured output, đặc biệt JSON, đúng yêu cầu.

Trọng số:

```text
15%
```

Quality Score:

```text
Quality =
    0.40 × Factual
  + 0.25 × Instruction
  + 0.20 × Vietnamese
  + 0.15 × Structured
```

---

## 7. Nhận xét chất lượng theo benchmark

### 7.1. qwen3:0.6b

Ưu điểm:

- Phát hiện tốt trường hợp dữ liệu không đủ trong BM-02.
- Khả năng tóm tắt và bám dữ liệu tương đối tốt trong BM-04.
- Tốc độ phản hồi rất tốt.
- Phù hợp với môi trường tài nguyên hạn chế.

Hạn chế:

- Structured output chưa ổn định.
- Trong BM-03 chỉ 1/3 lần trả JSON thuần đúng yêu cầu; hai lần còn lại bao JSON bằng Markdown code fence.
- Instruction following chưa hoàn toàn ổn định.
- Vẫn xuất hiện hallucination/suy diễn trong bài toán marketing.
- Có trường hợp chất lượng tiếng Việt chưa hoàn toàn ổn định.

### 7.2. qwen3:1.7b

Ưu điểm:

- JSON output ổn định trong benchmark.
- Tiếng Việt tự nhiên.
- Nhận biết tốt khi dữ liệu không đủ.

Hạn chế:

- Latency cao trên phần cứng hiện tại.
- Runtime footprint cao hơn `qwen3:0.6b`.
- Vẫn xuất hiện hallucination.
- Có trường hợp tự bổ sung thông tin không tồn tại trong input.

### 7.3. llama3.2:3b

Ưu điểm:

- JSON output ổn định.
- Khả năng diễn đạt tiếng Việt tương đối tự nhiên.
- Khả năng tuân thủ format tương đối tốt ở một số prompt.

Hạn chế:

- Runtime footprint lớn nhất.
- Token/s thấp nhất.
- Có xu hướng mở rộng nội dung ngoài dữ liệu nguồn.
- Một số output marketing bỏ sót dữ liệu đầu vào quan trọng.

---

## 8. Quality Score

Rubric 1–5 được sử dụng để đánh giá các tiêu chí chất lượng.

Kết quả tổng hợp:

| Model | Factual | Instruction | Vietnamese | Structured | Quality / 5 | Quality / 10 |
|---|---:|---:|---:|---:|---:|---:|
| `qwen3:0.6b` | 4.5 | 4.1 | 4.5 | 2.3 | 4.07 | 8.14 |
| `qwen3:1.7b` | 3.6 | 4.1 | 4.7 | 5.0 | 4.16 | **8.31** |
| `llama3.2:3b` | 3.4 | 4.1 | 4.2 | 5.0 | 3.98 | 7.95 |

Các điểm chất lượng trên là kết quả đánh giá thủ công dựa trên output benchmark và rubric đã định nghĩa, không phải metric tự động do Ollama cung cấp.

---

## 9. Performance Score

Performance Score được chuẩn hóa về thang 10 dựa trên latency và generation throughput:

```text
Performance =
10 × [
    0.5 × (BestLatency / ModelLatency)
    +
    0.5 × (ModelTPS / BestTPS)
]
```

Kết quả:

| Model | Performance Score |
|---|---:|
| `qwen3:0.6b` | **10.00** |
| `qwen3:1.7b` | 3.63 |
| `llama3.2:3b` | 4.72 |

---

## 10. Resource Score

Resource Score được chuẩn hóa tương đối dựa trên runtime SIZE do `ollama ps` cung cấp:

```text
ResourceScore =
10 × (SmallestRuntimeSize / ModelRuntimeSize)
```

Kết quả:

| Model | Runtime SIZE | Resource Score |
|---|---:|---:|
| `qwen3:0.6b` | 1.0 GB | **10.00** |
| `qwen3:1.7b` | 1.9 GB | 5.26 |
| `llama3.2:3b` | 2.6 GB | 3.85 |

---

## 11. Final Score

Model cuối cùng được đánh giá theo ba nhóm:

```text
Quality      = 50%
Performance  = 30%
Resource     = 20%
```

Công thức:

```text
FinalScore =
    0.50 × QualityScore
  + 0.30 × PerformanceScore
  + 0.20 × ResourceScore
```

Kết quả:

| Model | Quality /10 | Performance /10 | Resource /10 | Final Score |
|---|---:|---:|---:|---:|
| `qwen3:0.6b` | 8.14 | 10.00 | 10.00 | **9.07** |
| `qwen3:1.7b` | 8.31 | 3.63 | 5.26 | **6.30** |
| `llama3.2:3b` | 7.95 | 4.72 | 3.85 | **6.16** |

---

## 12. Model được lựa chọn

### Selected Model: `qwen3:0.6b`

`qwen3:0.6b` được lựa chọn làm model local mặc định cho môi trường phát triển/demo hiện tại.

Lý do:

1. Hiệu năng tốt nhất trong ba model trên phần cứng benchmark.
2. Runtime footprint thấp nhất.
3. Chất lượng tổng thể vẫn ở mức phù hợp so với hai model còn lại.
4. Khả năng nhận biết dữ liệu không đủ tốt trong benchmark hallucination check.
5. Phù hợp hơn với môi trường chỉ có khoảng 8 GB RAM và inference bằng CPU.

Mặc dù `qwen3:1.7b` đạt Quality Score cao hơn một mức nhỏ, lợi thế chất lượng không đủ lớn để bù lại latency và tài nguyên cao hơn đáng kể trên môi trường hiện tại.

Do đó, kết luận của benchmark không phải `qwen3:0.6b` là model tốt nhất nói chung, mà là:

> `qwen3:0.6b` là model phù hợp nhất trong ba model được benchmark đối với yêu cầu và phần cứng hiện tại của dự án.

---

## 13. Hạn chế và biện pháp xử lý

### 13.1. Hallucination

Cả ba model đều có thể tạo thêm claim không tồn tại trong dữ liệu nguồn, đặc biệt trong bài toán marketing.

Vì vậy model không được sử dụng như nguồn dữ liệu độc lập.

Luồng dự kiến:

```text
User Request
    ↓
RAG Retrieval
    ↓
Relevant Context
    ↓
Grounded Prompt
    ↓
LLM
    ↓
Validation / Review
    ↓
Final Content
```

### 13.2. Structured output

`qwen3:0.6b` chưa tuân thủ strict JSON ổn định.

Do đó structured output cần được validate bằng schema, ví dụ Pydantic.

Luồng dự kiến:

```text
LLM Output
    ↓
JSON Parser
    ↓
Pydantic Validation
    ↓
Valid?
   / \
 Yes  No
  |    |
Use   Retry / Repair
```

### 13.3. Phạm vi benchmark

Benchmark hiện tại chỉ thực hiện:

- 3 model.
- 5 nhóm prompt.
- 3 lần chạy mỗi prompt.
- Một cấu hình phần cứng.
- CPU inference.

Kết quả lựa chọn có thể thay đổi nếu:

- Triển khai trên GPU.
- Có nhiều RAM hơn.
- Thay đổi quantization.
- Thay đổi context size.
- Sử dụng prompt khác.
- Benchmark thêm model khác.

---

## 14. Artifacts

Các artifact của AI-02:

```text
benchmark/prompts.json
benchmark/results_3runs.csv
scripts/benchmark_llm.py
docs/AI-02-model-benchmark.md
```

Model local được sử dụng:

```text
qwen3:0.6b
```

---

## 15. Kết luận

AI-02 đã benchmark thành công ba LLM local với tổng cộng 45 lượt inference.

Kết quả cho thấy `qwen3:0.6b` đạt sự cân bằng tốt nhất giữa:

- Chất lượng.
- Tốc độ.
- Tài nguyên.

Model này được chọn làm model local mặc định cho giai đoạn phát triển/demo tiếp theo của AI Service.

Các hạn chế về hallucination và structured output sẽ được kiểm soát ở các tầng RAG, prompt grounding, schema validation và review trong các task tiếp theo.