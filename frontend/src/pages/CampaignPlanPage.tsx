import {
  ArrowLeft,
  CalendarRange,
  Check,
  CheckCheck,
  FilePenLine,
  Megaphone,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";
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
  PageHeader,
  Progress,
  StatCard,
} from "@/components";
import {
  mockCampaigns,
  mockPlans,
  mockProducts,
  type Campaign,
  type MarketingChannel,
  type MarketingPlan,
  type PlanPeriod,
} from "@/lib";

const channelMeta: Record<
  MarketingChannel,
  { label: string; tone: "info" | "success" | "purple" | "warning" }
> = {
  WEBSITE: { label: "Website", tone: "info" },
  BLOG: { label: "Blog SEO", tone: "success" },
  FACEBOOK: { label: "Facebook", tone: "purple" },
  INSTAGRAM: { label: "Instagram", tone: "warning" },
};

function createFallbackWeeklyPlans(campaignId: number): MarketingPlan[] {
  return [
    {
      id: campaignId * 10 + 1,
      campaignId,
      period: "WEEK",
      periodLabel: "Tuần 1",
      channel: "FACEBOOK",
      productId: 46,
      message:
        "Giới thiệu giải pháp gia dụng xanh phù hợp không gian căn hộ nhỏ.",
      status: "SUGGESTED",
    },
    {
      id: campaignId * 10 + 2,
      campaignId,
      period: "WEEK",
      periodLabel: "Tuần 2",
      channel: "BLOG",
      productId: 46,
      message:
        "Hướng dẫn chọn thiết bị tiết kiệm diện tích và không dùng điện cho gia đình trẻ.",
      status: "SUGGESTED",
    },
  ];
}

function createMonthlyPlans(campaign: Campaign): MarketingPlan[] {
  const monthLabel = campaign.startDate
    ? new Intl.DateTimeFormat("vi-VN", {
        month: "long",
        year: "numeric",
      }).format(new Date(`${campaign.startDate}T00:00:00`))
    : "Tháng triển khai";

  return [
    {
      id: Number(campaign.id) * 100 + 91,
      campaignId: campaign.id,
      period: "MONTH",
      periodLabel: monthLabel,
      channel: "FACEBOOK",
      productId: 45,
      message:
        "Chuỗi nội dung nhận biết, giáo dục và chuyển đổi bám sát mục tiêu chính của chiến dịch.",
      status: "SUGGESTED",
    },
    {
      id: Number(campaign.id) * 100 + 92,
      campaignId: campaign.id,
      period: "MONTH",
      periodLabel: monthLabel,
      channel: "BLOG",
      productId: 46,
      message:
        "Bài viết trụ cột giải đáp nhu cầu khách hàng, kết hợp thông tin sản phẩm từ kho tri thức.",
      status: "APPROVED",
    },
  ];
}

function initialPlansForCampaign(campaign: Campaign) {
  const weeklyPlans = mockPlans.filter(
    (plan) => plan.campaignId === campaign.id && plan.period === "WEEK",
  );
  return [
    ...(weeklyPlans.length > 0
      ? weeklyPlans
      : createFallbackWeeklyPlans(Number(campaign.id))),
    ...createMonthlyPlans(campaign),
  ];
}

export function CampaignPlanPage() {
  const navigate = useNavigate();
  const { campaignId } = useParams<{ campaignId: string }>();
  const numericCampaignId = Number(campaignId);
  const campaign =
    mockCampaigns.find(
      (item) => Number(item.id) === numericCampaignId,
    ) ?? (campaignId ? undefined : mockCampaigns[0]);

  const [selectedPeriod, setSelectedPeriod] = useState<PlanPeriod>("WEEK");
  const [plans, setPlans] = useState<MarketingPlan[]>(() =>
    campaign ? initialPlansForCampaign(campaign) : [],
  );
  const [generatedPlanIds, setGeneratedPlanIds] = useState<number[]>([]);
  const [notice, setNotice] = useState<{
    tone: "info" | "success" | "warning";
    title: string;
    description: string;
  }>();

  const visiblePlans = useMemo(
    () => plans.filter((plan) => plan.period === selectedPeriod),
    [plans, selectedPeriod],
  );

  if (!campaign) {
    return (
      <Card>
        <EmptyState
          icon={<CalendarRange className="size-5" />}
          title="Không tìm thấy chiến dịch"
          description="Chiến dịch có thể đã bị xóa hoặc đường dẫn không còn hợp lệ."
          action={
            <Button
              variant="outline"
              leftIcon={<ArrowLeft className="size-4" />}
              onClick={() => navigate("/campaigns")}
            >
              Về danh sách chiến dịch
            </Button>
          }
        />
      </Card>
    );
  }

  const approvedCount = visiblePlans.filter(
    (plan) => plan.status === "APPROVED",
  ).length;
  const suggestedCount = visiblePlans.length - approvedCount;
  const completionRate = Math.round(
    (approvedCount / Math.max(visiblePlans.length, 1)) * 100,
  );
  const resolvedCampaignId = campaign.id;

  function approvePlan(planId: number) {
    setPlans((currentPlans) =>
      currentPlans.map((plan) =>
        Number(plan.id) === planId ? { ...plan, status: "APPROVED" } : plan,
      ),
    );
    setNotice({
      tone: "success",
      title: "Đã duyệt đề xuất",
      description:
        "Kế hoạch đã sẵn sàng để tạo nội dung bằng Local AI và dữ liệu RAG.",
    });
  }

  function approveAllVisible() {
    const visibleIds = new Set(visiblePlans.map((plan) => Number(plan.id)));
    setPlans((currentPlans) =>
      currentPlans.map((plan) =>
        visibleIds.has(Number(plan.id))
          ? { ...plan, status: "APPROVED" }
          : plan,
      ),
    );
    setNotice({
      tone: "success",
      title: "Đã duyệt toàn bộ kế hoạch",
      description: `Tất cả đề xuất theo ${selectedPeriod === "WEEK" ? "tuần" : "tháng"} đã sẵn sàng tạo nội dung.`,
    });
  }

  function createContent(plan: MarketingPlan) {
    if (plan.status !== "APPROVED") {
      setNotice({
        tone: "warning",
        title: "Cần duyệt kế hoạch trước",
        description:
          "Hãy kiểm tra thông điệp và duyệt đề xuất trước khi yêu cầu AI tạo bài viết.",
      });
      return;
    }

    const planId = Number(plan.id);
    setGeneratedPlanIds((ids) =>
      ids.includes(planId) ? ids : [...ids, planId],
    );
    setNotice({
      tone: "success",
      title: "Đã tạo yêu cầu nội dung",
      description:
        "Bản nháp đang được tạo từ thông điệp đã duyệt và dữ liệu trong kho tri thức.",
    });
  }

  function addSuggestedPlan() {
    const nextId = Math.max(0, ...plans.map((plan) => Number(plan.id))) + 1;
    const nextIndex = visiblePlans.length + 1;
    const channel: MarketingChannel =
      selectedPeriod === "WEEK" ? "INSTAGRAM" : "WEBSITE";
    setPlans((currentPlans) => [
      ...currentPlans,
      {
        id: nextId,
        campaignId: resolvedCampaignId,
        period: selectedPeriod,
        periodLabel:
          selectedPeriod === "WEEK"
            ? `Tuần ${nextIndex}`
            : `Tháng đề xuất ${nextIndex}`,
        channel,
        productId: mockProducts[nextIndex % mockProducts.length]?.id ?? 45,
        message:
          selectedPeriod === "WEEK"
            ? "Nội dung tương tác giúp khách hàng nhận diện nhu cầu và khám phá giải pháp phù hợp."
            : "Trang nội dung tổng hợp sản phẩm, lợi ích và lời kêu gọi hành động cho cả tháng.",
        status: "SUGGESTED",
      },
    ]);
    setNotice({
      tone: "info",
      title: "AI đã thêm một đề xuất mới",
      description:
        "Đây là tương tác minh họa. Bản tích hợp sẽ nhận kết quả theo thời gian thực qua WebSocket.",
    });
  }

  return (
    <div className="space-y-7">
      <PageHeader
        breadcrumbs={[
          { label: "Chiến dịch", href: "/campaigns" },
          { label: campaign.title },
        ]}
        eyebrow={`Chiến dịch #${campaign.id}`}
        title="Kế hoạch marketing"
        description={campaign.goal ?? "Lập kế hoạch nội dung cho chiến dịch."}
        meta={
          <>
            <Badge tone="success" dot>
              {campaign.status === "ACTIVE"
                ? "Đang triển khai"
                : campaign.status === "DRAFT"
                  ? "Bản nháp"
                  : "Đã kết thúc"}
            </Badge>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {campaign.startDate ?? "—"} → {campaign.endDate ?? "—"}
            </span>
          </>
        }
        actions={
          <Button
            variant="outline"
            leftIcon={<ArrowLeft className="size-4" />}
            onClick={() => navigate("/campaigns")}
          >
            Quay lại
          </Button>
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Mục kế hoạch"
          value={visiblePlans.length}
          icon={<CalendarRange className="size-5" />}
          description={selectedPeriod === "WEEK" ? "trong lịch tuần" : "trong lịch tháng"}
        />
        <StatCard
          title="Đã duyệt"
          value={approvedCount}
          icon={<CheckCheck className="size-5" />}
          delta={`${completionRate}%`}
          trend="up"
          description="sẵn sàng tạo bài"
        />
        <StatCard
          title="Chờ duyệt"
          value={suggestedCount}
          icon={<Sparkles className="size-5" />}
          description="đề xuất từ Local AI"
        />
        <StatCard
          title="Bản nháp đã tạo"
          value={generatedPlanIds.length}
          icon={<FilePenLine className="size-5" />}
          description="trong phiên làm việc này"
        />
      </div>

      <Card variant="elevated">
        <CardContent className="pt-5 sm:pt-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-bold text-slate-950 dark:text-white">
                Chu kỳ lập kế hoạch
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Chuyển giữa góc nhìn thực thi theo tuần và định hướng theo tháng.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div
                className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-900"
                role="group"
                aria-label="Chọn chu kỳ kế hoạch"
              >
                {(["WEEK", "MONTH"] as const).map((period) => (
                  <button
                    key={period}
                    type="button"
                    aria-pressed={selectedPeriod === period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`min-h-9 rounded-lg px-4 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 ${
                      selectedPeriod === period
                        ? "bg-white text-emerald-700 shadow-sm dark:bg-slate-800 dark:text-emerald-300"
                        : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    }`}
                  >
                    {period === "WEEK" ? "Theo tuần" : "Theo tháng"}
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                leftIcon={<Sparkles className="size-4" />}
                onClick={addSuggestedPlan}
              >
                AI đề xuất thêm
              </Button>
              <Button
                leftIcon={<CheckCheck className="size-4" />}
                onClick={approveAllVisible}
                disabled={suggestedCount === 0}
              >
                Duyệt tất cả
              </Button>
            </div>
          </div>
          <Progress
            label="Mức độ hoàn thiện kế hoạch"
            value={completionRate}
            showValue
            className="mt-5"
          />
        </CardContent>
      </Card>

      <section aria-labelledby="plan-list-title" className="space-y-4">
        <div>
          <h2
            id="plan-list-title"
            className="text-lg font-bold text-slate-950 dark:text-white"
          >
            {selectedPeriod === "WEEK"
              ? "Lịch nội dung theo tuần"
              : "Định hướng nội dung theo tháng"}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Duyệt thông điệp trước khi yêu cầu AI viết nội dung hoàn chỉnh.
          </p>
        </div>

        {visiblePlans.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Sparkles className="size-5" />}
              title="Chưa có đề xuất cho chu kỳ này"
              description="Yêu cầu AI tạo kế hoạch dựa trên sản phẩm, mục tiêu và bối cảnh mùa vụ của chiến dịch."
              action={
                <Button
                  leftIcon={<Sparkles className="size-4" />}
                  onClick={addSuggestedPlan}
                >
                  Tạo đề xuất đầu tiên
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="grid gap-5 xl:grid-cols-2">
            {visiblePlans.map((plan, index) => {
              const product = mockProducts.find(
                (item) => item.id === plan.productId,
              );
              const generated = generatedPlanIds.includes(Number(plan.id));

              return (
                <Card key={plan.id} className="flex h-full flex-col" variant="interactive">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <Badge tone={channelMeta[plan.channel].tone}>
                            {channelMeta[plan.channel].label}
                          </Badge>
                          <Badge
                            tone={plan.status === "APPROVED" ? "success" : "purple"}
                            dot
                          >
                            {plan.status === "APPROVED"
                              ? "Đã duyệt"
                              : "AI đề xuất"}
                          </Badge>
                        </div>
                        <CardTitle>{plan.periodLabel}</CardTitle>
                        <CardDescription className="mt-1">
                          Nội dung {index + 1} · {product?.name ?? "Sản phẩm tổng hợp"}
                        </CardDescription>
                      </div>
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        <Megaphone className="size-5" aria-hidden="true" />
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1">
                    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                      <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-400">
                        Thông điệp chủ đạo
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
                        {plan.message}
                      </p>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">
                        Nguồn: Kho tri thức RAG
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">
                        {product?.sku ?? "Nhiều sản phẩm"}
                      </span>
                    </div>
                  </CardContent>

                  <CardFooter className="justify-end">
                    {plan.status === "SUGGESTED" && (
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Check className="size-4" />}
                        onClick={() => approvePlan(Number(plan.id))}
                      >
                        Duyệt đề xuất
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant={generated ? "secondary" : "primary"}
                      leftIcon={
                        generated ? (
                          <CheckCircleIcon />
                        ) : (
                          <FilePenLine className="size-4" />
                        )
                      }
                      onClick={() => createContent(plan)}
                      disabled={generated}
                    >
                      {generated ? "Đã tạo bản nháp" : "Tạo nội dung"}
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

function CheckCircleIcon() {
  return <CheckCheck className="size-4" aria-hidden="true" />;
}

export default CampaignPlanPage;
