import type { EntityId, ISODateTime } from "./common";

export type PublishStatus = "SUCCESS" | "FAILED";

export interface PublishLog {
  id: EntityId;
  postId: EntityId;
  channel: string;
  status: PublishStatus;
  externalPostId?: string;
  errorMessage?: string;
  postedAt: ISODateTime;
}
