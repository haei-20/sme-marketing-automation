import {
  Bot,
  CheckCircle2,
  CircleAlert,
  Database,
  ExternalLink,
  RefreshCw,
  ServerCog,
  Sparkles,
} from "lucide-react";

import { Alert, Badge, Button, Card, CardContent } from "@/components";

import type { LocalServiceName, ServiceHealth } from "../desktop/service-health";

const serviceDetails: Record<
  LocalServiceName,
  {
    label: string;
    description: string;
    fix: string;
    icon: typeof Database;
    helpUrl?: string;
  }
> = {
  mysql: {
    label: "MySQL",
    description: "Cơ sở dữ liệu nghiệp vụ trên máy.",
    fix: "Cài MySQL 8 và kiểm tra dịch vụ Windows đang chạy ở cổng 3306.",
    icon: Database,
    helpUrl: "https://dev.mysql.com/downloads/installer/",
  },
  ollama: {
    label: "Ollama",
    description: "Runtime chạy mô hình ngôn ngữ local.",
    fix: "Cài hoặc mở Ollama, sau đó tải model mà nhóm AI đã thống nhất.",
    icon: Bot,
    helpUrl: "https://ollama.com/download/windows",
  },
  backend: {
    label: "Backend",
    description: "Spring Boot xử lý tài khoản và nghiệp vụ.",
    fix: "Kiểm tra Java, MySQL, migration và Backend ở 127.0.0.1:8080.",
    icon: ServerCog,
  },
  ai: {
    label: "AI Service",
    description: "FastAPI xử lý RAG và sinh nội dung.",
    fix: "Kiểm tra AI sidecar, Ollama và dịch vụ ở 127.0.0.1:8000.",
    icon: Sparkles,
  },
};

interface ServiceStatusPanelProps {
  services: ServiceHealth[];
  isLoading: boolean;
  error?: string;
  onRefresh: () => void | Promise<void>;
  showIntroduction?: boolean;
}

export function ServiceStatusPanel({
  services,
  isLoading,
  error,
  onRefresh,
  showIntroduction = false,
}: ServiceStatusPanelProps) {
  const openHelp = async (url: string) => {
    await window.smeDesktop?.openApprovedExternalUrl(url);
  };

  const displayedServices =
    services.length > 0
      ? services
      : (["mysql", "ollama", "backend", "ai"] as LocalServiceName[]).map((name) => ({
          name,
          status: "UNKNOWN" as const,
          checkedAt: new Date(0).toISOString(),
          message: undefined,
        }));

  return (
    <div>
      {showIntroduction && (
        <div className="mb-7 rounded-3xl bg-[#10251f] p-6 text-white shadow-xl shadow-emerald-950/15 sm:p-8">
          <Badge className="border-white/10 bg-white/10 text-emerald-200 ring-0">Local-first</Badge>
          <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
            Chuẩn bị môi trường AI trên máy
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            SMEFlow AI cần bốn dịch vụ local trước khi mở không gian làm việc. Tài liệu, prompt và nội dung nháp không được gửi lên cloud.
          </p>
        </div>
      )}

      {error && (
        <Alert
          tone="danger"
          title="Không thể kiểm tra môi trường"
          description={error}
          className="mb-5"
        />
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {displayedServices.map((service) => {
          const detail = serviceDetails[service.name];
          const Icon = detail.icon;
          const isUp = service.status === "UP";
          const isDown = service.status === "DOWN";

          return (
            <Card key={service.name} className="overflow-hidden">
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <span
                    className={`grid size-11 shrink-0 place-items-center rounded-2xl ${
                      isUp
                        ? "bg-emerald-100 text-emerald-700"
                        : isDown
                          ? "bg-rose-100 text-rose-700"
                          : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <Icon size={21} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h2 className="font-extrabold text-slate-900">{detail.label}</h2>
                      <Badge
                        tone={isUp ? "success" : isDown ? "danger" : "neutral"}
                        leadingIcon={
                          isUp ? (
                            <CheckCircle2 size={12} />
                          ) : isDown ? (
                            <CircleAlert size={12} />
                          ) : undefined
                        }
                      >
                        {isUp ? "Sẵn sàng" : isDown ? "Cần xử lý" : "Đang kiểm tra"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{detail.description}</p>
                    <p
                      className={`mt-3 rounded-xl px-3 py-2 text-xs leading-5 ${
                        isUp ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"
                      }`}
                    >
                      {isUp
                        ? service.message ?? "Dịch vụ đang phản hồi bình thường."
                        : service.message ?? detail.fix}
                    </p>
                    {!isUp && <p className="mt-2 text-xs leading-5 text-slate-500">{detail.fix}</p>}
                    {!isUp && detail.helpUrl && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="mt-2 px-0 text-emerald-700"
                        rightIcon={<ExternalLink size={14} />}
                        onClick={() => void openHelp(detail.helpUrl!)}
                      >
                        Mở trang cài đặt chính thức
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-xs leading-5 text-slate-500">
          Trạng thái được kiểm tra qua loopback và tự cập nhật định kỳ. Không có khóa bí mật trong renderer.
        </p>
        <Button
          type="button"
          variant="outline"
          loading={isLoading}
          loadingText="Đang kiểm tra"
          leftIcon={<RefreshCw size={16} />}
          onClick={() => void onRefresh()}
        >
          Kiểm tra lại
        </Button>
      </div>
    </div>
  );
}
