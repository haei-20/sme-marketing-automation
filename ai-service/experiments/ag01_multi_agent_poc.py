from dataclasses import dataclass, field


@dataclass
class WorkflowState:
    product_name: str
    features: list[str] = field(default_factory=list)
    content: str = ""
    issues: list[str] = field(default_factory=list)
    revision_count: int = 0
    max_revisions: int = 2
    approved: bool = False


def extracting_features_agent(state: WorkflowState) -> WorkflowState:
    print("[Agent 1] Extracting product features")

    state.features = [
        "Cà phê rang xay nguyên chất",
        "Phù hợp với nhân viên văn phòng",
        "Hương vị đậm đà",
    ]
    return state


def description_generating_agent(
    state: WorkflowState,
) -> WorkflowState:
    print(
        "[Agent 2] Generating marketing content "
        f"(revision {state.revision_count})"
    )

    if state.revision_count == 0:
        state.content = (
            f"Khám phá {state.product_name}, "
            "lựa chọn tuyệt vời cho ngày mới."
        )
    else:
        state.content = (
            f"Khám phá {state.product_name} rang xay nguyên chất, "
            "hương vị đậm đà dành cho nhân viên văn phòng. "
            "Đặt hàng ngay hôm nay!"
        )

    return state


def post_checking_agent(state: WorkflowState) -> WorkflowState:
    print("[Agent 3] Checking generated content")

    state.issues = []

    required_phrases = [
        "rang xay nguyên chất",
        "nhân viên văn phòng",
        "Đặt hàng",
    ]

    for phrase in required_phrases:
        if phrase.lower() not in state.content.lower():
            state.issues.append(f"Thiếu thông tin: {phrase}")

    state.approved = len(state.issues) == 0
    return state


def run_workflow(product_name: str) -> WorkflowState:
    state = WorkflowState(product_name=product_name)

    state = extracting_features_agent(state)

    while True:
        state = description_generating_agent(state)
        state = post_checking_agent(state)

        if state.approved:
            print("[Workflow] Content approved")
            break

        if state.revision_count >= state.max_revisions:
            print("[Workflow] Maximum revisions reached")
            break

        print("[Workflow] Content requires revision")
        print("[Workflow] Issues:", state.issues)
        state.revision_count += 1

    return state


if __name__ == "__main__":
    result = run_workflow("Cà phê New Day")

    print("\n--- FINAL RESULT ---")
    print("Product:", result.product_name)
    print("Features:", result.features)
    print("Content:", result.content)
    print("Approved:", result.approved)
    print("Revision count:", result.revision_count)
    print("Issues:", result.issues)