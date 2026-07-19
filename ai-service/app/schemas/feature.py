from pydantic import BaseModel, ConfigDict, Field


class ProductFeature(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=100)
    value: str = Field(min_length=1, max_length=1000)
    confidence: float = Field(ge=0, le=1)
    source_chunk_ids: list[str] = Field(default_factory=list)


class ExtractedFeatures(BaseModel):
    model_config = ConfigDict(extra="forbid")

    business_id: str = Field(min_length=1, max_length=100)
    product_id: str = Field(min_length=1, max_length=100)
    product_name: str = Field(min_length=1, max_length=200)
    features: list[ProductFeature] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
