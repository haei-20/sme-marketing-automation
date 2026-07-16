import { ShieldCheck } from "lucide-react";
import { Helmet } from "react-helmet-async";

import { Badge, PageHeader } from "@/components";

import { ServiceStatusPanel } from "../components/ServiceStatusPanel";
import { useDesktopServiceHealth } from "../desktop/service-health";

export function SystemStatusPage() {
  const health = useDesktopServiceHealth();

  return (
    <>
      <Helmet><title>Trạng thái hệ thống | SMEFlow AI</title></Helmet>
      <PageHeader
        eyebrow="Ứng dụng desktop"
        title="Trạng thái hệ thống local"
        description="Theo dõi Backend, AI Service, Ollama và MySQL đang chạy trực tiếp trên máy của bạn."
        meta={
          <Badge tone="success" leadingIcon={<ShieldCheck size={12} />}>
            Chỉ kết nối loopback
          </Badge>
        }
      />
      <div className="mt-7">
        <ServiceStatusPanel
          services={health.services}
          isLoading={health.isLoading}
          error={health.error}
          onRefresh={health.refresh}
        />
      </div>
    </>
  );
}
