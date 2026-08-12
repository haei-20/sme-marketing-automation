import { useEffect, useMemo, useState } from "react";
import { CheckCheck, RefreshCw, ScrollText } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

import {
  Alert,
  Badge,
  Button,
  DataTable,
  PageHeader,
  type DataTableColumn,
} from "@/components";
import {
  appEnv,
  mockPosts,
  mockPublishLogs,
  publishingApi,
  type PublishLog,
} from "@/lib";

import { FacebookConsentDialog } from "../components/FacebookConsentDialog";

function postFor(postId: number) {
  return mockPosts.find((post) => post.id === postId);
}

function postTitle(postId: number) {
  return postFor(postId)?.title ?? `Bài #${postId}`;
}

function canRetry(log: PublishLog): boolean {
  const post = postFor(log.postId);
  return (
    log.status === "FAILED" &&
    Boolean(post && ["APPROVED", "SCHEDULED", "FAILED"].includes(post.status))
  );
}

export function PublishingLogsPage() {
  const [logs, setLogs] = useState<PublishLog[]>(mockPublishLogs);
  const [selectedLog, setSelectedLog] = useState<PublishLog>();
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (appEnv.useMocks) return;
    let active = true;
    void publishingApi
      .listLogs()
      .then((items) => {
        if (active) setLogs(items);
      })
      .catch(() => {
        if (active) setError("Không đọc được publish log từ Backend local.");
      });
    return () => {
      active = false;
    };
  }, []);

  const confirmRetry = async () => {
    if (!selectedLog || !canRetry(selectedLog)) {
      setError("Chỉ nội dung đã duyệt hoặc lên lịch mới được thử đăng lại.");
      setSelectedLog(undefined);
      return;
    }

    setIsRetrying(true);
    setError(undefined);
    try {
      let updated: PublishLog;
      if (appEnv.useMocks) {
        await new Promise((resolve) => window.setTimeout(resolve, 500));
        updated = {
          ...selectedLog,
          status: "RETRYING",
          attempt: (selectedLog.attempt ?? 1) + 1,
          nextRetryAt: new Date(Date.now() + 30_000).toISOString(),
          errorMessage: undefined,
        };
      } else {
        updated = await publishingApi.retry(selectedLog.id, {
          consentVersion: "2026-08",
          acknowledgeExternalTransfer: true,
        });
      }
      setLogs((items) => items.map((item) => item.id === updated.id ? updated : item));
      setSelectedLog(undefined);
    } catch {
      setError("Không thể đưa bài vào hàng đợi an toàn. Backend chưa thay đổi publish log.");
    } finally {
      setIsRetrying(false);
    }
  };

  const summary = useMemo(() => ({
    success: logs.filter((log) => log.status === "SUCCESS").length,
    failed: logs.filter((log) => log.status === "FAILED").length,
    retrying: logs.filter((log) => log.status === "RETRYING").length,
  }), [logs]);

  const columns: DataTableColumn<PublishLog>[] = [
    {
      id: "post",
      header: "Nội dung",
      cell: (log) => (
        <div className="max-w-sm">
          <Link to={`/posts/${log.postId}/edit`} className="font-bold text-slate-900 hover:text-emerald-700">
            {postTitle(log.postId)}
          </Link>
          <p className="mt-1 text-xs text-slate-500">
            ID #{log.postId} • Lần thử {log.attempt ?? 1}
          </p>
        </div>
      ),
    },
    {
      id: "channel",
      header: "Kênh",
      cell: (log) => <Badge tone={log.channel === "FACEBOOK" ? "info" : "neutral"}>{log.channel}</Badge>,
    },
    {
      id: "time",
      header: "Thời điểm",
      cell: (log) => (
        <span className="text-sm text-slate-600">
          {new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(log.postedAt))}
        </span>
      ),
    },
    {
      id: "status",
      header: "Kết quả",
      cell: (log) => (
        <div>
          <Badge
            tone={log.status === "SUCCESS" ? "success" : log.status === "RETRYING" ? "warning" : "danger"}
            dot
          >
            {log.status === "SUCCESS" ? "Thành công" : log.status === "RETRYING" ? "Đang thử lại" : "Thất bại"}
          </Badge>
          {log.externalPostId && (
            <p className="mt-2 max-w-xs truncate text-xs text-slate-500">External ID: {log.externalPostId}</p>
          )}
          {log.errorMessage && (
            <p className="mt-2 max-w-xs text-xs leading-5 text-rose-600">
              {log.errorCode && <strong>{log.errorCode}: </strong>}{log.errorMessage}
            </p>
          )}
          {log.nextRetryAt && (
            <p className="mt-2 text-xs font-semibold text-amber-700">
              Hàng đợi đã nhận • có idempotency
            </p>
          )}
        </div>
      ),
    },
    {
      id: "action",
      header: "",
      align: "right",
      cell: (log) =>
        canRetry(log) ? (
          <Button
            size="sm"
            variant="outline"
            leftIcon={<RefreshCw size={14} />}
            onClick={() => setSelectedLog(log)}
          >
            Thử lại có xác nhận
          </Button>
        ) : log.status === "SUCCESS" ? (
          <Badge tone="success" leadingIcon={<CheckCheck size={13} />}>Đã ghi external ID</Badge>
        ) : (
          <Badge tone="warning">Đã khóa nhấp lặp</Badge>
        ),
    },
  ];

  return (
    <>
      <Helmet><title>Nhật ký đăng bài | SMEFlow AI</title></Helmet>
      <PageHeader
        eyebrow="Phân phối có kiểm soát"
        title="Nhật ký đăng bài"
        description="Theo dõi kết quả Facebook, external ID và retry idempotent. Token không xuất hiện trong renderer hoặc log."
        meta={<Badge tone="neutral" leadingIcon={<ScrollText size={12} />}>{logs.length} lượt gần nhất</Badge>}
      />

      <div className="mt-7 grid gap-3 sm:grid-cols-3">
        <Alert tone="success" title={`${summary.success} thành công`} description="Đã nhận external ID từ nền tảng." />
        <Alert tone="danger" title={`${summary.failed} thất bại`} description="Cần xem lỗi và xác nhận trước khi retry." />
        <Alert tone="warning" title={`${summary.retrying} đang thử lại`} description="Backend giữ idempotency để tránh bài trùng." />
      </div>
      <Alert
        className="mt-4"
        tone="info"
        title="Chỉ nội dung đã duyệt mới được rời máy"
        description="Retry mở màn consent mô tả chính xác dữ liệu gửi Facebook. Bản nháp, prompt và tài liệu RAG không thuộc payload publish."
      />
      {error && (
        <Alert className="mt-4" tone="danger" title="Publish log cần xử lý" description={error} />
      )}

      <DataTable
        className="mt-5"
        caption="Nhật ký phân phối nội dung"
        data={logs}
        columns={columns}
        getRowKey={(log) => log.id}
      />

      {selectedLog && (
        <FacebookConsentDialog
          open
          mode="publish"
          postTitle={postTitle(selectedLog.postId)}
          isSubmitting={isRetrying}
          onClose={() => setSelectedLog(undefined)}
          onConfirm={confirmRetry}
        />
      )}
    </>
  );
}
