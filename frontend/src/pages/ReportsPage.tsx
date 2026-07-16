import { Activity, BadgeCheck, BrainCircuit, Download, Gauge, TrendingDown } from "lucide-react";
import { Helmet } from "react-helmet-async";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageHeader,
  Progress,
  StatCard,
} from "@/components";
import { mockEvaluations, mockGenerationJobs } from "@/lib";

const comparisonData = [
  { metric: "Trung thực", rag: 96, baseline: 76 },
  { metric: "Đúng ngữ cảnh", rag: 91, baseline: 72 },
  { metric: "SEO", rag: 86, baseline: 68 },
  { metric: "Cấu trúc", rag: 94, baseline: 81 },
];

const latencyData = [
  { run: "Lần 1", retrieval: 720, generation: 11200 },
  { run: "Lần 2", retrieval: 640, generation: 9800 },
  { run: "Lần 3", retrieval: 580, generation: 8420 },
  { run: "Lần 4", retrieval: 610, generation: 9100 },
  { run: "Lần 5", retrieval: 560, generation: 8250 },
];

const tooltipStyle = {
  borderRadius: 14,
  border: "1px solid #e2e8f0",
  boxShadow: "0 12px 28px rgb(15 23 42 / 0.1)",
  fontSize: 12,
};

export function ReportsPage() {
  const evaluation = mockEvaluations[0];
  const completedJobs = mockGenerationJobs.filter((job) => job.status === "DONE" && job.latencyMs);
  const averageLatency = completedJobs.length
    ? Math.round(completedJobs.reduce((sum, job) => sum + (job.latencyMs ?? 0), 0) / completedJobs.length)
    : evaluation.latencyMs;

  return (
    <>
      <Helmet>
        <title>Đánh giá chất lượng | SMEFlow AI</title>
        <meta name="description" content="So sánh RAG và LLM thuần theo độ trung thực, SEO và hiệu năng." />
      </Helmet>
      <PageHeader
        eyebrow="Đo lường & kiểm chứng"
        title="Chất lượng nội dung AI"
        description="Kết quả đánh giá minh bạch theo độ trung thực, phù hợp ngữ cảnh, SEO và hiệu năng suy luận."
        actions={<Button variant="outline" leftIcon={<Download size={17} />}>Xuất báo cáo</Button>}
        meta={
          <>
            <Badge tone="success">RAG + 3 tác tử</Badge>
            <Badge tone="neutral">Mẫu demo • n=24 bài</Badge>
          </>
        }
      />

      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Độ trung thực" value={`${evaluation.faithfulness.score}/100`} icon={<BadgeCheck size={20} />} delta="+20 điểm" trend="up" description="so với LLM thuần" />
        <StatCard title="Tỷ lệ ảo giác" value={`${Math.round((evaluation.hallucinationRate ?? 0) * 100)}%`} icon={<TrendingDown size={20} />} delta="-16 điểm %" trend="up" description="sau khi dùng RAG" />
        <StatCard title="Điểm SEO" value={`${evaluation.seo.score}/100`} icon={<Gauge size={20} />} delta="Tốt" trend="up" description="long-tail tự nhiên" />
        <StatCard title="Latency trung bình" value={`${(averageLatency / 1000).toFixed(1)}s`} icon={<Activity size={20} />} delta="Local LLM" description="từ yêu cầu đến hoàn tất" />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card variant="elevated">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>RAG so với LLM thuần</CardTitle>
                <CardDescription>Điểm trung bình trên cùng tập prompt và dữ liệu sản phẩm.</CardDescription>
              </div>
              <Badge tone="purple" leadingIcon={<BrainCircuit size={12} />}>LLM-as-a-judge</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] w-full" role="img" aria-label="Biểu đồ so sánh RAG và LLM thuần">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} barGap={6}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="metric" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 14 }} />
                  <Bar name="RAG + tác tử" dataKey="rag" fill="#10b981" radius={[7, 7, 0, 0]} />
                  <Bar name="LLM thuần" dataKey="baseline" fill="#cbd5e1" radius={[7, 7, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Chi tiết lần đánh giá gần nhất</CardTitle>
            <CardDescription>{evaluation.modelName} • {new Date(evaluation.evaluatedAt).toLocaleString("vi-VN")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {[
              { label: "Trung thực với nguồn", score: evaluation.faithfulness.score, text: evaluation.faithfulness.explanation },
              { label: "Phù hợp ngữ cảnh", score: evaluation.contextualRelevance?.score ?? 0, text: evaluation.contextualRelevance?.explanation },
              { label: "Tối ưu SEO", score: evaluation.seo.score, text: evaluation.seo.explanation },
            ].map((item) => (
              <div key={item.label}>
                <Progress value={item.score} label={item.label} showValue />
                <p className="mt-2 text-xs leading-5 text-slate-500">{item.text}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card variant="elevated" className="mt-6">
        <CardHeader>
          <CardTitle>Hiệu năng pipeline</CardTitle>
          <CardDescription>Retrieval dưới 1 giây; generation phụ thuộc cấu hình Local LLM.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] w-full" role="img" aria-label="Biểu đồ latency pipeline">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={latencyData}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="run" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} unit="ms" />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line name="Retrieval" type="monotone" dataKey="retrieval" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                <Line name="Sinh nội dung" type="monotone" dataKey="generation" stroke="#f47a61" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
