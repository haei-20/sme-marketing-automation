import type { MarketingChannel } from "./campaign";
import type { EntityId, ISODateTime } from "./common";

export type PostStatus =
  | "DRAFT"
  | "PENDING"
  | "APPROVED"
  | "SCHEDULED"
  | "PUBLISHED"
  | "FAILED";

export interface Post {
  id: EntityId;
  campaignId: EntityId;
  planId?: EntityId;
  title: string;
  content: string;
  imageUrl?: string;
  seoScore?: number;
  faithfulnessScore?: number;
  status: PostStatus;
  scheduleAt?: ISODateTime;
  createdBy: EntityId;
  createdAt: ISODateTime;
  channel?: MarketingChannel;
  seoKeywords?: string[];
}

export interface UsedFact {
  field: string;
  value: string;
  sourceKbId: EntityId;
}

export interface FactCheckResult {
  checked: boolean;
  issues: string[];
}

export interface GeneratePostRequest {
  campaignId: EntityId;
  planId?: EntityId;
  productId: EntityId;
  channel: MarketingChannel;
  message: string;
  seoKeywords: string[];
}

export interface GeneratePostAccepted {
  jobId: string;
  postId?: EntityId;
  topic?: string;
}

export interface GeneratedPostContent {
  title: string;
  content: string;
  usedFacts: UsedFact[];
  seoKeywordsUsed: string[];
  factCheck: FactCheckResult;
}

export interface UpdatePostRequest {
  title?: string;
  content?: string;
  imageUrl?: string;
  status?: Extract<PostStatus, "DRAFT" | "PENDING">;
}

export interface SchedulePostRequest {
  scheduleAt: ISODateTime;
}

export interface PostVersion {
  id: EntityId;
  postId: EntityId;
  content: string;
  editorId: EntityId;
  isGolden: boolean;
  createdAt: ISODateTime;
}

export type FeedbackType = "EXPLICIT_EDIT" | "IMPLICIT_SALES";

export interface PostFeedback {
  id: EntityId;
  postId: EntityId;
  type: FeedbackType;
  editedContent?: string;
  salesSignal?: string;
  note?: string;
  createdAt: ISODateTime;
}

export interface CreatePostFeedbackRequest {
  type: FeedbackType;
  editedContent?: string;
  salesSignal?: string;
  note?: string;
  markAsGolden?: boolean;
}
