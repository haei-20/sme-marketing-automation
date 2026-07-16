import {
  Archive,
  CheckCircle2,
  CircleAlert,
  FileSpreadsheet,
  FileText,
  Layers3,
  RefreshCw,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
  FileDropZone,
  Input,
  PageHeader,
  Progress,
  Select,
  StatCard,
  type DataTableColumn,
  type FileRejection,
} from "@/components";
import {
  mockKnowledgeDocuments,
  type KnowledgeDocument,
  type KnowledgeFileType,
  type KnowledgeStatus,
} from "@/lib";

type UploadStatus = "UPLOADING" | "PROCESSING" | "INDEXED" | "FAILED";

interface UploadItem {
  id: string;
  documentId: number;
  file: File;
  progress: number;
  processingTicks: number;
  status: UploadStatus;
  errorMessage?: string;
}

const statusMeta: Record<
  KnowledgeStatus,
  { label: string; tone: "neutral" | "info" | "success" | "danger" }
> = {
  UPLOADED: { label: "Đã tải lên", tone: "neutral" },
  PROCESSING: { label: "Đang lập chỉ mục", tone: "info" },
  INDEXED: { label: "Sẵn sàng", tone: "success" },
  FAILED: { label: "Có lỗi", tone: "danger" },
};

const dateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function fileKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function inferFileType(fileName: string): KnowledgeFileType {
  const extension = fileName.split(".").pop()?.toUpperCase();
  if (extension === "XLSX") return "XLSX";
  if (extension === "DOCX") return "DOCX";
  return "PDF";
}

function DocumentIcon({ fileType }: { fileType: KnowledgeFileType }) {
  const className = "size-5";
  return fileType === "XLSX" ? (
    <FileSpreadsheet className={className} aria-hidden="true" />
  ) : (
    <FileText className={className} aria-hidden="true" />
  );
}

export function KnowledgeBasePage() {
  const nextDocumentId = useRef(1_000);
  const [storedDocuments, setStoredDocuments] = useState<KnowledgeDocument[]>(() => [
    ...mockKnowledgeDocuments,
  ]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [uploadError, setUploadError] = useState<string>();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | KnowledgeStatus>(
    "ALL",
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setUploadItems((items) => {
        let changed = false;
        const nextItems = items.map((item) => {
          if (item.status === "UPLOADING") {
            changed = true;
            const progress = Math.min(100, item.progress + 14);
            return progress === 100
              ? { ...item, progress, status: "PROCESSING" as const }
              : { ...item, progress };
          }

          if (item.status === "PROCESSING") {
            changed = true;
            const processingTicks = item.processingTicks + 1;
            if (processingTicks < 3) return { ...item, processingTicks };

            const isUnreadableScan = /scan|ban[-_ ]?quet/i.test(item.file.name);
            return isUnreadableScan
              ? {
                  ...item,
                  processingTicks,
                  status: "FAILED" as const,
                  errorMessage:
                    "Không đọc được nội dung bản quét. Hãy tải lên tệp rõ hơn hoặc có lớp văn bản.",
                }
              : { ...item, processingTicks, status: "INDEXED" as const };
          }

          return item;
        });
        return changed ? nextItems : items;
      });
    }, 650);

    return () => window.clearInterval(timer);
  }, []);

  const documents = useMemo<KnowledgeDocument[]>(() => {
    const uploadedDocuments = uploadItems
      .filter((item) => item.status === "INDEXED")
      .map<KnowledgeDocument>((item) => ({
        id: item.documentId,
        businessId: 12,
        fileName: item.file.name,
        fileType: inferFileType(item.file.name),
        status: "INDEXED",
        chunkCount: Math.max(8, Math.round(item.file.size / 8_000)),
        uploadedAt: new Date(item.file.lastModified || 0).toISOString(),
      }))
      .filter(
        (item) => !storedDocuments.some((document) => document.id === item.id),
      );

    return [...uploadedDocuments, ...storedDocuments];
  }, [storedDocuments, uploadItems]);

  function handleFilesChange(nextFiles: File[]) {
    setSelectedFiles(nextFiles);
    setUploadError(undefined);

    setUploadItems((currentItems) => {
      const nextKeys = new Set(nextFiles.map(fileKey));
      const retainedItems = currentItems.filter((item) =>
        nextKeys.has(fileKey(item.file)),
      );
      const retainedKeys = new Set(retainedItems.map((item) => fileKey(item.file)));
      const newItems = nextFiles
        .filter((file) => !retainedKeys.has(fileKey(file)))
        .map<UploadItem>((file) => ({
          id: fileKey(file),
          documentId: nextDocumentId.current++,
          file,
          progress: 4,
          processingTicks: 0,
          status: "UPLOADING",
        }));
      return [...retainedItems, ...newItems];
    });
  }

  function handleRejectedFiles(rejections: FileRejection[]) {
    setUploadError(rejections.map((rejection) => rejection.message).join(" "));
  }

  function retryDocument(documentId: number) {
    setStoredDocuments((currentDocuments) =>
      currentDocuments.map((document) =>
        document.id === documentId
          ? {
              ...document,
              status: "PROCESSING",
              errorMessage: undefined,
            }
          : document,
      ),
    );
  }

  function retryUpload(uploadId: string) {
    setUploadItems((items) =>
      items.map((item) =>
        item.id === uploadId
          ? {
              ...item,
              progress: 0,
              processingTicks: 0,
              status: "UPLOADING",
              errorMessage: undefined,
            }
          : item,
      ),
    );
  }

  const filteredDocuments = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("vi-VN");
    return documents.filter((document) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        document.fileName.toLocaleLowerCase("vi-VN").includes(normalizedQuery);
      const matchesStatus =
        statusFilter === "ALL" || document.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [documents, query, statusFilter]);

  const columns: DataTableColumn<KnowledgeDocument>[] = [
    {
      id: "document",
      header: "Tài liệu",
      cell: (document) => (
        <div className="flex min-w-64 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <DocumentIcon fileType={document.fileType} />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-semibold text-slate-900 dark:text-white">
              {document.fileName}
            </span>
            <span className="mt-0.5 block text-xs text-slate-400">
              {document.fileType}
            </span>
          </span>
        </div>
      ),
    },
    {
      id: "status",
      header: "Trạng thái",
      cell: (document) => (
        <div className="min-w-36">
          <Badge tone={statusMeta[document.status].tone} dot>
            {statusMeta[document.status].label}
          </Badge>
          {document.status === "PROCESSING" && (
            <Progress
              value={64}
              size="sm"
              tone="info"
              className="mt-2 max-w-32"
            />
          )}
        </div>
      ),
    },
    {
      id: "chunks",
      header: "Phân đoạn",
      align: "right",
      cell: (document) => (
        <span className="font-semibold tabular-nums">
          {document.chunkCount.toLocaleString("vi-VN")}
        </span>
      ),
    },
    {
      id: "uploadedAt",
      header: "Cập nhật",
      cell: (document) => (
        <span className="whitespace-nowrap text-slate-500 dark:text-slate-400">
          {dateTimeFormatter.format(new Date(document.uploadedAt))}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      align: "right",
      cell: (document) =>
        document.status === "FAILED" ? (
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<RefreshCw className="size-3.5" />}
            onClick={() => retryDocument(Number(document.id))}
          >
            Thử lại
          </Button>
        ) : null,
    },
  ];

  const indexedCount = documents.filter(
    (document) => document.status === "INDEXED",
  ).length;
  const processingCount = documents.filter(
    (document) => document.status === "PROCESSING",
  ).length;
  const totalChunks = documents.reduce(
    (total, document) => total + document.chunkCount,
    0,
  );

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="RAG · Nguồn dữ liệu doanh nghiệp"
        title="Kho tri thức"
        description="Tải tài liệu nội bộ để AI tạo nội dung đúng thông tin sản phẩm, giá bán và thông điệp thương hiệu."
        meta={
          <Badge tone="success" dot>
            {indexedCount} tài liệu sẵn sàng cho AI
          </Badge>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Tổng tài liệu"
          value={documents.length}
          icon={<Archive className="size-5" />}
          description="trong thư viện doanh nghiệp"
        />
        <StatCard
          title="Đã lập chỉ mục"
          value={indexedCount}
          icon={<CheckCircle2 className="size-5" />}
          delta={`${Math.round((indexedCount / Math.max(documents.length, 1)) * 100)}%`}
          trend="up"
          description="có thể truy xuất"
        />
        <StatCard
          title="Đang xử lý"
          value={processingCount}
          icon={<Layers3 className="size-5" />}
          description="đang chia đoạn và embedding"
        />
        <StatCard
          title="Phân đoạn RAG"
          value={totalChunks.toLocaleString("vi-VN")}
          icon={<FileText className="size-5" />}
          description="đã tạo từ tài liệu"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.7fr)]">
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Bổ sung nguồn tri thức</CardTitle>
            <CardDescription>
              Hệ thống sẽ tải tệp, trích xuất nội dung, chia đoạn và lập chỉ mục tự động.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {uploadError && (
              <Alert
                tone="danger"
                title="Tệp chưa được thêm"
                description={uploadError}
                onDismiss={() => setUploadError(undefined)}
                className="mb-4"
              />
            )}
            <FileDropZone
              files={selectedFiles}
              onFilesChange={handleFilesChange}
              onFilesRejected={handleRejectedFiles}
              accept=".pdf,.docx,.xlsx"
              maxSizeMb={20}
              maxFiles={6}
              label="Tải tài liệu sản phẩm hoặc thương hiệu"
              helperText="PDF, DOCX hoặc XLSX · Tối đa 20 MB mỗi tệp · Không tải dữ liệu nhạy cảm chưa được phép sử dụng"
            />
          </CardContent>
        </Card>

        <Card variant="muted" className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CircleAlert className="size-5 text-amber-600" aria-hidden="true" />
              Chuẩn bị tệp tốt hơn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              <li className="flex gap-3">
                <span className="font-bold text-emerald-700">01</span>
                Ưu tiên tài liệu có tiêu đề, bảng giá và thông số rõ ràng.
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-emerald-700">02</span>
                Với PDF bản quét, bảo đảm chữ sắc nét và không bị xoay trang.
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-emerald-700">03</span>
                Khi cập nhật giá, tải phiên bản mới nhất để tránh AI dùng dữ liệu cũ.
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {uploadItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tiến trình xử lý</CardTitle>
            <CardDescription>
              Có thể tiếp tục làm việc trong khi hệ thống chuẩn hóa tài liệu.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {uploadItems.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                      {item.file.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {item.status === "UPLOADING" && "Đang tải lên kho lưu trữ"}
                      {item.status === "PROCESSING" &&
                        "Đang trích xuất và tạo embedding"}
                      {item.status === "INDEXED" &&
                        "Đã sẵn sàng để AI truy xuất"}
                      {item.status === "FAILED" && item.errorMessage}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge
                      tone={
                        item.status === "INDEXED"
                          ? "success"
                          : item.status === "FAILED"
                            ? "danger"
                            : "info"
                      }
                      dot
                    >
                      {item.status === "UPLOADING" && "Đang tải"}
                      {item.status === "PROCESSING" && "Đang xử lý"}
                      {item.status === "INDEXED" && "Hoàn tất"}
                      {item.status === "FAILED" && "Có lỗi"}
                    </Badge>
                    {item.status === "FAILED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<RefreshCw className="size-3.5" />}
                        onClick={() => retryUpload(item.id)}
                      >
                        Thử lại
                      </Button>
                    )}
                  </div>
                </div>
                {(item.status === "UPLOADING" ||
                  item.status === "PROCESSING") && (
                  <Progress
                    value={item.status === "UPLOADING" ? item.progress : 100}
                    showValue={item.status === "UPLOADING"}
                    tone={item.status === "PROCESSING" ? "info" : "primary"}
                    size="sm"
                    label={
                      item.status === "PROCESSING"
                        ? "Đang lập chỉ mục"
                        : "Tiến độ tải lên"
                    }
                    className="mt-4"
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <section aria-labelledby="document-library-title" className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2
              id="document-library-title"
              className="text-lg font-bold text-slate-950 dark:text-white"
            >
              Tài liệu đã tải lên
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Theo dõi khả năng sẵn sàng của từng nguồn dữ liệu.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(240px,1fr)_190px] lg:w-[520px]">
            <Input
              aria-label="Tìm tài liệu"
              placeholder="Tìm theo tên tệp…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              leading={<Search className="size-4" />}
            />
            <Select
              aria-label="Lọc trạng thái tài liệu"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "ALL" | KnowledgeStatus)
              }
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="INDEXED">Sẵn sàng</option>
              <option value="PROCESSING">Đang xử lý</option>
              <option value="FAILED">Có lỗi</option>
            </Select>
          </div>
        </div>

        <DataTable
          caption="Danh sách tài liệu trong kho tri thức"
          columns={columns}
          data={filteredDocuments}
          getRowKey={(document) => document.id}
          emptyTitle="Không tìm thấy tài liệu"
          emptyDescription="Hãy đổi từ khóa hoặc bộ lọc trạng thái để xem kết quả khác."
          emptyAction={
            <Button
              variant="outline"
              onClick={() => {
                setQuery("");
                setStatusFilter("ALL");
              }}
            >
              Xóa bộ lọc
            </Button>
          }
        />

        {filteredDocuments
          .filter((document) => document.status === "FAILED")
          .map((document) => (
            <Alert
              key={document.id}
              tone="danger"
              title={`Không thể xử lý ${document.fileName}`}
              description={document.errorMessage}
              actions={
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<RefreshCw className="size-3.5" />}
                  onClick={() => retryDocument(Number(document.id))}
                >
                  Xử lý lại
                </Button>
              }
            />
          ))}
      </section>
    </div>
  );
}

export default KnowledgeBasePage;
