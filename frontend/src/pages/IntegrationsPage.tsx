import { useEffect, useState } from "react";
import {
  Bot,
  CheckCircle2,
  Link2,
  MessagesSquare,
  RefreshCw,
  ShieldCheck,
  Unplug,
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
import {
  appEnv,
  integrationApi,
  type FacebookIntegrationStatus,
} from "@/lib";

import { FacebookConsentDialog } from "../components/FacebookConsentDialog";

const mockFacebookStatus: FacebookIntegrationStatus = {
  status: "NEEDS_REAUTH",
  page: { id: "page-demo-12", name: "An Nhiên Living" },
  permissions: ["pages_manage_posts", "pages_read_engagement"],
  lastCheckedAt: "2026-08-12T09:00:00+07:00",
  errorCode: "TOKEN_EXPIRED",
  errorMessage: "Quyền truy cập đã hết hạn. Hãy xác nhận và kết nối lại Page.",
};

export function IntegrationsPage() {
  const [facebook, setFacebook] = useState<FacebookIntegrationStatus>(mockFacebookStatus);
  const [consentOpen, setConsentOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (appEnv.useMocks) return;
    let active = true;
    void integrationApi
      .facebookStatus()
      .then((status) => {
        if (active) setFacebook(status);
      })
      .catch(() => {
        if (active) setError("Không đọc được trạng thái Facebook từ Backend local.");
      });
    return () => {
      active = false;
    };
  }, []);

  const connect = async () => {
    setIsSubmitting(true);
    setError(undefined);
    try {
      if (appEnv.useMocks) {
        await new Promise((resolve) => window.setTimeout(resolve, 500));
        setFacebook({
          status: "CONNECTED",
          page: { id: "page-demo-12", name: "An Nhiên Living" },
          permissions: ["pages_manage_posts", "pages_read_engagement"],
          lastCheckedAt: new Date().toISOString(),
        });
      } else {
        const response = await integrationApi.connectFacebook({
          consentVersion: "2026-08",
          acceptedData: [
            "PAGE_IDENTITY",
            "APPROVED_POST_CONTENT",
            "APPROVED_MEDIA",
            "PUBLISH_SCHEDULE",
          ],
          acknowledgeExternalTransfer: true,
        });
        if (!window.smeDesktop) {
          throw new Error("Cần mở bằng ứng dụng desktop để tiếp tục OAuth.");
        }
        await window.smeDesktop.openApprovedExternalUrl(response.authorizationUrl);
      }
      setConsentOpen(false);
    } catch (connectError) {
      setError(connectError instanceof Error ? connectError.message : "Không thể bắt đầu kết nối Facebook.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const disconnect = async () => {
    setIsSubmitting(true);
    setError(undefined);
    try {
      if (!appEnv.useMocks) await integrationApi.disconnectFacebook();
      setFacebook({ status: "DISCONNECTED", permissions: [] });
    } catch {
      setError("Không thể ngắt kết nối Facebook. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const connected = facebook.status === "CONNECTED";
  const needsAttention = facebook.status === "NEEDS_REAUTH";

  return (
    <>
      <Helmet><title>Tích hợp | SMEFlow AI</title></Helmet>
      <PageHeader
        eyebrow="Cấu hình hệ thống"
        title="Tích hợp & kết nối"
        description="Mặc định mọi xử lý diễn ra local. Facebook chỉ được kết nối khi bạn chủ động đồng ý."
        meta={
          <Badge tone="success" leadingIcon={<ShieldCheck size={12} />}>
            Không giữ token ở giao diện
          </Badge>
        }
      />

      <Alert
        className="mt-7"
        tone="info"
        title="Local-first, không có pipeline cloud trung gian"
        description="Amazon S3 và Google Sheets không thuộc runtime phát hành. Backend local chỉ gọi Facebook Graph API cho nội dung đã duyệt sau consent."
      />
      {error && <Alert className="mt-4" tone="danger" title="Không thể hoàn tất thao tác" description={error} />}

      <section className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <span className="grid size-12 place-items-center rounded-2xl bg-slate-950 text-white"><Bot size={22} /></span>
              <Badge tone="success" leadingIcon={<CheckCircle2 size={12} />}>Local</Badge>
            </div>
            <CardTitle className="mt-4">Ollama Local LLM</CardTitle>
            <CardDescription>Mô hình AI chạy trực tiếp trên máy; prompt và context RAG không rời thiết bị.</CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              Trạng thái runtime được theo dõi tại màn Trạng thái hệ thống.
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col border-blue-200">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <span className="grid size-12 place-items-center rounded-2xl bg-blue-600 text-white"><MessagesSquare size={22} /></span>
              <Badge tone={connected ? "success" : needsAttention ? "warning" : "neutral"}>
                {connected ? "Đã kết nối" : needsAttention ? "Cần kết nối lại" : "Chưa kết nối"}
              </Badge>
            </div>
            <CardTitle className="mt-4">Facebook Pages</CardTitle>
            <CardDescription>Đăng bài đã APPROVED/SCHEDULED trực tiếp qua Backend local.</CardDescription>
          </CardHeader>
          <CardContent className="mt-auto space-y-4">
            {facebook.page && (
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Page được chọn</p>
                <p className="mt-1 font-extrabold text-slate-900">{facebook.page.name}</p>
                <p className="mt-1 text-xs text-slate-500">ID: {facebook.page.id}</p>
              </div>
            )}
            {facebook.errorMessage && (
              <Alert tone="warning" title="Kết nối cần xử lý" description={facebook.errorMessage} />
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              {!connected ? (
                <Button
                  fullWidth
                  leftIcon={needsAttention ? <RefreshCw size={16} /> : <Link2 size={16} />}
                  onClick={() => setConsentOpen(true)}
                >
                  {needsAttention ? "Kết nối lại an toàn" : "Kết nối Facebook"}
                </Button>
              ) : (
                <>
                  <Button fullWidth variant="outline" leftIcon={<RefreshCw size={16} />} onClick={() => setConsentOpen(true)}>
                    Cấp lại quyền
                  </Button>
                  <Button fullWidth variant="danger" loading={isSubmitting} leftIcon={<Unplug size={16} />} onClick={() => void disconnect()}>
                    Ngắt kết nối
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      {consentOpen && (
        <FacebookConsentDialog
          open
          mode="connect"
          isSubmitting={isSubmitting}
          onClose={() => setConsentOpen(false)}
          onConfirm={connect}
        />
      )}
    </>
  );
}
