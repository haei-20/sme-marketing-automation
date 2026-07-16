import { useState } from "react";
import { ExternalLink, RefreshCw, ScrollText } from "lucide-react";
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
import { mockPosts, mockPublishLogs, type PublishLog } from "@/lib";

function postTitle(postId: number) {
  return mockPosts.find((post) => post.id === postId)?.title ?? `Bài #${postId}`;
}

export function PublishingLogsPage() {
  const [retryingId, setRetryingId] = useState<number | null>(null);
  const [retriedIds, setRetriedIds] = useState<number[]>([]);

  const retry = (logId: number) => {
    setRetryingId(logId);
    window.setTimeout(() => {
      setRetryingId(null);
      setRetriedIds((ids) => [...ids, logId]);
    }, 700);
  };

  const columns: DataTableColumn<PublishLog>[] = [
    {
      id: "post",
      header: "Nội dung",
      cell: (log) => (
        <div className="max-w-sm">
          <Link to={`/posts/${log.postId}/edit`} className="font-bold text-slate-900 hover:text-emerald-700">
            {postTitle(log.postId)}
          </Link>
          <p className="mt-1 text-xs text-slate-500">ID #{log.postId}</p>
        </div>
      ),
    },
    {
      id: "channel",
      header: "Kênh",
      cell: (log) => <Badge tone="info">{log.channel}</Badge>,
    },
    {
      id: "time",
      header: "Thời điểm",
      cell: (log) => new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(log.postedAt)),
    },
    {
      id: "status",
      header: "Kết quả",
      cell: (log) => (
        <div>
          <Badge tone={log.status === "SUCCESS" ? "success" : "danger"} dot>
            {log.status === "SUCCESS" ? "Thành công" : "Thất bại"}
          </Badge>
          {log.errorMessage && <p className="mt-2 max-w-xs text-xs leading-5 text-rose-600">{log.errorMessage}</p>}
          {retriedIds.includes(log.id) && <p className="mt-2 text-xs font-semibold text-amber-700">Đã đưa lại vào hàng đợi</p>}
        </div>
      ),
    },
    {
      id: "action",
      header: "",
      align: "right",
      cell: (log) =>
        log.status === "FAILED" ? (
          <Button
            size="sm"
            variant="outline"
            loading={retryingId === log.id}
            loadingText="Đang gửi"
            leftIcon={<RefreshCw size={14} />}
            onClick={() => retry(log.id)}
          >
            Thử lại
          </Button>
        ) : (
          <Button size="sm" variant="ghost" rightIcon={<ExternalLink size={14} />}>Mở bài</Button>
        ),
    },
  ];

  return (
    <>
      <Helmet><title>Nhật ký đăng bài | SMEFlow AI</title></Helmet>
      <PageHeader
        eyebrow="Auto-posting"
        title="Nhật ký phân phối"
        description="Theo dõi kết quả đăng, mã bài trên nền tảng và lỗi cần xử lý. Retry thực tế phải idempotent ở backend."
        meta={<Badge tone="neutral" leadingIcon={<ScrollText size={12} />}>{mockPublishLogs.length} lượt gần nhất</Badge>}
      />
      <Alert
        className="mt-7"
        tone="info"
        title="Dữ liệu minh họa"
        description="Khi kết nối backend, bảng này đọc từ GET /api/posts/{id}/logs và thao tác thử lại cần endpoint riêng được TV3 xác nhận."
      />
      <DataTable
        className="mt-5"
        caption="Nhật ký phân phối nội dung"
        data={mockPublishLogs}
        columns={columns}
        getRowKey={(log) => log.id}
      />
    </>
  );
}
