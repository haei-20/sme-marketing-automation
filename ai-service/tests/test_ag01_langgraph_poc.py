import sys
from pathlib import Path


EXPERIMENTS_DIR = (
    Path(__file__).resolve().parents[1] / "experiments"
)
sys.path.insert(0, str(EXPERIMENTS_DIR))

from ag01_langgraph_poc import build_workflow


def create_initial_state(max_revisions: int = 2) -> dict:
    return {
        "product_name": "Cà phê New Day",
        "features": [],
        "content": "",
        "issues": [],
        "revision_count": 0,
        "max_revisions": max_revisions,
        "approved": False,
    }


def test_content_is_approved_after_revision():
    workflow = build_workflow()

    result = workflow.invoke(create_initial_state())

    assert result["approved"] is True
    assert result["revision_count"] == 1
    assert result["issues"] == []

    assert len(result["features"]) == 3
    assert "rang xay nguyên chất" in result["content"]
    assert "nhân viên văn phòng" in result["content"]
    assert "Đặt hàng" in result["content"]


def test_workflow_stops_when_revision_is_not_allowed():
    workflow = build_workflow()

    result = workflow.invoke(
        create_initial_state(max_revisions=0)
    )

    assert result["approved"] is False
    assert result["revision_count"] == 0
    assert len(result["issues"]) == 3