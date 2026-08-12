import type {
  AuthSession,
  Business,
  Campaign,
  GenerationJob,
  KnowledgeDocument,
  MarketingPlan,
  Post,
  PostEvaluation,
  PostFeedback,
  Product,
  PublishLog,
  User,
} from "../types";

export const mockCurrentUser: User = {
  id: 4,
  email: "nguyen@annhien.vn",
  fullName: "Nguyễn Minh Nguyên",
  role: "ADMIN",
  businessId: 12,
  createdAt: "2026-06-02T08:15:00+07:00",
  updatedAt: "2026-07-14T16:30:00+07:00",
};

export const mockBusiness: Business = {
  id: 12,
  name: "Công ty TNHH Giải pháp Sống An Nhiên",
  industry: "Thiết bị gia dụng và chăm sóc sức khỏe",
  description:
    "Doanh nghiệp Việt cung cấp thiết bị lọc nước và sản phẩm gia dụng tiết kiệm năng lượng cho các gia đình trẻ.",
  ownerId: 1,
  createdAt: "2026-05-20T09:00:00+07:00",
};

/** Chỉ dùng cho chế độ demo. Không dùng token mẫu này ở môi trường thật. */
export const mockSession: AuthSession = {
  user: mockCurrentUser,
  tokens: {
    accessToken: "demo-access-token",
    refreshToken: "demo-refresh-token",
    tokenType: "Bearer",
    expiresIn: 900,
    refreshExpiresIn: 604800,
  },
};

export const mockKnowledgeDocuments: KnowledgeDocument[] = [
  {
    id: 7,
    businessId: 12,
    fileName: "Bang_gia_may_loc_nuoc_Q3_2026.xlsx",
    fileType: "XLSX",
    s3Url: "https://storage.example.local/kb/12/bang-gia-q3-2026.xlsx",
    status: "INDEXED",
    chunkCount: 84,
    uploadedAt: "2026-07-10T09:24:00+07:00",
  },
  {
    id: 8,
    businessId: 12,
    fileName: "Catalogue_AquaPure_2026.pdf",
    fileType: "PDF",
    s3Url: "https://storage.example.local/kb/12/catalogue-aquapure.pdf",
    status: "INDEXED",
    chunkCount: 136,
    uploadedAt: "2026-07-11T14:05:00+07:00",
  },
  {
    id: 9,
    businessId: 12,
    fileName: "Thong_diep_thuong_hieu.docx",
    fileType: "DOCX",
    status: "PROCESSING",
    chunkCount: 18,
    uploadedAt: "2026-07-15T08:42:00+07:00",
  },
  {
    id: 10,
    businessId: 12,
    fileName: "Bao_cao_san_pham_scan.pdf",
    fileType: "PDF",
    status: "FAILED",
    chunkCount: 0,
    uploadedAt: "2026-07-14T11:18:00+07:00",
    errorMessage:
      "Không thể nhận dạng đủ nội dung bản quét. Vui lòng tải lên tệp có độ phân giải cao hơn.",
  },
];

export const mockProducts: Product[] = [
  {
    id: 45,
    businessId: 12,
    name: "Máy lọc nước AquaPure S9",
    sku: "APS9-2026",
    price: 3200000,
    currency: "VND",
    attributes: {
      "Số lõi lọc": 9,
      "Công suất lọc": "15 lít/giờ",
      "Bảo hành": "24 tháng",
      "Phù hợp": ["Căn hộ", "Gia đình 3-5 người"],
      "Tiết kiệm điện": true,
    },
    sourceKbId: 7,
  },
  {
    id: 46,
    businessId: 12,
    name: "Bình lọc để bàn MiniPure M2",
    sku: "MPM2-2026",
    price: 1450000,
    currency: "VND",
    attributes: {
      "Số lõi lọc": 4,
      "Dung tích": "8 lít",
      "Không dùng điện": true,
      "Bảo hành": "12 tháng",
    },
    sourceKbId: 8,
  },
];

export const mockCampaigns: Campaign[] = [
  {
    id: 101,
    businessId: 12,
    title: "Mùa hè khỏe mạnh 2026",
    goal: "Tăng 25% số khách hàng quan tâm dòng máy lọc nước gia đình",
    seasonContext:
      "Nhu cầu nước sạch tăng trong mùa nóng; ưu tiên nội dung giáo dục và ưu đãi lắp đặt.",
    startDate: "2026-07-01",
    endDate: "2026-08-31",
    status: "ACTIVE",
    createdBy: 4,
    createdAt: "2026-06-25T10:30:00+07:00",
  },
  {
    id: 102,
    businessId: 12,
    title: "Gia dụng xanh cho căn hộ nhỏ",
    goal: "Xây dựng nhận biết cho dòng MiniPure",
    seasonContext: "Mùa bàn giao căn hộ mới tại các thành phố lớn.",
    startDate: "2026-09-01",
    endDate: "2026-09-30",
    status: "DRAFT",
    createdBy: 4,
    createdAt: "2026-07-13T15:45:00+07:00",
  },
];

export const mockPlans: MarketingPlan[] = [
  {
    id: 201,
    campaignId: 101,
    period: "WEEK",
    periodLabel: "Tuần 1 (01/07 - 07/07)",
    channel: "BLOG",
    productId: 45,
    message:
      "Giải thích cách chọn máy lọc nước phù hợp cho gia đình 3-5 người trong mùa nóng.",
    status: "APPROVED",
  },
  {
    id: 202,
    campaignId: 101,
    period: "WEEK",
    periodLabel: "Tuần 2 (08/07 - 14/07)",
    channel: "FACEBOOK",
    productId: 45,
    message:
      "AquaPure S9 lọc 15 lít mỗi giờ, ưu đãi lắp đặt miễn phí trong tháng 7.",
    status: "APPROVED",
  },
  {
    id: 203,
    campaignId: 101,
    period: "WEEK",
    periodLabel: "Tuần 3 (15/07 - 21/07)",
    channel: "WEBSITE",
    productId: 46,
    message:
      "Gợi ý giải pháp nước sạch gọn nhẹ, không dùng điện cho người sống trong căn hộ nhỏ.",
    status: "SUGGESTED",
  },
  {
    id: 204,
    campaignId: 101,
    period: "WEEK",
    periodLabel: "Tuần 4 (22/07 - 31/07)",
    channel: "INSTAGRAM",
    productId: 45,
    message:
      "Chuỗi hình ảnh thói quen uống đủ nước và chăm sóc sức khỏe gia đình mùa hè.",
    status: "SUGGESTED",
  },
];

export const mockPosts: Post[] = [
  {
    id: 301,
    campaignId: 101,
    planId: 202,
    title: "Nước sạch cho cả nhà, an tâm suốt mùa hè",
    content:
      "Mùa nóng khiến nhu cầu nước uống của cả gia đình tăng cao. AquaPure S9 với 9 lõi lọc và công suất 15 lít/giờ giúp gia đình 3-5 người chủ động nguồn nước sạch mỗi ngày. Sản phẩm có giá 3.200.000 đồng, bảo hành 24 tháng và được hỗ trợ lắp đặt miễn phí trong tháng 7.",
    imageUrl: "https://images.example.local/posts/aquapure-s9-summer.jpg",
    seoScore: 86,
    faithfulnessScore: 96,
    status: "SCHEDULED",
    scheduleAt: "2026-07-16T19:30:00+07:00",
    createdBy: 4,
    createdAt: "2026-07-12T10:12:00+07:00",
    channel: "FACEBOOK",
    seoKeywords: [
      "máy lọc nước gia đình giá tốt",
      "máy lọc nước cho gia đình 5 người",
    ],
  },
  {
    id: 302,
    campaignId: 101,
    planId: 203,
    title: "Giải pháp nước sạch gọn nhẹ cho căn hộ nhỏ",
    content:
      "MiniPure M2 có thiết kế để bàn, dung tích 8 lít và vận hành không cần điện. Đây là lựa chọn phù hợp cho người trẻ cần tối ưu không gian sống.",
    seoScore: 74,
    faithfulnessScore: 94,
    status: "PENDING",
    createdBy: 4,
    createdAt: "2026-07-15T09:18:00+07:00",
    channel: "WEBSITE",
    seoKeywords: ["bình lọc nước không dùng điện cho căn hộ"],
  },
  {
    id: 303,
    campaignId: 101,
    planId: 201,
    title: "5 tiêu chí chọn máy lọc nước cho gia đình",
    content:
      "Một chiếc máy phù hợp cần đáp ứng nhu cầu sử dụng, công suất, chất lượng lõi lọc, chi phí vận hành và chính sách bảo hành.",
    imageUrl: "https://images.example.local/posts/guide-water-filter.jpg",
    seoScore: 82,
    faithfulnessScore: 98,
    status: "PUBLISHED",
    scheduleAt: "2026-07-07T08:00:00+07:00",
    createdBy: 4,
    createdAt: "2026-07-02T13:20:00+07:00",
    channel: "BLOG",
    seoKeywords: ["cách chọn máy lọc nước cho gia đình"],
  },
];

export const mockPostFeedback: PostFeedback[] = [
  {
    id: 401,
    postId: 301,
    type: "EXPLICIT_EDIT",
    editedContent:
      "Mùa nóng khiến nhu cầu nước uống của cả gia đình tăng cao. Hãy chủ động nguồn nước sạch với AquaPure S9.",
    note: "Ưu tiên mở bài ngắn và đi thẳng vào lợi ích của khách hàng.",
    createdAt: "2026-07-13T16:05:00+07:00",
  },
  {
    id: 402,
    postId: 303,
    type: "IMPLICIT_SALES",
    salesSignal: "12 yêu cầu tư vấn trong 7 ngày sau khi đăng",
    note: "Bài hướng dẫn có tỷ lệ chuyển đổi tốt, nên ưu tiên phong cách giáo dục.",
    createdAt: "2026-07-14T18:00:00+07:00",
  },
];

export const mockPublishLogs: PublishLog[] = [
  {
    id: 501,
    postId: 303,
    channel: "BLOG",
    status: "SUCCESS",
    attempt: 1,
    externalPostId: "blog-5-tieu-chi-chon-may-loc-nuoc",
    postedAt: "2026-07-07T08:00:04+07:00",
  },
  {
    id: 502,
    postId: 301,
    channel: "FACEBOOK",
    status: "FAILED",
    errorCode: "FACEBOOK_TOKEN_EXPIRED",
    attempt: 1,
    errorMessage:
      "Facebook Page Access Token đã hết hạn. Hệ thống sẽ thử lại sau khi kết nối được cập nhật.",
    postedAt: "2026-07-15T07:30:03+07:00",
  },
];

export const mockEvaluations: PostEvaluation[] = [
  {
    id: 601,
    postId: 301,
    seo: {
      score: 86,
      explanation:
        "Từ khóa đuôi dài xuất hiện tự nhiên; tiêu đề có thể cụ thể hơn về sản phẩm.",
    },
    faithfulness: {
      score: 96,
      explanation:
        "Giá, công suất và thời hạn bảo hành đều khớp tài liệu nguồn.",
    },
    contextualRelevance: {
      score: 91,
      explanation: "Thông điệp phù hợp bối cảnh nhu cầu nước sạch mùa hè.",
    },
    hallucinationRate: 0.02,
    baselineHallucinationRate: 0.18,
    modelName: "llama-3.1-8b-instruct-q4",
    latencyMs: 8420,
    evaluatedAt: "2026-07-12T10:25:00+07:00",
  },
];

export const mockGenerationJobs: GenerationJob[] = [
  {
    id: 701,
    postId: 301,
    type: "CONTENT",
    status: "DONE",
    latencyMs: 12640,
    modelName: "llama-3.1-8b-instruct-q4",
    createdAt: "2026-07-12T10:11:30+07:00",
  },
  {
    id: 702,
    type: "PLAN",
    status: "RUNNING",
    modelName: "llama-3.1-8b-instruct-q4",
    createdAt: "2026-07-15T10:02:00+07:00",
  },
];

export const mockDashboardSummary = {
  indexedDocuments: mockKnowledgeDocuments.filter(
    (document) => document.status === "INDEXED",
  ).length,
  activeCampaigns: mockCampaigns.filter(
    (campaign) => campaign.status === "ACTIVE",
  ).length,
  pendingPosts: mockPosts.filter((post) => post.status === "PENDING").length,
  publishedPosts: mockPosts.filter((post) => post.status === "PUBLISHED").length,
  averageSeoScore: Math.round(
    mockPosts.reduce((total, post) => total + (post.seoScore ?? 0), 0) /
      mockPosts.length,
  ),
};
