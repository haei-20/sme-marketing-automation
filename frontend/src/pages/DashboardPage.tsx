import {
  ArrowRight,
  BookOpenText,
  CalendarClock,
  CheckCircle2,
  CircleDot,
  FileCheck2,
  FileText,
  Megaphone,
  Plus,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

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
  StatusBadge,
  cn,
} from "@/components";
import {
  mockCampaigns,
  mockDashboardSummary,
  mockKnowledgeDocuments,
  mockPosts,
  type PostStatus,
} from "@/lib";

import { useAuth } from "../contexts/AuthContext";

const workflow = [
  { label: "Tri thức", description: "2 tài liệu sẵn sàng", icon: BookOpenText, state: "done" },
  { label: "Kế hoạch", description: "Chiến dịch đang chạy", icon: Megaphone, state: "done" },
  { label: "Sinh nội dung", description: "1 bài chờ duyệt", icon: WandSparkles, state: "active" },
  { label: "Phân phối", description: "1 bài đã lên lịch", icon: CalendarClock, state: "next" },
] as const;

function timeLabel(iso?: string) {
  if (!iso) return "Chưa đặt lịch";
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

const postStatusBadge: Record<
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

export function DashboardPage() {
  const { session } = useAuth();
  const firstName = session?.user.fullName.trim().split(" ").at(-1) ?? "Nguyên";
  const activeCampaign = mockCampaigns.find((campaign) => campaign.status === "ACTIVE");
  const pendingDocument = mockKnowledgeDocuments.find((document) => document.status === "PROCESSING");
  const upcomingPosts = mockPosts
    .filter((post) => post.status === "SCHEDULED" || post.status === "PENDING")
    .slice(0, 3);

  return (
    <>
      <Helmet>
        <title>Tổng quan | SMEFlow AI</title>
        <meta name="description" content="Theo dõi toàn bộ luồng marketing AI của doanh nghiệp." />
      </Helmet>

      <PageHeader
        eyebrow="Trung tâm điều hành"
        title={`Chào ${firstName}, hôm nay mình tạo gì?`}
        description="Từ dữ liệu nguồn đến bài đăng đã kiểm chứng—mọi bước đều ở trong tầm kiểm soát."
        actions={
          <>
            <Link to="/knowledge-base">
              <Button variant="outline" leftIcon={<Plus size={17} />}>Thêm tri thức</Button>
            </Link>
            <Link to="/campaigns">
              <Button leftIcon={<Sparkles size={17} />}>Tạo chiến dịch</Button>
            </Link>
          </>
        }
      />

      <section className="mt-7 overflow-hidden rounded-[28px] bg-[#10251f] text-white shadow-xl shadow-emerald-950/10">
        <div className="grid gap-8 p-6 sm:p-8 xl:grid-cols-[0.82fr_1.18fr] xl:p-9">
          <div className="flex flex-col justify-between">
            <div>
              <Badge className="bg-emerald-300/10 text-emerald-200 ring-emerald-300/20">
                <CircleDot size={12} className="mr-1" /> Đang vận hành
              </Badge>
              <h2 className="mt-5 max-w-lg text-2xl font-black tracking-[-0.04em] sm:text-3xl">
                {activeCampaign?.title}
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
                {activeCampaign?.goal}. AI đã có đủ dữ liệu sản phẩm để tiếp tục tạo nội dung.
              </p>
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link to={`/campaigns/${activeCampaign?.id}/plans`}>
                <Button className="bg-emerald-400 text-slate-950 hover:bg-emerald-300" rightIcon={<ArrowRight size={17} />}>
                  Tiếp tục kế hoạch
                </Button>
              </Link>
              <span className="text-xs text-slate-400">Cập nhật 12 phút trước</span>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {workflow.map(({ label, description, icon: Icon, state }, index) => (
              <div
                key={label}
                className={cn(
                  "relative rounded-2xl border p-4",
                  state === "active"
                    ? "border-emerald-300/40 bg-emerald-300/12"
                    : "border-white/10 bg-white/5",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "grid size-9 place-items-center rounded-xl",
                    state === "done" ? "bg-emerald-400 text-slate-950" : "bg-white/10 text-slate-300",
                  )}>
                    {state === "done" ? <CheckCircle2 size={18} /> : <Icon size={18} />}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">0{index + 1}</span>
                </div>
                <p className="mt-5 text-sm font-bold">{label}</p>
                <p className="mt-1 text-[11px] leading-5 text-slate-400">{description}</p>
                {state === "active" && <div className="absolute inset-x-4 bottom-0 h-0.5 bg-emerald-300" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Tri thức đã nhúng"
          value={mockDashboardSummary.indexedDocuments}
          icon={<BookOpenText size={20} />}
          delta="+2 tuần này"
          trend="up"
          description="tài liệu sẵn sàng"
        />
        <StatCard
          title="Chiến dịch hoạt động"
          value={mockDashboardSummary.activeCampaigns}
          icon={<Megaphone size={20} />}
          description="đang trong lịch"
        />
        <StatCard
          title="Bài chờ duyệt"
          value={mockDashboardSummary.pendingPosts}
          icon={<FileCheck2 size={20} />}
          delta="Cần xử lý"
          trend="neutral"
        />
        <StatCard
          title="Điểm SEO trung bình"
          value={`${mockDashboardSummary.averageSeoScore}/100`}
          icon={<FileText size={20} />}
          delta="+8 điểm"
          trend="up"
          description="so với bản LLM thuần"
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <Card variant="elevated">
          <CardHeader className="flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>Công việc cần chú ý</CardTitle>
              <CardDescription>Ưu tiên theo luồng để chiến dịch không bị nghẽn.</CardDescription>
            </div>
            <Link to="/posts" className="text-xs font-bold text-emerald-700 hover:text-emerald-800">
              Xem tất cả
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingPosts.map((post) => (
              <Link
                key={post.id}
                to={`/posts/${post.id}/edit`}
                className="flex flex-col gap-4 rounded-2xl border border-slate-100 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/35 sm:flex-row sm:items-center"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
                  {post.status === "PENDING" ? <FileCheck2 size={20} /> : <CalendarClock size={20} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-slate-900">{post.title}</span>
                  <span className="mt-1 block text-xs text-slate-500">
                    {post.channel} • {timeLabel(post.scheduleAt)}
                  </span>
                </span>
                <StatusBadge status={postStatusBadge[post.status]} />
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card variant="elevated" className="metric-grid">
          <CardHeader>
            <CardTitle>Sức khỏe kho tri thức</CardTitle>
            <CardDescription>Độ sẵn sàng cho truy xuất RAG.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-3xl font-black tracking-[-0.04em] text-slate-950">92%</p>
                  <p className="mt-1 text-xs text-slate-500">Dữ liệu có thể truy xuất</p>
                </div>
                <Badge tone="success">Tốt</Badge>
              </div>
              <Progress value={92} className="mt-5" />
            </div>
            {pendingDocument && (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                  <span className="size-2 animate-pulse rounded-full bg-amber-500" /> Đang xử lý
                </div>
                <p className="mt-2 truncate text-sm font-semibold text-amber-950">{pendingDocument.fileName}</p>
                <Progress value={58} tone="warning" size="sm" className="mt-3" />
              </div>
            )}
            <Link to="/knowledge-base" className="mt-4 flex items-center justify-between rounded-xl px-1 py-2 text-sm font-bold text-emerald-700">
              Quản lý kho tri thức <ArrowRight size={16} />
            </Link>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
