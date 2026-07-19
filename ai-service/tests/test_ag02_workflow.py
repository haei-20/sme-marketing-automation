import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.schemas.common import MarketingPlatform, WorkflowStatus
from app.schemas.workflow import WorkflowRequest
from app.workflows import build_workflow, run_workflow


def test_ag02_workflow_approves_after_one_revision():
    workflow = build_workflow()
    request = WorkflowRequest(
        business_id="biz-01",
        product_id="prd-01",
        product_name="Ca phe New Day",
        objective="ra mat san pham moi",
        target_audience="nhan vien van phong",
        platform=MarketingPlatform.FACEBOOK,
        tone="than thiet",
        source_facts=[
            "huong vi: dam da",
            "chat luong: rang xay nguyen chat",
            "dinh vi: phu hop nhan vien van phong",
        ],
        max_revisions=2,
    )

    result = workflow.invoke(
        {
            "request": request,
            "status": WorkflowStatus.PENDING,
            "revision_count": 0,
            "warnings": [],
        }
    )

    assert result["review_result"].approved is True
    assert result["revision_count"] == 1
    assert result["status"] == WorkflowStatus.COMPLETED
    assert result["extracted_features"].product_id == "prd-01"
    assert len(result["extracted_features"].features) == 3
    assert "dam da" in result["generated_content"].caption.lower()
    assert "rang xay nguyen chat" in result["generated_content"].caption.lower()
    assert "phu hop nhan vien van phong" in result["generated_content"].caption.lower()


def test_ag02_workflow_request_sample_matches_fixture():
    fixture_path = ROOT / "tests" / "fixtures" / "ag02" / "request.json"
    request = WorkflowRequest.model_validate_json(
        fixture_path.read_text(encoding="utf-8")
    )

    assert request.business_id == "biz-01"
    assert request.product_id == "prd-01"
    assert request.max_revisions == 2


def test_ag02_workflow_keeps_warning_when_rag_is_minimal():
    request = WorkflowRequest(
        business_id="biz-01",
        product_id="prd-02",
        product_name="Ca phe New Day",
        objective="ra mat san pham moi",
        target_audience="nhan vien van phong",
        platform=MarketingPlatform.WEBSITE,
        tone="than thiet",
        source_facts=[],
        max_revisions=0,
    )

    result = run_workflow(request)

    assert result.status == WorkflowStatus.COMPLETED_WITH_WARNINGS
    assert result.review_result.approved is False
    assert result.warnings
    assert result.rag_context.has_sufficient_context is False
