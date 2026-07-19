from pydantic import BaseModel, ConfigDict, Field


class ReviewResult(BaseModel):
    model_config = ConfigDict(extra="forbid")

    approved: bool
    factual_score: float = Field(ge=0, le=1)
    relevance_score: float = Field(ge=0, le=1)
    tone_score: float = Field(ge=0, le=1)
    issues: list[str] = Field(default_factory=list)
    revision_instructions: list[str] = Field(default_factory=list)
