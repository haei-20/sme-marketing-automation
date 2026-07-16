import {
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileText,
  Search,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";

import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  DataTable,
  type DataTableColumn,
  Input,
  PageHeader,
  Select,
  StatCard,
  StatusBadge,
} from "@/components";
import {
  appEnv,
  mockCampaigns,
  mockPosts,
  normalizeApiError,
  postApi,
  type MarketingChannel,
  type Post,
  type PostStatus,
} from "@/lib";

const statusMeta: Record<
  PostStatus,
  {
    label: string;
    badge: "draft" | "review" | "approved" | "scheduled" | "published" | "failed";
  }
> = {
  DRAFT: { label: "Bản nháp", badge: "draft" },
  PENDING: { label: "Chờ duyệt", badge: "review" },
  APPROVED: { label: "Đã duyệt", badge: "approved" },
  SCHEDULED: { label: "Đã lên lịch", badge: "scheduled" },
  PUBLISHED: { label: "Đã đăng", badge: "published" },
  FAILED: { label: "Thất bại", badge: "failed" },
};

const channelMeta: Record<MarketingChannel, { label: string; tone: "info" | "success" | "purple" | "warning" }> = {
  WEBSITE: { label: "Website", tone: "info" },
  BLOG: { label: "Blog SEO", tone: "success" },
  FACEBOOK: { label: "Facebook", tone: "purple" },
  INSTAGRAM: { label: "Instagram", tone: "warning" },
};

const dateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDateTime(value?: string) {
  return value ? dateTimeFormatter.format(new Date(value)) : "Chưa đặt lịch";
}

function postChannel(post: Post): MarketingChannel {
  return post.channel ?? "WEBSITE";
}

function updatedLabel(post: Post) {
  if (post.status === "SCHEDULED") return formatDateTime(post.scheduleAt);
  if (post.status === "PUBLISHED") return formatDateTime(post.scheduleAt ?? post.createdAt);
  return formatDateTime(post.createdAt);
}

export function PostsPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>(() => [...mockPosts]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | PostStatus>("ALL");
  const [channelFilter, setChannelFilter] = useState<"ALL" | MarketingChannel>("ALL");
  const [isLoading, setIsLoading] = useState(!appEnv.useMocks);
  const [loadError, setLoadError] = useState<string>();

  useEffect(() => {
    if (appEnv.useMocks) return;

    let active = true;
    void postApi
      .list()
      .then((items) => {
        if (active) setPosts(items);
      })
      .catch((error: unknown) => {
        if (active) setLoadError(normalizeApiError(error).message);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredPosts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("vi-VN");
    return posts.filter((post) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        post.title.toLocaleLowerCase("vi-VN").includes(normalizedQuery) ||
        post.content.toLocaleLowerCase("vi-VN").includes(normalizedQuery) ||
        post.seoKeywords?.some((keyword) =>
          keyword.toLocaleLowerCase("vi-VN").includes(normalizedQuery),
        );
      const matchesStatus = statusFilter === "ALL" || post.status === statusFilter;
      const matchesChannel = channelFilter === "ALL" || postChannel(post) === channelFilter;
      return matchesQuery && matchesStatus && matchesChannel;
    });
  }, [channelFilter, posts, query, statusFilter]);

  const pendingCount = posts.filter((post) => post.status === "PENDING").length;
  const scheduledCount = posts.filter((post) => post.status === "SCHEDULED").length;
  const publishedCount = posts.filter((post) => post.status === "PUBLISHED").length;
  const activeCampaign = mockCampaigns.find((campaign) => campaign.status === "ACTIVE");

  const columns: DataTableColumn<Post>[] = [
    {
      id: "post",
      header: "Bài viết",
      width: "44%",
      cell: (post) => (
        <button
          type="button"
          onClick={() => navigate(`/posts/${post.id}/edit`)}
          className="group max-w-xl text-left focus-visible:rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/20"
        >
          <span className="block font-bold text-slate-950 transition group-hover:text-emerald-700 dark:text-white dark:group-hover:text-emerald-300">
            {post.title}
          </span>
          <span className="mt-1 line-clamp-2 block text-xs leading-5 text-slate-500 dark:text-slate-400">
            {post.content}
          </span>
        </button>
      ),
    },
    {
      id: "channel",
      header: "Kênh",
      cell: (post) => {
        const meta = channelMeta[postChannel(post)];
        return <Badge tone={meta.tone}>{meta.label}</Badge>;
      },
    },
    {
      id: "quality",
      header: "Chất lượng",
      cell: (post) => (
        <div className="space-y-1 text-xs tabular-nums">
          <p><span className="text-slate-400">SEO</span> <strong>{post.seoScore ?? "—"}</strong></p>
          <p><span className="text-slate-400">Trung thực</span> <strong>{post.faithfulnessScore ?? "—"}</strong></p>
        </div>
      ),
    },
    {
      id: "status",
      header: "Trạng thái",
      cell: (post) => <StatusBadge status={statusMeta[post.status].badge} />,
    },
    {
      id: "time",
      header: "Thời gian",
      className: "whitespace-nowrap text-xs",
      cell: (post) => (
        <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
          <Clock3 className="size-3.5" aria-hidden="true" />
          {updatedLabel(post)}
        </span>
      ),
    },
    {
      id: "action",
      header: <span className="sr-only">Thao tác</span>,
      align: "right",
      cell: (post) => (
        <Button
          size="icon"
          variant="ghost"
          aria-label={`Mở bài ${post.title}`}
          onClick={() => navigate(`/posts/${post.id}/edit`)}
        >
          <ArrowUpRight className="size-4" />
        </Button>
      ),
    },
  ];

  function clearFilters() {
    setQuery("");
    setStatusFilter("ALL");
    setChannelFilter("ALL");
  }

  function openGenerationFlow() {
    if (activeCampaign) {
      navigate(`/campaigns/${activeCampaign.id}/plans`);
      return;
    }
    navigate("/campaigns");
  }

  return (
    <>
      <Helmet>
        <title>Bài viết | SMEFlow AI</title>
        <meta
          name="description"
          content="Quản lý bản nháp, duyệt nội dung và theo dõi bài marketing được tạo bằng Local AI và RAG."
        />
      </Helmet>

      <div className="space-y-7">
        <PageHeader
          eyebrow="Quy trình nội dung"
          title="Bài viết"
          description="Từ bản nháp AI đến bài đã xuất bản—kiểm tra chất lượng, duyệt và chuyển tiếp trên một luồng rõ ràng."
          actions={
            <Button leftIcon={<Sparkles className="size-4" />} onClick={openGenerationFlow}>
              Sinh bài từ kế hoạch
            </Button>
          }
        />

        {loadError && (
          <Alert
            tone="danger"
            title="Không thể tải danh sách mới nhất"
            description={`${loadError} Dữ liệu minh họa gần nhất vẫn được giữ trên màn hình.`}
            onDismiss={() => setLoadError(undefined)}
          />
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Tổng quan bài viết">
          <StatCard
            title="Tổng bài viết"
            value={posts.length}
            icon={<FileText className="size-5" />}
            loading={isLoading}
            description="trong không gian làm việc"
          />
          <StatCard
            title="Chờ duyệt"
            value={pendingCount}
            icon={<Clock3 className="size-5" />}
            loading={isLoading}
            delta={pendingCount > 0 ? "Cần xử lý" : "Đã xử lý hết"}
          />
          <StatCard
            title="Đã lên lịch"
            value={scheduledCount}
            icon={<CalendarClock className="size-5" />}
            loading={isLoading}
            description="đang chờ phân phối"
          />
          <StatCard
            title="Đã xuất bản"
            value={publishedCount}
            icon={<CheckCircle2 className="size-5" />}
            loading={isLoading}
            description="đã có nhật ký phân phối"
          />
        </section>

        <Card>
          <CardContent className="pt-5 sm:pt-6">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_210px_190px]">
              <Input
                aria-label="Tìm bài viết"
                placeholder="Tìm theo tiêu đề, nội dung hoặc từ khóa SEO…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                leading={<Search className="size-4" />}
              />
              <Select
                aria-label="Lọc trạng thái bài viết"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as "ALL" | PostStatus)}
              >
                <option value="ALL">Tất cả trạng thái</option>
                {(Object.keys(statusMeta) as PostStatus[]).map((status) => (
                  <option key={status} value={status}>{statusMeta[status].label}</option>
                ))}
              </Select>
              <Select
                aria-label="Lọc kênh bài viết"
                value={channelFilter}
                onChange={(event) => setChannelFilter(event.target.value as "ALL" | MarketingChannel)}
              >
                <option value="ALL">Tất cả kênh</option>
                {(Object.keys(channelMeta) as MarketingChannel[]).map((channel) => (
                  <option key={channel} value={channel}>{channelMeta[channel].label}</option>
                ))}
              </Select>
            </div>
          </CardContent>
        </Card>

        <section aria-labelledby="post-list-title" className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 id="post-list-title" className="text-lg font-bold text-slate-950 dark:text-white">
                Thư viện nội dung
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Hiển thị {filteredPosts.length} trên {posts.length} bài viết
              </p>
            </div>
          </div>

          <div className="hidden md:block">
            <DataTable
              caption="Danh sách bài viết marketing"
              columns={columns}
              data={filteredPosts}
              getRowKey={(post) => post.id}
              loading={isLoading}
              emptyTitle="Không tìm thấy bài viết"
              emptyDescription="Thử đổi từ khóa hoặc xóa bộ lọc để xem toàn bộ nội dung."
              emptyAction={<Button variant="outline" onClick={clearFilters}>Xóa bộ lọc</Button>}
            />
          </div>

          <div className="grid gap-4 md:hidden">
            {isLoading && [0, 1, 2].map((item) => (
              <Card key={item} className="h-44 animate-pulse bg-slate-50 dark:bg-slate-900" />
            ))}
            {!isLoading && filteredPosts.map((post) => {
              const channel = channelMeta[postChannel(post)];
              return (
                <Card key={post.id} variant="interactive">
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={statusMeta[post.status].badge} />
                      <Badge tone={channel.tone}>{channel.label}</Badge>
                    </div>
                    <h3 className="pt-2 text-base font-bold leading-6 text-slate-950 dark:text-white">
                      {post.title}
                    </h3>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {post.content}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span>SEO <strong className="text-slate-800 dark:text-slate-100">{post.seoScore ?? "—"}</strong></span>
                      <span>Trung thực <strong className="text-slate-800 dark:text-slate-100">{post.faithfulnessScore ?? "—"}</strong></span>
                    </div>
                  </CardContent>
                  <CardFooter className="justify-between">
                    <span className="text-xs text-slate-500">{updatedLabel(post)}</span>
                    <Button size="sm" variant="outline" onClick={() => navigate(`/posts/${post.id}/edit`)}>
                      Mở editor
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
            {!isLoading && filteredPosts.length === 0 && (
              <Card className="p-6 text-center">
                <p className="font-bold text-slate-950 dark:text-white">Không tìm thấy bài viết</p>
                <p className="mt-2 text-sm text-slate-500">Thử đổi từ khóa hoặc bộ lọc hiện tại.</p>
                <Button className="mt-4" variant="outline" onClick={clearFilters}>Xóa bộ lọc</Button>
              </Card>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

export default PostsPage;
