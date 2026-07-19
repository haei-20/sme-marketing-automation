from typing import Literal, TypedDict

from langgraph.graph import END, START, StateGraph


class WorkflowState(TypedDict):
    product_name: str
    features: list[str]
    content: str
    issues: list[str]
    revision_count: int
    max_revisions: int
    approved: bool


def extracting_features_agent(
    state: WorkflowState,
) -> dict:
    print("[Agent 1] Extracting product features")

    return {
        "features": [
            "Cà phê rang xay nguyên chất",
            "Phù hợp với nhân viên văn phòng",
            "Hương vị đậm đà",
        ]
    }


def description_generating_agent(
    state: WorkflowState,
) -> dict:
    revision_count = state["revision_count"]

    print(
        "[Agent 2] Generating marketing content "
        f"(revision {revision_count})"
    )

    if revision_count == 0:
        content = (
            f"Khám phá {state['product_name']}, "
            "lựa chọn tuyệt vời cho ngày mới."
        )
    else:
        content = (
            f"Khám phá {state['product_name']} "
            "rang xay nguyên chất, hương vị đậm đà "
            "dành cho nhân viên văn phòng. "
            "Đặt hàng ngay hôm nay!"
        )

    return {"content": content}


def post_checking_agent(
    state: WorkflowState,
) -> dict:
    print("[Agent 3] Checking generated content")

    required_phrases = [
        "rang xay nguyên chất",
        "nhân viên văn phòng",
        "Đặt hàng",
    ]

    issues = []

    for phrase in required_phrases:
        if phrase.lower() not in state["content"].lower():
            issues.append(f"Thiếu thông tin: {phrase}")

    approved = len(issues) == 0

    return {
        "issues": issues,
        "approved": approved,
    }


def prepare_revision(
    state: WorkflowState,
) -> dict:
    next_revision = state["revision_count"] + 1

    print("[Workflow] Content requires revision")
    print("[Workflow] Issues:", state["issues"])

    return {"revision_count": next_revision}


def route_after_review(
    state: WorkflowState,
) -> Literal["prepare_revision", "finish"]:
    if state["approved"]:
        print("[Workflow] Content approved")
        return "finish"

    if state["revision_count"] >= state["max_revisions"]:
        print("[Workflow] Maximum revisions reached")
        return "finish"

    return "prepare_revision"


def finish_workflow(
    state: WorkflowState,
) -> dict:
    return {}


def build_workflow():
    builder = StateGraph(WorkflowState)

    builder.add_node(
        "extracting_features",
        extracting_features_agent,
    )
    builder.add_node(
        "description_generating",
        description_generating_agent,
    )
    builder.add_node(
        "post_checking",
        post_checking_agent,
    )
    builder.add_node(
        "prepare_revision",
        prepare_revision,
    )
    builder.add_node(
        "finish",
        finish_workflow,
    )

    builder.add_edge(
        START,
        "extracting_features",
    )
    builder.add_edge(
        "extracting_features",
        "description_generating",
    )
    builder.add_edge(
        "description_generating",
        "post_checking",
    )

    builder.add_conditional_edges(
        "post_checking",
        route_after_review,
        {
            "prepare_revision": "prepare_revision",
            "finish": "finish",
        },
    )

    builder.add_edge(
        "prepare_revision",
        "description_generating",
    )
    builder.add_edge(
        "finish",
        END,
    )

    return builder.compile()


def main():
    workflow = build_workflow()

    initial_state: WorkflowState = {
        "product_name": "Cà phê New Day",
        "features": [],
        "content": "",
        "issues": [],
        "revision_count": 0,
        "max_revisions": 2,
        "approved": False,
    }

    result = workflow.invoke(initial_state)

    print("\n--- FINAL RESULT ---")
    print("Product:", result["product_name"])
    print("Features:", result["features"])
    print("Content:", result["content"])
    print("Approved:", result["approved"])
    print("Revision count:", result["revision_count"])
    print("Issues:", result["issues"])


if __name__ == "__main__":
    main()