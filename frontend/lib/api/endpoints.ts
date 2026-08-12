import { sessionStore } from "../auth";
import type {
  AuthResponse,
  AuthTokens,
  Campaign,
  CreateCampaignRequest,
  CreatePostFeedbackRequest,
  EvaluationRunRequest,
  GeneratePlanRequest,
  GeneratePostAccepted,
  GeneratePostRequest,
  FacebookConnectResponse,
  FacebookConsentRequest,
  FacebookIntegrationStatus,
  KnowledgeDocument,
  KnowledgeStatus,
  KnowledgeUploadResponse,
  LoginRequest,
  MarketingPlan,
  Post,
  PostEvaluation,
  PostFeedback,
  PostStatus,
  PublishLog,
  RegisterRequest,
  RetryPublishRequest,
  SchedulePostRequest,
  UpdatePostRequest,
} from "../types";
import { apiClient } from "./client";

function queryString(
  values: Record<string, string | number | undefined>,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

function tokensFromAuthResponse(response: AuthResponse): AuthTokens {
  return {
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    tokenType: response.tokenType,
    expiresIn: response.expiresIn,
    refreshExpiresIn: response.refreshExpiresIn,
  };
}

export const authApi = {
  async login(payload: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.postJson<AuthResponse, LoginRequest>(
      "/api/auth/login",
      payload,
      { auth: false },
    );
    sessionStore.setSession({
      user: response.user,
      tokens: tokensFromAuthResponse(response),
    });
    return response;
  },

  async register(payload: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.postJson<AuthResponse, RegisterRequest>(
      "/api/auth/register",
      payload,
      { auth: false },
    );
    sessionStore.setSession({
      user: response.user,
      tokens: tokensFromAuthResponse(response),
    });
    return response;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post<void>("/api/auth/logout");
    } finally {
      sessionStore.clear();
    }
  },
};

export const knowledgeApi = {
  list(status?: KnowledgeStatus): Promise<KnowledgeDocument[]> {
    return apiClient.get(`/api/kb${queryString({ status })}`);
  },

  upload(file: File): Promise<KnowledgeUploadResponse> {
    const form = new FormData();
    form.append("file", file);
    return apiClient.post("/api/kb/upload", { body: form });
  },
};

export const campaignApi = {
  list(): Promise<Campaign[]> {
    return apiClient.get("/api/campaigns");
  },

  create(payload: CreateCampaignRequest): Promise<Campaign> {
    return apiClient.postJson("/api/campaigns", payload);
  },

  generatePlan(
    campaignId: number,
    payload: GeneratePlanRequest,
  ): Promise<MarketingPlan[]> {
    return apiClient.postJson(
      `/api/campaigns/${campaignId}/plan`,
      payload,
    );
  },

  listPlans(campaignId: number): Promise<MarketingPlan[]> {
    return apiClient.get(`/api/campaigns/${campaignId}/plans`);
  },
};

export const postApi = {
  list(filters: { status?: PostStatus; campaignId?: number } = {}): Promise<Post[]> {
    return apiClient.get(`/api/posts${queryString(filters)}`);
  },

  generate(payload: GeneratePostRequest): Promise<GeneratePostAccepted> {
    return apiClient.postJson("/api/posts/generate", payload);
  },

  update(postId: number, payload: UpdatePostRequest): Promise<Post> {
    return apiClient.putJson(`/api/posts/${postId}`, payload);
  },

  approve(postId: number): Promise<Post> {
    return apiClient.post(`/api/posts/${postId}/approve`);
  },

  schedule(postId: number, payload: SchedulePostRequest): Promise<Post> {
    return apiClient.postJson(`/api/posts/${postId}/schedule`, payload);
  },

  feedback(
    postId: number,
    payload: CreatePostFeedbackRequest,
  ): Promise<PostFeedback> {
    return apiClient.postJson(`/api/posts/${postId}/feedback`, payload);
  },

  logs(postId: number): Promise<PublishLog[]> {
    return apiClient.get(`/api/posts/${postId}/logs`);
  },

};

export const publishingApi = {
  listLogs(): Promise<PublishLog[]> {
    return apiClient.get("/api/publishing/logs");
  },

  retry(logId: number, payload: RetryPublishRequest): Promise<PublishLog> {
    return apiClient.postJson(`/api/publishing/logs/${logId}/retry`, payload);
  },
};

export const integrationApi = {
  facebookStatus(): Promise<FacebookIntegrationStatus> {
    return apiClient.get("/api/integrations/facebook");
  },

  connectFacebook(payload: FacebookConsentRequest): Promise<FacebookConnectResponse> {
    return apiClient.postJson("/api/integrations/facebook/connect", payload);
  },

  disconnectFacebook(): Promise<void> {
    return apiClient.delete("/api/integrations/facebook");
  },
};

export const evaluationApi = {
  run(payload: EvaluationRunRequest): Promise<PostEvaluation> {
    return apiClient.postJson("/api/eval/run", payload);
  },
};
