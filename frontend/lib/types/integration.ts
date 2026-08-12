import type { ISODateTime } from "./common";

export type FacebookConnectionStatus = "DISCONNECTED" | "CONNECTED" | "NEEDS_REAUTH";

export interface FacebookPageSummary {
  id: string;
  name: string;
}

/** Metadata an toàn cho renderer; tuyệt đối không thêm Page/User access token. */
export interface FacebookIntegrationStatus {
  status: FacebookConnectionStatus;
  page?: FacebookPageSummary;
  permissions: string[];
  lastCheckedAt?: ISODateTime;
  errorCode?: string;
  errorMessage?: string;
}

export type FacebookTransferData =
  | "PAGE_IDENTITY"
  | "APPROVED_POST_CONTENT"
  | "APPROVED_MEDIA"
  | "PUBLISH_SCHEDULE";

export interface FacebookConsentRequest {
  consentVersion: "2026-08";
  acceptedData: FacebookTransferData[];
  acknowledgeExternalTransfer: true;
}

export interface FacebookConnectResponse {
  authorizationUrl: string;
  expiresAt: ISODateTime;
}

export interface RetryPublishRequest {
  consentVersion: "2026-08";
  acknowledgeExternalTransfer: true;
}
