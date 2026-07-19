import sys
from pathlib import Path

import pytest


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from app.schemas.common import MarketingPlatform, WorkflowStatus
from app.schemas.content import GeneratedContent
from app.schemas.feature import ExtractedFeatures, ProductFeature
from app.schemas.rag import RAGContext, SourceReference
from app.schemas.review import ReviewResult
from app.schemas.workflow import (
    AgentWorkflowState,
    WorkflowRequest,
    WorkflowResult,
)


def test_workflow_request_roundtrip():
    request = WorkflowRequest(
        business_id="biz-01",
        product_id="prd-01",
        product_name="Ca phe New Day",
        objective="ra mat san pham moi",
        target_audience="nhan vien van phong",
        platform=MarketingPlatform.FACEBOOK,
        tone="than thiet",
        source_facts=["huong vi: dam da"],
        max_revisions=2,
    )

    payload = request.model_dump()
    restored = WorkflowRequest.model_validate(payload)

    assert restored == request
    assert restored.platform == MarketingPlatform.FACEBOOK


def test_nested_contracts_validate():
    rag_context = RAGContext(
        context="Nguon hop le",
        sources=[
            SourceReference(
                document_id="doc-01",
                chunk_id="chunk-01",
                content="huong vi: dam da",
                score=0.9,
            )
        ],
        has_sufficient_context=True,
    )

    extracted = ExtractedFeatures(
        business_id="biz-01",
        product_id="prd-01",
        product_name="Ca phe New Day",
        features=[
            ProductFeature(
                name="huong vi",
                value="dam da",
                confidence=0.95,
                source_chunk_ids=["chunk-01"],
            )
        ],
    )

    content = GeneratedContent(
        title="Ca phe New Day | ra mat san pham moi",
        caption="Than thiet cho facebook: Ca phe New Day co cac diem noi bat: huong vi: dam da. Danh cho nhan vien van phong.",
        call_to_action="Lien he de nhan tu van va dat hang ngay hom nay.",
        hashtags=["#CaPheNewDay", "#facebook", "#marketing"],
        platform=MarketingPlatform.FACEBOOK,
        source_chunk_ids=["chunk-01"],
    )

    review = ReviewResult(
        approved=True,
        factual_score=1.0,
        relevance_score=1.0,
        tone_score=1.0,
    )

    result = WorkflowResult(
        request=WorkflowRequest(
            business_id="biz-01",
            product_id="prd-01",
            product_name="Ca phe New Day",
            objective="ra mat san pham moi",
            target_audience="nhan vien van phong",
            platform=MarketingPlatform.FACEBOOK,
            tone="than thiet",
        ),
        rag_context=rag_context,
        extracted_features=extracted,
        generated_content=content,
        review_result=review,
        status=WorkflowStatus.COMPLETED,
        revision_count=0,
    )

    assert result.model_dump()["status"] == WorkflowStatus.COMPLETED


def test_invalid_scores_are_rejected():
    with pytest.raises(ValueError):
        ReviewResult(
            approved=False,
            factual_score=1.2,
            relevance_score=0.5,
            tone_score=0.5,
        )


def test_agent_workflow_state_alias_exists():
    assert AgentWorkflowState is not None
