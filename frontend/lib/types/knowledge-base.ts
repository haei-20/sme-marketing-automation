import type { EntityId, ISODateTime } from "./common";

export type KnowledgeFileType = "PDF" | "DOCX" | "XLSX";
export type KnowledgeStatus =
  | "UPLOADED"
  | "PROCESSING"
  | "INDEXED"
  | "FAILED";

export interface KnowledgeDocument {
  id: EntityId;
  businessId: EntityId;
  fileName: string;
  fileType: KnowledgeFileType;
  s3Url?: string;
  status: KnowledgeStatus;
  chunkCount: number;
  uploadedAt: ISODateTime;
  errorMessage?: string;
}

export interface KnowledgeUploadRequest {
  file: File;
}

export interface KnowledgeUploadResponse extends KnowledgeDocument {
  ingestJobId?: string;
}

export interface KnowledgeProcessingEvent {
  documentId: EntityId;
  status: KnowledgeStatus;
  chunkCount?: number;
  message?: string;
}
