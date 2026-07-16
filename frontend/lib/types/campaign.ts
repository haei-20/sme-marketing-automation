import type { EntityId, ISODate, ISODateTime } from "./common";

export type CampaignStatus = "DRAFT" | "ACTIVE" | "DONE";
export type PlanPeriod = "WEEK" | "MONTH";
export type MarketingChannel =
  | "WEBSITE"
  | "BLOG"
  | "FACEBOOK"
  | "INSTAGRAM";
export type PlanStatus = "SUGGESTED" | "APPROVED";

export interface Campaign {
  id: EntityId;
  businessId: EntityId;
  title: string;
  goal?: string;
  seasonContext?: string;
  startDate?: ISODate;
  endDate?: ISODate;
  status: CampaignStatus;
  createdBy: EntityId;
  createdAt?: ISODateTime;
}

export interface CreateCampaignRequest {
  title: string;
  goal?: string;
  seasonContext?: string;
  startDate?: ISODate;
  endDate?: ISODate;
}

export interface MarketingPlan {
  id: EntityId;
  campaignId: EntityId;
  period: PlanPeriod;
  periodLabel: string;
  channel: MarketingChannel;
  productId: EntityId;
  message: string;
  status: PlanStatus;
}

export interface GeneratePlanRequest {
  period: PlanPeriod;
  productIds?: EntityId[];
  channels?: MarketingChannel[];
  additionalContext?: string;
}

export interface UpdatePlanRequest {
  periodLabel?: string;
  channel?: MarketingChannel;
  productId?: EntityId;
  message?: string;
  status?: PlanStatus;
}
