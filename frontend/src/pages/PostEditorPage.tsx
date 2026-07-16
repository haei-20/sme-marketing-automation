import {
  ArrowLeft,
  Bold,
  Check,
  CheckCheck,
  CircleAlert,
  FileCheck2,
  Hash,
  ImageIcon,
  Italic,
  Link2,
  List,
  MessageSquareText,
  RefreshCw,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, useParams } from "react-router-dom";

import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  PageHeader,
  Progress,
  StatusBadge,
  Textarea,
  cn,
} from "@/components";
import {
  appEnv,
  createAppStompClient,
  mockPlans,
  mockPosts,
  normalizeApiError,
  postApi,
  subscribeToGeneration,
  type FactCheckResult,
  type GenerationStreamEvent,
  type MarketingChannel,
  type Post,
  type PostStatus,
  type StompClient,
  type StompSubscription,
  type UsedFact,
} from "@/lib";

type Notice = {
  tone: "info" | "success" | "warning" | "danger";
  title: string;
  description: string;
};

type FormSnapshot = {
  title: string;
  content: string;
  imageUrl: string;
  keywords: string[];
};

const statusBadge: Record<
  PostStatus,
  "draft" | "review" | "approved" | "scheduled" | "published" | "failed"
> = {
  DRAFT: "draft",
  PENDING: "review",
  APPROVED: "approved",
  SCHEDULED: "scheduled",
  PUBLISHED: "published",
  FAILED: "failed",
};

const channelLabel: Record<MarketingChannel, string> = {
  WEBSITE: "Website",
  BLOG: "Blog SEO",
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
};

const mockStreamContent =
  "Mùa hè là lúc cả gia đình cần chủ động hơn với nguồn nước uống mỗi ngày. AquaPure S9 sử dụng hệ thống 9 lõi lọc, đạt công suất 15 lít/giờ và phù hợp cho gia đình 3–5 người. Với mức giá 3.200.000 đồng cùng bảo hành 24 tháng, đây là giải pháp thiết thực để cả nhà an tâm tận hưởng mùa nóng. Liên hệ ngay để nhận hỗ trợ lắp đặt miễn phí trong tháng 7.";

const defaultUsedFacts: UsedFact[] = [
  { field: "price", value: "3.200.000 đồng", sourceKbId: 7 },
  { field: "filter_system", value: "9 lõi lọc", sourceKbId: 7 },
  { field: "capacity", value: "15 lít/giờ", sourceKbId: 7 },
  { field: "warranty", value: "24 tháng", sourceKbId: 7 },
];

function snapshotOf(
  title: string,
  content: string,
  imageUrl: string,
  keywords: string[],
): FormSnapshot {
  return { title, content, imageUrl, keywords: [...keywords] };
}

function sameKeywords(left: string[], right: string[]) {
  return left.length === right.length && left.every((keyword, index) => keyword === right[index]);
}

function readableError(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return normalizeApiError(error).message;
}

function scoreTone(score: number): "primary" | "warning" | "danger" {
  if (score >= 80) return "primary";
  if (score >= 60) return "warning";
  return "danger";
}

export function PostEditorPage() {
  const navigate = useNavigate();
  const { postId } = useParams();
  const numericPostId = Number(postId);
  const initialMockPost = mockPosts.find((item) => Number(item.id) === numericPostId);
  const initialKeywords = initialMockPost?.seoKeywords ?? [];
  const initialImageUrl = initialMockPost?.imageUrl ?? "";

  const [post, setPost] = useState<Post | undefined>(() =>
    appEnv.useMocks ? initialMockPost : undefined,
  );
  const [title, setTitle] = useState(initialMockPost?.title ?? "");
  const [content, setContent] = useState(initialMockPost?.content ?? "");
  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const [keywords, setKeywords] = useState<string[]>(initialKeywords);
  const [keywordDraft, setKeywordDraft] = useState("");
  const [lastSaved, setLastSaved] = useState<FormSnapshot>(() =>
    snapshotOf(
      initialMockPost?.title ?? "",
      initialMockPost?.content ?? "",
      initialImageUrl,
      initialKeywords,
    ),
  );
  const [feedbackNote, setFeedbackNote] = useState("");
  const [markAsGolden, setMarkAsGolden] = useState(true);
  const [notice, setNotice] = useState<Notice>();
  const [isLoading, setIsLoading] = useState(!appEnv.useMocks);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isSavingFeedback, setIsSavingFeedback] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [realtimeState, setRealtimeState] = useState("Sẵn sàng");
  const [imagePreviewFailed, setImagePreviewFailed] = useState(false);

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const mockTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stompClientRef = useRef<StompClient | null>(null);
  const subscriptionRef = useRef<StompSubscription | null>(null);

  useEffect(() => {
    if (appEnv.useMocks || !Number.isFinite(numericPostId)) return;

    let active = true;
    void postApi
      .list()
      .then((items) => {
        if (!active) return;
        const selected = items.find((item) => Number(item.id) === numericPostId);
        setPost(selected);
        if (selected) {
          const nextKeywords = selected.seoKeywords ?? [];
          const nextImageUrl = selected.imageUrl ?? "";
          setTitle(selected.title);
          setContent(selected.content);
          setImageUrl(nextImageUrl);
          setKeywords(nextKeywords);
          setLastSaved(snapshotOf(selected.title, selected.content, nextImageUrl, nextKeywords));
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setNotice({
            tone: "danger",
            title: "Không thể tải bài viết",
            description: readableError(error),
          });
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [numericPostId]);

  useEffect(() => {
    return () => {
      if (mockTimerRef.current) clearInterval(mockTimerRef.current);
      subscriptionRef.current?.unsubscribe();
      stompClientRef.current?.disconnect();
    };
  }, []);

  const isDirty =
    title !== lastSaved.title ||
    content !== lastSaved.content ||
    imageUrl !== lastSaved.imageUrl ||
    !sameKeywords(keywords, lastSaved.keywords);

  useEffect(() => {
    if (!isDirty) return;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [isDirty]);

  const seoScore = useMemo(() => {
    if (!post) return 0;
    let score = post.seoScore ?? 55;
    const normalizedContent = content.toLocaleLowerCase("vi-VN");
    const coveredKeywords = keywords.filter((keyword) =>
      normalizedContent.includes(keyword.toLocaleLowerCase("vi-VN")),
    ).length;
    if (keywords.length > 0) {
      score += Math.round((coveredKeywords / keywords.length - 0.5) * 12);
    }
    if (title.length >= 35 && title.length <= 70) score += 3;
    if (content.length >= 250) score += 2;
    return Math.min(100, Math.max(0, score));
  }, [content, keywords, post, title]);

  const faithfulnessScore = post?.faithfulnessScore ?? 0;
  const factCheck: FactCheckResult = useMemo(
    () => ({
      checked: faithfulnessScore >= 80,
      issues:
        faithfulnessScore >= 80
          ? []
          : ["Cần đối chiếu lại các thông số với tài liệu nguồn trước khi duyệt."],
    }),
    [faithfulnessScore],
  );
  const metaDescription = content.trim().replace(/\s+/g, " ").slice(0, 160);
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const canEdit = post?.status === "DRAFT" || post?.status === "PENDING";
  const sourcePlan = mockPlans.find((plan) => Number(plan.id) === Number(post?.planId));

  function stopRealtime() {
    if (mockTimerRef.current) clearInterval(mockTimerRef.current);
    mockTimerRef.current = null;
    subscriptionRef.current?.unsubscribe();
    subscriptionRef.current = null;
    stompClientRef.current?.disconnect();
    stompClientRef.current = null;
  }

  function updateSavedState(nextPost: Post) {
    const merged: Post = {
      ...nextPost,
      title,
      content,
      imageUrl: imageUrl.trim() || undefined,
      seoKeywords: keywords,
      seoScore,
    };
    setPost(merged);
    setLastSaved(snapshotOf(title, content, imageUrl, keywords));
    return merged;
  }

  async function persistPost(nextStatus?: "DRAFT" | "PENDING") {
    if (!post) return undefined;
    if (!title.trim() || !content.trim()) {
      setNotice({
        tone: "warning",
        title: "Nội dung chưa hoàn chỉnh",
        description: "Tiêu đề và nội dung bài viết không được để trống.",
      });
      return undefined;
    }

    if (appEnv.useMocks) {
      return updateSavedState({ ...post, status: nextStatus ?? post.status });
    }

    const updated = await postApi.update(Number(post.id), {
      title: title.trim(),
      content: content.trim(),
      imageUrl: imageUrl.trim() || undefined,
      status: nextStatus,
    });
    return updateSavedState(updated);
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      const saved = await persistPost();
      if (saved) {
        setNotice({
          tone: "success",
          title: "Đã lưu bản chỉnh sửa",
          description: "Tiêu đề, nội dung và ảnh xem trước đã được cập nhật.",
        });
      }
    } catch (error) {
      setNotice({ tone: "danger", title: "Lưu bài thất bại", description: readableError(error) });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSubmitForReview() {
    setIsSubmitting(true);
    try {
      const saved = await persistPost("PENDING");
      if (saved) {
        setNotice({
          tone: "success",
          title: "Đã gửi duyệt",
          description: "Bài viết đã chuyển sang trạng thái chờ duyệt và sẵn sàng để admin kiểm tra.",
        });
      }
    } catch (error) {
      setNotice({ tone: "danger", title: "Không thể gửi duyệt", description: readableError(error) });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleApprove() {
    if (!post) return;
    setIsApproving(true);
    try {
      if (isDirty) {
        const saved = await persistPost();
        if (!saved) return;
      }
      const approved = appEnv.useMocks
        ? { ...post, title, content, imageUrl: imageUrl || undefined, status: "APPROVED" as const }
        : await postApi.approve(Number(post.id));
      setPost({ ...approved, seoKeywords: keywords, seoScore });
      setLastSaved(snapshotOf(title, content, imageUrl, keywords));
      setNotice({
        tone: "success",
        title: "Bài viết đã được duyệt",
        description: "Nội dung đã khóa chỉnh sửa và có thể chuyển sang bước lên lịch phân phối.",
      });
    } catch (error) {
      setNotice({ tone: "danger", title: "Duyệt bài thất bại", description: readableError(error) });
    } finally {
      setIsApproving(false);
    }
  }

  async function handleSaveFeedback() {
    if (!post) return;
    setIsSavingFeedback(true);
    try {
      if (!appEnv.useMocks) {
        await postApi.feedback(Number(post.id), {
          type: "EXPLICIT_EDIT",
          editedContent: content,
          note: feedbackNote.trim() || undefined,
          markAsGolden,
        });
      }
      setFeedbackNote("");
      setNotice({
        tone: "success",
        title: markAsGolden ? "Đã lưu Golden Sample" : "Đã ghi nhận phản hồi",
        description: markAsGolden
          ? "Bản chỉnh sửa này sẽ được dùng làm mẫu tham chiếu cho những lần sinh nội dung sau."
          : "Phản hồi đã được lưu vào vòng lặp cải thiện nội dung.",
      });
    } catch (error) {
      setNotice({ tone: "danger", title: "Không thể lưu phản hồi", description: readableError(error) });
    } finally {
      setIsSavingFeedback(false);
    }
  }

  function handleStreamEvent(event: GenerationStreamEvent) {
    if (event.type === "TOKEN") {
      if (event.token) setContent((current) => current + event.token);
      return;
    }
    if (event.type === "COMPLETED") {
      if (event.content) setContent(event.content);
      setIsGenerating(false);
      setPost((current) => current ? { ...current, status: "DRAFT" } : current);
      stopRealtime();
      setRealtimeState("Đã hoàn tất");
      setNotice({
        tone: "success",
        title: "AI đã hoàn tất bản nháp",
        description: "Hãy kiểm tra các sự kiện được sử dụng trước khi lưu hoặc gửi duyệt.",
      });
      return;
    }
    setIsGenerating(false);
    stopRealtime();
    setRealtimeState("Có lỗi");
    setNotice({
      tone: "danger",
      title: "Luồng sinh nội dung bị gián đoạn",
      description: event.message ?? "Không nhận được kết quả hoàn chỉnh từ AI Service.",
    });
  }

  function runMockStream() {
    const tokens = mockStreamContent.match(/\S+\s*/g) ?? [mockStreamContent];
    let tokenIndex = 0;
    setTitle("Nước sạch cho cả nhà, an tâm suốt mùa hè");
    setContent("");
    setRealtimeState("Đang nhận token mô phỏng");
    mockTimerRef.current = setInterval(() => {
      const token = tokens[tokenIndex];
      if (token !== undefined) setContent((current) => current + token);
      tokenIndex += 1;
      if (tokenIndex >= tokens.length) {
        if (mockTimerRef.current) clearInterval(mockTimerRef.current);
        mockTimerRef.current = null;
        setIsGenerating(false);
        setRealtimeState("Đã hoàn tất");
        setPost((current) => current ? { ...current, status: "DRAFT" } : current);
        setNotice({
          tone: "success",
          title: "Đã mô phỏng streaming thành công",
          description: "Bản nháp được hiển thị dần theo đúng cách luồng STOMP sẽ hoạt động khi nối backend.",
        });
      }
    }, 55);
  }

  async function handleGenerate() {
    if (!post || isGenerating) return;
    stopRealtime();
    setNotice(undefined);
    setIsGenerating(true);

    if (appEnv.useMocks) {
      runMockStream();
      return;
    }

    setContent("");
    setRealtimeState("Đang tạo yêu cầu");
    try {
      const accepted = await postApi.generate({
        campaignId: post.campaignId,
        planId: post.planId,
        productId: sourcePlan?.productId ?? 45,
        channel: post.channel ?? "FACEBOOK",
        message: title || "Tạo nội dung theo kế hoạch đã duyệt",
        seoKeywords: keywords,
      });
      const client = createAppStompClient({
        onStateChange: (state) => {
          const label = {
            DISCONNECTED: "Mất kết nối",
            CONNECTING: "Đang kết nối",
            CONNECTED: "Đang streaming",
            RECONNECTING: "Đang kết nối lại",
          }[state];
          setRealtimeState(label);
        },
        onError: (error) => {
          setNotice({
            tone: "warning",
            title: "Kết nối realtime chưa ổn định",
            description: error.message,
          });
        },
      });
      stompClientRef.current = client;
      subscriptionRef.current = subscribeToGeneration(client, accepted.jobId, handleStreamEvent);
      await client.connect();
    } catch (error) {
      stopRealtime();
      setIsGenerating(false);
      setRealtimeState("Không thể kết nối");
      setNotice({
        tone: "danger",
        title: "Không thể bắt đầu sinh nội dung",
        description: readableError(error),
      });
    }
  }

  function addKeywords() {
    const candidates = keywordDraft
      .split(",")
      .map((keyword) => keyword.trim())
      .filter(Boolean);
    if (candidates.length === 0) return;
    setKeywords((current) => {
      const seen = new Set(current.map((keyword) => keyword.toLocaleLowerCase("vi-VN")));
      return [
        ...current,
        ...candidates.filter((keyword) => {
          const key = keyword.toLocaleLowerCase("vi-VN");
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        }),
      ];
    });
    setKeywordDraft("");
  }

  function handleKeywordKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addKeywords();
    }
  }

  function removeKeyword(keywordToRemove: string) {
    setKeywords((current) => current.filter((keyword) => keyword !== keywordToRemove));
  }

  function wrapSelection(prefix: string, suffix = prefix) {
    const textarea = editorRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.slice(start, end);
    const nextContent = `${content.slice(0, start)}${prefix}${selected}${suffix}${content.slice(end)}`;
    setContent(nextContent);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    });
  }

  function prefixSelectedLines(prefix: string) {
    const textarea = editorRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.slice(start, end) || "Nội dung";
    const nextBlock = selected.split("\n").map((line) => `${prefix}${line}`).join("\n");
    setContent(`${content.slice(0, start)}${nextBlock}${content.slice(end)}`);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + nextBlock.length);
    });
  }

  if (isLoading) {
    return (
      <Card className="p-8" aria-busy="true">
        <div className="h-7 w-2/5 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="mt-4 h-4 w-3/4 animate-pulse rounded bg-slate-100 dark:bg-slate-900" />
        <div className="mt-8 h-96 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-900" />
        <span className="sr-only">Đang tải bài viết…</span>
      </Card>
    );
  }

  if (!post) {
    return (
      <Card>
        <EmptyState
          icon={<FileCheck2 className="size-5" />}
          title="Không tìm thấy bài viết"
          description="Bài viết không tồn tại hoặc bạn không có quyền truy cập trong doanh nghiệp hiện tại."
          action={<Button leftIcon={<ArrowLeft className="size-4" />} onClick={() => navigate("/posts")}>Về danh sách</Button>}
        />
      </Card>
    );
  }

  return (
    <>
      <Helmet>
        <title>{title || "Soạn thảo bài viết"} | SMEFlow AI</title>
        <meta name="description" content={metaDescription || "Bài viết marketing được tạo bằng Local AI và RAG."} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={title || "Bài viết marketing"} />
        <meta property="og:description" content={metaDescription || "Nội dung marketing bám dữ liệu doanh nghiệp."} />
        {imageUrl && <meta property="og:image" content={imageUrl} />}
        <meta name="twitter:card" content={imageUrl ? "summary_large_image" : "summary"} />
      </Helmet>

      <div className="space-y-7">
        <PageHeader
          eyebrow={`Bài viết #${post.id}`}
          title="Soạn thảo & duyệt nội dung"
          description="Chỉnh sửa an toàn, đối chiếu dữ liệu nguồn và lưu phản hồi để AI cải thiện ở lần sinh tiếp theo."
          meta={
            <>
              <StatusBadge status={statusBadge[post.status]} />
              <Badge tone="purple">{channelLabel[post.channel ?? "WEBSITE"]}</Badge>
              <span className="text-xs font-medium text-slate-500">
                {isDirty ? "Có thay đổi chưa lưu" : "Mọi thay đổi đã lưu"}
              </span>
            </>
          }
          actions={
            <>
              <Button variant="ghost" leftIcon={<ArrowLeft className="size-4" />} onClick={() => navigate("/posts")}>
                Danh sách
              </Button>
              <Button
                variant="outline"
                leftIcon={<Save className="size-4" />}
                loading={isSaving}
                loadingText="Đang lưu"
                disabled={!canEdit || isGenerating || !isDirty}
                onClick={() => void handleSave()}
              >
                Lưu thay đổi
              </Button>
            </>
          }
        />

        {notice && (
          <Alert
            tone={notice.tone}
            title={notice.title}
            description={notice.description}
            onDismiss={() => setNotice(undefined)}
          />
        )}

        {!canEdit && (
          <Alert
            tone="info"
            title="Bài viết đang ở chế độ chỉ đọc"
            description="Chỉ bài nháp hoặc bài chờ duyệt mới có thể chỉnh sửa. Bạn vẫn có thể xem metadata, dữ liệu kiểm chứng và ghi nhận phản hồi."
          />
        )}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
          <Card variant="elevated">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle>Nội dung bài viết</CardTitle>
                  <CardDescription>Editor dùng văn bản thuần có kiểm soát, không chèn HTML trực tiếp vào trang.</CardDescription>
                </div>
                <Badge
                  tone={isGenerating ? "purple" : realtimeState.includes("lỗi") || realtimeState.includes("Mất") ? "danger" : "neutral"}
                  leadingIcon={isGenerating ? <Wifi className="size-3" /> : <WifiOff className="size-3" />}
                >
                  {realtimeState}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 pt-5 sm:pt-6">
              <Input
                label="Tiêu đề"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={120}
                disabled={!canEdit || isGenerating}
                hint={`${title.length}/120 ký tự · Nên dùng 35–70 ký tự để hiển thị tốt trên kết quả tìm kiếm.`}
              />

              <div>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <label htmlFor="post-content" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Nội dung
                  </label>
                  <span className="text-xs tabular-nums text-slate-400">{wordCount} từ · {content.length} ký tự</span>
                </div>
                <div className="flex flex-wrap gap-1 rounded-t-xl border border-b-0 border-slate-300 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-900">
                  <Button size="icon" variant="ghost" aria-label="In đậm đoạn đã chọn" disabled={!canEdit || isGenerating} onClick={() => wrapSelection("**")}>
                    <Bold className="size-4" />
                  </Button>
                  <Button size="icon" variant="ghost" aria-label="In nghiêng đoạn đã chọn" disabled={!canEdit || isGenerating} onClick={() => wrapSelection("_")}>
                    <Italic className="size-4" />
                  </Button>
                  <Button size="icon" variant="ghost" aria-label="Tạo tiêu đề phụ" disabled={!canEdit || isGenerating} onClick={() => prefixSelectedLines("## ")}>
                    <Hash className="size-4" />
                  </Button>
                  <Button size="icon" variant="ghost" aria-label="Tạo danh sách" disabled={!canEdit || isGenerating} onClick={() => prefixSelectedLines("- ")}>
                    <List className="size-4" />
                  </Button>
                  <Button size="icon" variant="ghost" aria-label="Thêm liên kết" disabled={!canEdit || isGenerating} onClick={() => wrapSelection("[", "](https://)")}>
                    <Link2 className="size-4" />
                  </Button>
                  <span className="mx-1 w-px self-stretch bg-slate-200 dark:bg-slate-700" aria-hidden="true" />
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={appEnv.useMocks ? <Sparkles className="size-4" /> : <RefreshCw className="size-4" />}
                    loading={isGenerating}
                    loadingText="AI đang viết"
                    disabled={!canEdit}
                    onClick={() => void handleGenerate()}
                  >
                    {appEnv.useMocks ? "Mô phỏng AI streaming" : "Tạo lại bằng AI"}
                  </Button>
                </div>
                <Textarea
                  ref={editorRef}
                  id="post-content"
                  aria-label="Nội dung bài viết"
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  rows={18}
                  disabled={!canEdit || isGenerating}
                  className="min-h-[410px] rounded-t-none border-slate-300 leading-7 dark:border-slate-700"
                />
                {isGenerating && <Progress className="mt-3" label="Đang nhận nội dung từ AI Service" />}
              </div>

              <Input
                label="URL ảnh đại diện"
                type="url"
                value={imageUrl}
                onChange={(event) => {
                  setImageUrl(event.target.value);
                  setImagePreviewFailed(false);
                }}
                disabled={!canEdit || isGenerating}
                leading={<ImageIcon className="size-4" />}
                placeholder="https://cdn.example.com/chien-dich/anh-bai-viet.jpg"
                hint="Ảnh sẽ được dùng cho Open Graph và bản xem trước mạng xã hội."
              />

              <div>
                <label htmlFor="seo-keyword" className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Từ khóa SEO
                </label>
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <Input
                    id="seo-keyword"
                    value={keywordDraft}
                    onChange={(event) => setKeywordDraft(event.target.value)}
                    onKeyDown={handleKeywordKeyDown}
                    disabled={!canEdit || isGenerating}
                    placeholder="Nhập long-tail keyword, nhấn Enter…"
                    leading={<Hash className="size-4" />}
                  />
                  <Button variant="outline" disabled={!canEdit || !keywordDraft.trim()} onClick={addKeywords}>Thêm từ khóa</Button>
                </div>
                <div className="mt-3 flex min-h-8 flex-wrap gap-2" aria-label="Từ khóa SEO đã chọn">
                  {keywords.map((keyword) => (
                    <Badge key={keyword} tone="success" className="gap-2 py-1.5">
                      {keyword}
                      {canEdit && (
                        <button type="button" onClick={() => removeKeyword(keyword)} aria-label={`Xóa từ khóa ${keyword}`} className="rounded-full hover:bg-emerald-200/60">
                          <X className="size-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                  {keywords.length === 0 && <span className="text-xs text-slate-400">Chưa có từ khóa mục tiêu.</span>}
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button
                variant="outline"
                leftIcon={<Send className="size-4" />}
                loading={isSubmitting}
                loadingText="Đang gửi"
                disabled={post.status !== "DRAFT" || isGenerating}
                onClick={() => void handleSubmitForReview()}
              >
                Gửi duyệt
              </Button>
              <Button
                leftIcon={<CheckCheck className="size-4" />}
                loading={isApproving}
                loadingText="Đang duyệt"
                disabled={post.status !== "PENDING" || isGenerating}
                onClick={() => void handleApprove()}
              >
                Duyệt bài
              </Button>
            </CardFooter>
          </Card>

          <div className="space-y-6">
            <Card variant="elevated" className="overflow-hidden">
              <CardHeader>
                <CardTitle>Bản xem trước Facebook</CardTitle>
                <CardDescription>Metadata dưới đây cập nhật trực tiếp bằng React Helmet Async.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950">
                  <div className="flex items-center gap-3 p-4">
                    <span className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 text-xs font-black text-white">SME</span>
                    <div>
                      <p className="text-sm font-bold text-slate-950 dark:text-white">SMEFlow Demo</p>
                      <p className="text-xs text-slate-400">Vừa xong · Công khai</p>
                    </div>
                  </div>
                  <p className="max-h-48 overflow-hidden whitespace-pre-wrap px-4 pb-4 text-sm leading-6 text-slate-700 dark:text-slate-200">
                    {content || "Nội dung bài viết sẽ xuất hiện tại đây."}
                  </p>
                  {imageUrl && !imagePreviewFailed ? (
                    <img src={imageUrl} alt="Ảnh xem trước bài viết" className="aspect-[1.91/1] w-full object-cover" onError={() => setImagePreviewFailed(true)} />
                  ) : (
                    <div className="grid aspect-[1.91/1] place-items-center bg-gradient-to-br from-emerald-100 via-teal-50 to-slate-100 text-center dark:from-emerald-950 dark:via-teal-950 dark:to-slate-900">
                      <div>
                        <ImageIcon className="mx-auto size-8 text-emerald-600" />
                        <p className="mt-2 text-xs font-semibold text-slate-500">Thêm URL ảnh để hoàn thiện social preview</p>
                      </div>
                    </div>
                  )}
                  <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">SMEFLOW.LOCAL</p>
                    <p className="mt-1 line-clamp-2 text-sm font-bold text-slate-900 dark:text-white">{title || "Tiêu đề bài viết"}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">{metaDescription || "Mô tả Open Graph sẽ được lấy từ nội dung bài viết."}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Điểm chất lượng</CardTitle>
                <CardDescription>Chỉ báo hỗ trợ quyết định; admin vẫn cần kiểm tra trước khi duyệt.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
                  <div className="mb-3 flex items-end justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">SEO</p>
                      <p className="mt-1 text-3xl font-black text-slate-950 dark:text-white">{seoScore}<span className="text-sm text-slate-400">/100</span></p>
                    </div>
                    <Badge tone={seoScore >= 80 ? "success" : "warning"}>{seoScore >= 80 ? "Tốt" : "Cần tối ưu"}</Badge>
                  </div>
                  <Progress value={seoScore} tone={scoreTone(seoScore)} size="sm" />
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
                  <div className="mb-3 flex items-end justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Faithfulness</p>
                      <p className="mt-1 text-3xl font-black text-slate-950 dark:text-white">{faithfulnessScore}<span className="text-sm text-slate-400">/100</span></p>
                    </div>
                    <Badge tone={faithfulnessScore >= 90 ? "success" : "warning"}>{faithfulnessScore >= 90 ? "Đáng tin cậy" : "Cần kiểm tra"}</Badge>
                  </div>
                  <Progress value={faithfulnessScore} tone={scoreTone(faithfulnessScore)} size="sm" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2"><ShieldCheck className="size-5 text-emerald-600" /> Fact Check List</CardTitle>
                  <CardDescription>Các dữ kiện RAG đã sử dụng trong nội dung và nguồn đối chiếu.</CardDescription>
                </div>
                <Badge tone={factCheck.checked && factCheck.issues.length === 0 ? "success" : "warning"} dot>
                  {factCheck.checked && factCheck.issues.length === 0 ? "Đã kiểm tra" : "Cần xem lại"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {defaultUsedFacts.map((fact) => (
                <div key={`${fact.field}-${fact.value}`} className="flex flex-col gap-2 rounded-xl border border-slate-100 p-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{fact.field}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{fact.value}</p>
                  </div>
                  <Badge tone="info">Nguồn KB #{fact.sourceKbId}</Badge>
                </div>
              ))}
              {factCheck.issues.map((issue) => (
                <Alert key={issue} tone="warning" title="Phát hiện cần xem lại" description={issue} />
              ))}
              {factCheck.issues.length === 0 && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                  <Check className="size-4" /> Không phát hiện thông số hoặc giá không có nguồn.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MessageSquareText className="size-5 text-emerald-600" /> Feedback loop</CardTitle>
              <CardDescription>Lưu chỉnh sửa của admin thành mẫu tốt để định hướng những lần sinh sau.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                label="Ghi chú cho AI"
                value={feedbackNote}
                onChange={(event) => setFeedbackNote(event.target.value)}
                rows={4}
                placeholder="Ví dụ: Giữ giọng văn gần gũi, CTA ngắn và luôn nêu rõ thời hạn ưu đãi…"
              />
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950">
                <input
                  type="checkbox"
                  checked={markAsGolden}
                  onChange={(event) => setMarkAsGolden(event.target.checked)}
                  className="mt-0.5 size-4 accent-emerald-600"
                />
                <span>
                  <span className="block text-sm font-bold text-emerald-950 dark:text-emerald-100">Đánh dấu bản hiện tại là Golden Sample</span>
                  <span className="mt-1 block text-xs leading-5 text-emerald-800 dark:text-emerald-300">Nội dung đã chỉnh sửa sẽ trở thành ví dụ tham chiếu, không tự động thay đổi model gốc.</span>
                </span>
              </label>
              <Button
                fullWidth
                variant="secondary"
                leftIcon={<Sparkles className="size-4" />}
                loading={isSavingFeedback}
                loadingText="Đang ghi nhận"
                onClick={() => void handleSaveFeedback()}
              >
                Ghi nhận phản hồi
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card variant="muted">
          <CardContent className="pt-5 sm:pt-6">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "1. Bản nháp", active: post.status === "DRAFT", done: post.status !== "DRAFT", icon: CircleAlert },
                { label: "2. Chờ duyệt", active: post.status === "PENDING", done: ["APPROVED", "SCHEDULED", "PUBLISHED"].includes(post.status), icon: FileCheck2 },
                { label: "3. Đã duyệt", active: ["APPROVED", "SCHEDULED", "PUBLISHED"].includes(post.status), done: ["SCHEDULED", "PUBLISHED"].includes(post.status), icon: CheckCheck },
              ].map(({ label, active, done, icon: Icon }) => (
                <div key={label} className={cn("flex items-center gap-3 rounded-xl border p-3", active ? "border-emerald-300 bg-white dark:border-emerald-800 dark:bg-slate-950" : "border-slate-200 dark:border-slate-800")}>
                  <span className={cn("grid size-8 place-items-center rounded-lg", done || active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-slate-100 text-slate-400 dark:bg-slate-800")}>
                    <Icon className="size-4" />
                  </span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default PostEditorPage;
