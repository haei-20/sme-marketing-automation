from typing import TypedDict

from pydantic import BaseModel, ConfigDict, Field

from .common import MarketingPlatform, WorkflowStatus
from .content import GeneratedContent
from .feature import ExtractedFeatures
from .rag import RAGContext
from .review import ReviewResult


class WorkflowRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    business_id: str = Field(min_length=1, max_length=100)
    product_id: str = Field(min_length=1, max_length=100)
    product_name: str = Field(min_length=1, max_length=200)
    objective: str = Field(min_length=1, max_length=500)
    target_audience: str = Field(min_length=1, max_length=500)
    platform: MarketingPlatform
    tone: str = Field(min_length=1, max_length=100)
    source_facts: list[str] = Field(default_factory=list)
    rag_context: RAGContext | None = None
    max_revisions: int = Field(default=2, ge=0, le=10)


class AgentWorkflowState(TypedDict, total=False):
    request: WorkflowRequest
    rag_context: RAGContext
    extracted_features: ExtractedFeatures
    generated_content: GeneratedContent
    review_result: ReviewResult
    status: WorkflowStatus
    revision_count: int
    warnings: list[str]


WorkflowState = AgentWorkflowState


class WorkflowResult(BaseModel):
    model_config = ConfigDict(extra="forbid")

    request: WorkflowRequest
    rag_context: RAGContext
    extracted_features: ExtractedFeatures
    generated_content: GeneratedContent
    review_result: ReviewResult
    status: WorkflowStatus
    revision_count: int = Field(ge=0)
    warnings: list[str] = Field(default_factory=list)
