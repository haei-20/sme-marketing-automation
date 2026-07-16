import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  FolderKanban,
  Plus,
  Search,
  Target,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  EmptyState,
  Input,
  PageHeader,
  Progress,
  Select,
  StatCard,
} from "@/components";
import { mockCampaigns, mockPlans, type Campaign, type CampaignStatus } from "@/lib";

const statusMeta: Record<
  CampaignStatus,
  { label: string; tone: "neutral" | "success" | "info" }
> = {
  DRAFT: { label: "Bản nháp", tone: "neutral" },
  ACTIVE: { label: "Đang chạy", tone: "success" },
  DONE: { label: "Đã kết thúc", tone: "info" },
};

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function formatDate(value?: string) {
  if (!value) return "Chưa thiết lập";
  return dateFormatter.format(new Date(`${value}T00:00:00`));
}

function campaignProgress(campaign: Campaign) {
  if (!campaign.startDate || !campaign.endDate) return 0;
  if (campaign.status === "DONE") return 100;
  if (campaign.status === "DRAFT") return 0;

  const start = new Date(`${campaign.startDate}T00:00:00`).getTime();
  const end = new Date(`${campaign.endDate}T23:59:59`).getTime();
  const now = Date.now();
  if (now <= start) return 0;
  if (now >= end) return 100;
  return Math.round(((now - start) / (end - start)) * 100);
}

export function CampaignsPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | CampaignStatus>(
    "ALL",
  );
  const [noticeVisible, setNoticeVisible] = useState(false);

  const campaigns = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("vi-VN");
    return mockCampaigns.filter((campaign) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        campaign.title.toLocaleLowerCase("vi-VN").includes(normalizedQuery) ||
        campaign.goal?.toLocaleLowerCase("vi-VN").includes(normalizedQuery);
      const matchesStatus =
        statusFilter === "ALL" || campaign.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [query, statusFilter]);

  const activeCount = mockCampaigns.filter(
    (campaign) => campaign.status === "ACTIVE",
  ).length;
  const draftCount = mockCampaigns.filter(
    (campaign) => campaign.status === "DRAFT",
  ).length;
  const approvedPlans = mockPlans.filter(
    (plan) => plan.status === "APPROVED",
  ).length;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Điều phối marketing"
        title="Chiến dịch"
        description="Quản lý mục tiêu, bối cảnh mùa vụ và kế hoạch nội dung của từng chiến dịch trên một màn hình."
        actions={
          <Button
            leftIcon={<Plus className="size-4" />}
            onClick={() => setNoticeVisible(true)}
          >
            Tạo chiến dịch
          </Button>
        }
      />

      {noticeVisible && (
        <Alert
          tone="info"
          title="Luồng tạo chiến dịch đang ở chế độ minh họa"
          description="Ở bản tích hợp, nút này sẽ mở biểu mẫu nhập mục tiêu, thời gian và bối cảnh mùa vụ theo API Campaign."
          onDismiss={() => setNoticeVisible(false)}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Tổng chiến dịch"
          value={mockCampaigns.length}
          icon={<FolderKanban className="size-5" />}
          description="trong không gian làm việc"
        />
        <StatCard
          title="Đang hoạt động"
          value={activeCount}
          icon={<CircleDot className="size-5" />}
          delta="Đúng tiến độ"
          trend="up"
        />
        <StatCard
          title="Đang chuẩn bị"
          value={draftCount}
          icon={<CalendarDays className="size-5" />}
          description="chờ hoàn thiện kế hoạch"
        />
        <StatCard
          title="Kế hoạch đã duyệt"
          value={approvedPlans}
          icon={<CheckCircle2 className="size-5" />}
          description="có thể tạo nội dung"
        />
      </div>

      <Card>
        <CardContent className="pt-5 sm:pt-6">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
            <Input
              aria-label="Tìm chiến dịch"
              placeholder="Tìm theo tên hoặc mục tiêu chiến dịch…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              leading={<Search className="size-4" />}
            />
            <Select
              aria-label="Lọc trạng thái chiến dịch"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "ALL" | CampaignStatus)
              }
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang chạy</option>
              <option value="DRAFT">Bản nháp</option>
              <option value="DONE">Đã kết thúc</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      <section aria-labelledby="campaign-list-title">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2
              id="campaign-list-title"
              className="text-lg font-bold text-slate-950 dark:text-white"
            >
              Danh sách chiến dịch
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Hiển thị {campaigns.length} trên {mockCampaigns.length} chiến dịch
            </p>
          </div>
        </div>

        {campaigns.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Search className="size-5" />}
              title="Không tìm thấy chiến dịch"
              description="Thử đổi từ khóa hoặc xóa bộ lọc trạng thái để xem toàn bộ chiến dịch."
              action={
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
          </Card>
        ) : (
          <div className="grid gap-5 xl:grid-cols-2">
            {campaigns.map((campaign) => {
              const progress = campaignProgress(campaign);
              const plans = mockPlans.filter(
                (plan) => plan.campaignId === campaign.id,
              );
              const approved = plans.filter(
                (plan) => plan.status === "APPROVED",
              ).length;

              return (
                <Card key={campaign.id} variant="interactive" className="flex h-full flex-col">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <Badge tone={statusMeta[campaign.status].tone} dot>
                            {statusMeta[campaign.status].label}
                          </Badge>
                          <span className="text-xs font-medium text-slate-400">
                            #{campaign.id}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold tracking-tight text-slate-950 sm:text-xl dark:text-white">
                          {campaign.title}
                        </h3>
                      </div>
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        <Target className="size-5" aria-hidden="true" />
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 space-y-5">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-400">
                        Mục tiêu
                      </p>
                      <p className="mt-1.5 text-sm leading-6 text-slate-700 dark:text-slate-200">
                        {campaign.goal ?? "Chưa xác định mục tiêu"}
                      </p>
                    </div>

                    {campaign.seasonContext && (
                      <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          Bối cảnh mùa vụ
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                          {campaign.seasonContext}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                        <p className="text-xs text-slate-400">Bắt đầu</p>
                        <p className="mt-1 text-sm font-bold text-slate-700 dark:text-slate-200">
                          {formatDate(campaign.startDate)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                        <p className="text-xs text-slate-400">Kết thúc</p>
                        <p className="mt-1 text-sm font-bold text-slate-700 dark:text-slate-200">
                          {formatDate(campaign.endDate)}
                        </p>
                      </div>
                    </div>

                    {campaign.status !== "DRAFT" && (
                      <Progress
                        label="Tiến độ thời gian"
                        value={progress}
                        showValue
                        tone={campaign.status === "DONE" ? "info" : "primary"}
                      />
                    )}
                  </CardContent>

                  <CardFooter className="justify-between">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      <strong className="text-slate-700 dark:text-slate-200">
                        {approved}/{plans.length}
                      </strong>{" "}
                      kế hoạch đã duyệt
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      rightIcon={<ArrowRight className="size-3.5" />}
                      onClick={() => navigate(`/campaigns/${campaign.id}/plans`)}
                    >
                      Xem kế hoạch
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default CampaignsPage;
