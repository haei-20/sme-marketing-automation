import type { EntityId, ISODateTime } from "./common";

export type GenerationJobType = "PLAN" | "CONTENT";
export type GenerationJobStatus = "RUNNING" | "DONE" | "ERROR";

export interface GenerationJob {
  id: EntityId;
  postId?: EntityId;
  type: GenerationJobType;
  status: GenerationJobStatus;
  latencyMs?: number;
  modelName?: string;
  createdAt: ISODateTime;
  errorMessage?: string;
}

export interface EvaluationRunRequest {
  postId: EntityId;
  compareWithoutRag?: boolean;
}

export interface EvaluationDimension {
  score: number;
  explanation?: string;
}

export interface PostEvaluation {
  id: EntityId;
  postId: EntityId;
  seo: EvaluationDimension;
  faithfulness: EvaluationDimension;
  contextualRelevance?: EvaluationDimension;
  hallucinationRate?: number;
  baselineHallucinationRate?: number;
  modelName: string;
  latencyMs: number;
  evaluatedAt: ISODateTime;
}
