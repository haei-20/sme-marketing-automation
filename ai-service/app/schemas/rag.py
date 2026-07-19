from pydantic import BaseModel, ConfigDict, Field


class SourceReference(BaseModel):
    model_config = ConfigDict(extra="forbid")

    document_id: str = Field(min_length=1, max_length=100)
    chunk_id: str = Field(min_length=1, max_length=100)
    content: str = Field(min_length=1)
    score: float | None = Field(default=None, ge=0, le=1)


class RAGContext(BaseModel):
    model_config = ConfigDict(extra="forbid")

    context: str = Field(min_length=1)
    sources: list[SourceReference] = Field(default_factory=list)
    has_sufficient_context: bool = True
    warnings: list[str] = Field(default_factory=list)
