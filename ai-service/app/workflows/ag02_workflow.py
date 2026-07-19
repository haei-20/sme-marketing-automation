from __future__ import annotations

from collections.abc import Iterable
from typing import Literal

from langgraph.graph import END, START, StateGraph

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


def _parse_fact(fact: str) -> tuple[str, str]:
    text = fact.strip()
    if ":" in text:
        name, value = text.split(":", 1)
        return name.strip() or "feature", value.strip() or text
    if "-" in text:
        name, value = text.split("-", 1)
        return name.strip() or "feature", value.strip() or text
    return text[:60], text


def _unique_chunk_ids(values: Iterable[str]) -> list[str]:
    seen: set[str] = set()
    ordered: list[str] = []
    for value in values:
        if value not in seen:
            seen.add(value)
            ordered.append(value)
    return ordered


def retrieve_rag_context_agent(state: AgentWorkflowState) -> dict:
    request = state["request"]
    warnings = list(state.get("warnings", []))

    if request.rag_context is not None:
        rag_context = request.rag_context
    elif request.source_facts:
        sources = [
            SourceReference(
                document_id=f"{request.product_id}-source",
                chunk_id=f"manual-{index + 1}",
                content=fact,
                score=0.88,
            )
            for index, fact in enumerate(request.source_facts)
        ]
        rag_context = RAGContext(
            context="; ".join(request.source_facts),
            sources=sources,
            has_sufficient_context=True,
        )
    else:
        rag_context = RAGContext(
            context=(
                f"Minimal context for {request.product_name} "
                f"on {request.platform.value}"
            ),
            sources=[],
            has_sufficient_context=False,
            warnings=[
                "RAG context is minimal and only supports a draft answer.",
            ],
        )

    warnings.extend(rag_context.warnings)
    return {
        "rag_context": rag_context,
        "warnings": warnings,
        "status": WorkflowStatus.EXTRACTING_FEATURES,
    }


def extracting_features_agent(state: AgentWorkflowState) -> dict:
    request = state["request"]
    rag_context = state["rag_context"]
    warnings = list(state.get("warnings", []))

    feature_specs: list[tuple[str, str, list[str], float]] = []

    for index, fact in enumerate(request.source_facts):
        name, value = _parse_fact(fact)
        feature_specs.append(
            (name, value, [f"manual-{index + 1}"], 0.95)
        )

    if not feature_specs:
        for source in rag_context.sources:
            name, value = _parse_fact(source.content)
            confidence = source.score if source.score is not None else 0.7
            feature_specs.append(
                (name, value, [source.chunk_id], confidence)
            )

    if not feature_specs:
        warnings.append(
            "No source facts or RAG chunks were available for feature extraction."
        )

    extracted_features = ExtractedFeatures(
        business_id=request.business_id,
        product_id=request.product_id,
        product_name=request.product_name,
        features=[
            ProductFeature(
                name=name,
                value=value,
                confidence=confidence,
                source_chunk_ids=chunk_ids,
            )
            for name, value, chunk_ids, confidence in feature_specs
        ],
        warnings=warnings,
    )

    return {
        "extracted_features": extracted_features,
        "warnings": warnings,
        "status": WorkflowStatus.GENERATING_CONTENT,
    }


def description_generating_agent(state: AgentWorkflowState) -> dict:
    request = state["request"]
    extracted_features = state["extracted_features"]
    warnings = list(state.get("warnings", []))
    revision_count = state.get("revision_count", 0)

    selected_features = extracted_features.features
    if revision_count == 0 and len(selected_features) > 2:
        selected_features = selected_features[:2]

    feature_lines = [
        f"{feature.name}: {feature.value}"
        for feature in selected_features
    ]
    all_chunk_ids = _unique_chunk_ids(
        chunk_id
        for feature in selected_features
        for chunk_id in feature.source_chunk_ids
    )

    title = f"{request.product_name} | {request.objective}"
    caption = " ".join(
        [
            f"{request.tone.capitalize()} cho {request.platform.value}:",
            request.product_name,
            "co cac diem noi bat:",
            "; ".join(feature_lines) if feature_lines else "chua co du lieu duoc xac nhan.",
            f"Danh cho {request.target_audience}.",
        ]
    )
    if revision_count > 0 or len(selected_features) <= 2:
        caption = " ".join(
            [
                caption,
                "Noi dung nay duoc bo sung de bam sat hon vao cac nguon da xac nhan.",
            ]
        )

    hashtags = [
        f"#{request.product_name.replace(' ', '')}",
        f"#{request.platform.value}",
        "#marketing",
    ]

    generated_content = GeneratedContent(
        title=title,
        caption=caption,
        call_to_action="Lien he de nhan tu van va dat hang ngay hom nay.",
        hashtags=hashtags,
        platform=request.platform,
        source_chunk_ids=all_chunk_ids,
        warnings=warnings,
    )

    return {
        "generated_content": generated_content,
        "warnings": warnings,
        "status": WorkflowStatus.REVIEWING,
    }


def post_checking_agent(state: AgentWorkflowState) -> dict:
    request = state["request"]
    extracted_features = state["extracted_features"]
    generated_content = state["generated_content"]
    warnings = list(state.get("warnings", []))

    issues: list[str] = []

    for feature in extracted_features.features:
        if feature.value.lower() not in generated_content.caption.lower():
            issues.append(f"Missing supported fact: {feature.name}")

    if not generated_content.source_chunk_ids:
        issues.append("Generated content has no source references.")

    if request.objective.lower() not in generated_content.title.lower() and request.objective.lower() not in generated_content.caption.lower():
        issues.append("Objective is not clearly represented.")

    if request.tone.lower() not in generated_content.caption.lower():
        issues.append("Tone hint is not represented.")

    factual_score = 1.0 if not issues else max(0.0, 1.0 - (len(issues) * 0.2))
    relevance_score = 1.0 if request.target_audience.lower() in generated_content.caption.lower() else 0.8
    tone_score = 1.0 if request.tone.lower() in generated_content.caption.lower() else 0.6

    approved = (
        factual_score >= 0.9
        and relevance_score >= 0.8
        and tone_score >= 0.8
        and not issues
    )

    review_result = ReviewResult(
        approved=approved,
        factual_score=factual_score,
        relevance_score=relevance_score,
        tone_score=tone_score,
        issues=issues,
        revision_instructions=[
            "Add any missing feature backed by the input or RAG source."
            if issues
            else "No revision needed."
        ],
    )

    if not approved:
        warnings.extend(issues)

    return {
        "review_result": review_result,
        "warnings": warnings,
        "status": WorkflowStatus.COMPLETED if approved else WorkflowStatus.REVIEWING,
    }


def prepare_revision(state: AgentWorkflowState) -> dict:
    warnings = list(state.get("warnings", []))
    review_result = state["review_result"]
    revision_count = state.get("revision_count", 0) + 1

    warnings.extend(review_result.revision_instructions)

    return {
        "revision_count": revision_count,
        "warnings": warnings,
        "status": WorkflowStatus.REVISING,
    }


def route_after_review(
    state: AgentWorkflowState,
) -> Literal["prepare_revision", "finish"]:
    review_result = state["review_result"]
    request = state["request"]
    revision_count = state.get("revision_count", 0)

    if review_result.approved:
        return "finish"

    if revision_count >= request.max_revisions:
        return "finish"

    return "prepare_revision"


def finish_workflow(state: AgentWorkflowState) -> dict:
    review_result = state["review_result"]

    if review_result.approved:
        status = WorkflowStatus.COMPLETED
    else:
        status = WorkflowStatus.COMPLETED_WITH_WARNINGS

    return {"status": status}


def build_workflow():
    builder = StateGraph(AgentWorkflowState)

    builder.add_node("retrieve_rag_context", retrieve_rag_context_agent)
    builder.add_node("extracting_features", extracting_features_agent)
    builder.add_node("description_generating", description_generating_agent)
    builder.add_node("post_checking", post_checking_agent)
    builder.add_node("prepare_revision", prepare_revision)
    builder.add_node("finish", finish_workflow)

    builder.add_edge(START, "retrieve_rag_context")
    builder.add_edge("retrieve_rag_context", "extracting_features")
    builder.add_edge("extracting_features", "description_generating")
    builder.add_edge("description_generating", "post_checking")

    builder.add_conditional_edges(
        "post_checking",
        route_after_review,
        {
            "prepare_revision": "prepare_revision",
            "finish": "finish",
        },
    )
    builder.add_edge("prepare_revision", "description_generating")
    builder.add_edge("finish", END)

    return builder.compile()


def run_workflow(request: WorkflowRequest) -> WorkflowResult:
    workflow = build_workflow()

    result = workflow.invoke(
        {
            "request": request,
            "status": WorkflowStatus.PENDING,
            "revision_count": 0,
            "warnings": [],
        }
    )

    return WorkflowResult.model_validate(result)
