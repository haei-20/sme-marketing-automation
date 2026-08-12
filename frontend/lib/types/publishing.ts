import type { EntityId, ISODateTime } from "./common";

export type PublishStatus = "SUCCESS" | "FAILED" | "RETRYING";

export interface PublishLog {
  id: EntityId;
  postId: EntityId;
  channel: string;
  status: PublishStatus;
  externalPostId?: string;
  errorCode?: string;
  errorMessage?: string;
  attempt?: number;
  nextRetryAt?: ISODateTime;
  postedAt: ISODateTime;
}
