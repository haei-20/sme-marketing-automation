from pydantic import BaseModel, ConfigDict, Field

from .common import MarketingPlatform
from .feature import ProductFeature


class ContentGenerationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    business_id: str = Field(min_length=1, max_length=100)
    product_id: str = Field(min_length=1, max_length=100)
    product_name: str = Field(min_length=1, max_length=200)
    objective: str = Field(min_length=1, max_length=500)
    target_audience: str = Field(min_length=1, max_length=500)
    platform: MarketingPlatform
    tone: str = Field(min_length=1, max_length=100)
    features: list[ProductFeature] = Field(default_factory=list)
    source_chunk_ids: list[str] = Field(default_factory=list)


class GeneratedContent(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=200)
    caption: str = Field(min_length=1, max_length=5000)
    call_to_action: str = Field(min_length=1, max_length=300)
    hashtags: list[str] = Field(default_factory=list)
    platform: MarketingPlatform
    source_chunk_ids: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
