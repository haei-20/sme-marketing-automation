import {
  Bot,
  Check,
  Cloud,
  ExternalLink,
  FileSpreadsheet,
  KeyRound,
  SearchCheck,
  ShieldCheck,
  MessagesSquare,
} from "lucide-react";
import { Helmet } from "react-helmet-async";

import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageHeader,
} from "@/components";

const integrations = [
  {
    name: "Ollama Local LLM",
    description: "Mô hình Qwen/Llama chạy trong hạ tầng riêng.",
    icon: Bot,
    status: "connected",
    meta: "llama-3.1-8b • 22 token/s",
  },
  {
    name: "Amazon S3",
    description: "Lưu tài liệu và hình ảnh qua URL có kiểm soát.",
    icon: Cloud,
    status: "connected",
    meta: "Bucket ap-southeast-1",
  },
  {
    name: "Facebook Pages",
    description: "Đăng nội dung đã duyệt lên trang doanh nghiệp.",
    icon: MessagesSquare,
    status: "attention",
    meta: "Token cần cập nhật",
  },
  {
    name: "Google Sheets",
    description: "Hàng đợi trung gian cho pipeline auto-posting.",
    icon: FileSpreadsheet,
    status: "connected",
    meta: "Đồng bộ 5 phút trước",
  },
  {
    name: "Ahrefs API",
    description: "Chấm điểm từ khóa và hiệu quả SEO nội dung.",
    icon: SearchCheck,
    status: "not_connected",
    meta: "Chưa cấu hình",
  },
] as const;

export function IntegrationsPage() {
  return (
    <>
      <Helmet><title>Tích hợp | SMEFlow AI</title></Helmet>
      <PageHeader
        eyebrow="Cấu hình hệ thống"
        title="Tích hợp & kết nối"
        description="Theo dõi trạng thái dịch vụ. Khóa bí mật luôn được cấu hình ở backend, không lưu trong trình duyệt."
        meta={<Badge tone="success" leadingIcon={<ShieldCheck size={12} />}>Không lộ khóa phía client</Badge>}
      />
      <Alert
        className="mt-7"
        tone="warning"
        title="Quyền sở hữu pipeline cần chốt với Backend"
        description="Frontend chỉ hiển thị trạng thái và gửi yêu cầu. Token Facebook, Google và Ahrefs phải được quản lý bởi Spring Boot hoặc công cụ automation phía server."
      />
      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {integrations.map(({ name, description, icon: Icon, status, meta }) => (
          <Card key={name} variant="interactive" className="flex min-h-64 flex-col">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <span className="grid size-12 place-items-center rounded-2xl bg-slate-950 text-white"><Icon size={22} /></span>
                {status === "connected" ? (
                  <Badge tone="success" leadingIcon={<Check size={12} />}>Đã kết nối</Badge>
                ) : status === "attention" ? (
                  <Badge tone="warning">Cần chú ý</Badge>
                ) : (
                  <Badge>Chưa kết nối</Badge>
                )}
              </div>
              <CardTitle className="mt-4">{name}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
                <KeyRound size={14} /> <span className="truncate">{meta}</span>
              </div>
              <Button variant={status === "not_connected" ? "primary" : "outline"} fullWidth rightIcon={<ExternalLink size={15} />}>
                {status === "not_connected" ? "Thiết lập kết nối" : "Quản lý"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </>
  );
}
