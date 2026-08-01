import json
from typing import Protocol

from pydantic import ValidationError

from app.buddy.context import build_buddy_context
from app.buddy.models import (
    BuddyAction,
    BuddyContext,
    BuddyItemKind,
    BuddyModelOutput,
    BuddyQuestionRequest,
    BuddyResponse,
    BuddySurface,
)
from app.buddy.ollama import (
    BuddyModelProtocolError,
    BuddyModelUnavailable,
    OllamaBuddyClient,
)
from app.buddy.prompt import add_json_correction, build_buddy_messages
from app.persistence.database import BoardlyDatabase


class BuddyModelClient(Protocol):
    def generate(self, messages: list[dict[str, str]]) -> str: ...


def answer_buddy_question(
    employee_id: str,
    request: BuddyQuestionRequest,
    database: BoardlyDatabase | None = None,
    model_client: BuddyModelClient | None = None,
) -> BuddyResponse:
    context = build_buddy_context(
        employee_id=employee_id,
        current_surface=request.current_surface,
        database=database,
    )
    client = model_client or OllamaBuddyClient()
    messages = build_buddy_messages(context, request.question)

    try:
        raw_output = client.generate(messages)
        try:
            model_output = _parse_model_output(raw_output)
        except BuddyModelProtocolError:
            corrected_output = client.generate(
                add_json_correction(messages, raw_output)
            )
            model_output = _parse_model_output(corrected_output)
    except (
        BuddyModelUnavailable,
        BuddyModelProtocolError,
        TimeoutError,
    ):
        return build_basic_fallback(context)

    return _build_model_response(context, model_output)


def build_basic_fallback(context: BuddyContext) -> BuddyResponse:
    action_index = _build_action_index(context)
    next_action = next(
        (
            action_index[item.item_id]
            for item in context.tasks
            if item.status != "completed"
        ),
        None,
    )
    if next_action is None:
        next_action = next(
            (
                action_index[item.item_id]
                for item in context.documents
                if not item.reviewed
            ),
            None,
        )
    blocker = next(
        (
            action_index[item.item_id]
            for item in context.access
            if item.status
            in {"blocked_by_policy", "waiting_for_human_approval"}
        ),
        None,
    )
    return BuddyResponse(
        source="basic_fallback",
        message=(
            "JedAI's local model is currently unavailable. Showing basic plan guidance."
        ),
        recommended_actions=[next_action] if next_action else [],
        blockers=[blocker] if blocker else [],
        status_summary=(
            f"{context.progress.remaining_tasks} checklist tasks remain in the "
            "current persisted plan."
        ),
        evidence=_build_evidence(
            context,
            [next_action] if next_action else [],
        ),
    )


def _parse_model_output(value: str) -> BuddyModelOutput:
    try:
        payload = json.loads(value)
        if not isinstance(payload, dict):
            raise TypeError("buddy model output must be a JSON object")
        return BuddyModelOutput.model_validate(payload)
    except (json.JSONDecodeError, ValidationError, TypeError) as error:
        raise BuddyModelProtocolError(
            "local model output did not match the buddy schema"
        ) from error


def _build_model_response(
    context: BuddyContext, model_output: BuddyModelOutput
) -> BuddyResponse:
    action_index = _build_action_index(context)
    recommendations = _validated_actions(
        model_output.recommended_item_ids,
        action_index,
        recommendation=True,
    )
    blockers = _validated_actions(
        model_output.blocker_item_ids,
        action_index,
        recommendation=False,
    )
    return BuddyResponse(
        source="local_model",
        message=model_output.message,
        recommended_actions=recommendations,
        blockers=blockers,
        status_summary=model_output.status_summary,
        missing_information=model_output.missing_information,
        evidence=_build_evidence(context, recommendations),
    )


def _build_action_index(context: BuddyContext) -> dict[str, BuddyAction]:
    actions: dict[str, BuddyAction] = {}
    for task in context.tasks:
        actions[task.item_id] = BuddyAction(
            item_id=task.item_id,
            label=task.title,
            kind=BuddyItemKind.task,
            surface=BuddySurface.tasks,
            status=task.status,
        )
    for document in context.documents:
        if not document.reviewed:
            document_label = f"Review {document.title}"
            document_status = "pending_review"
        elif not document.demo_acknowledged:
            document_label = f"Acknowledge {document.title}"
            document_status = "demo_acknowledgment_pending"
        elif not document.demo_summary_received:
            document_label = f"Receive demo summary for {document.title}"
            document_status = "demo_summary_receipt_pending"
        else:
            document_label = document.title
            document_status = "complete"
        actions[document.item_id] = BuddyAction(
            item_id=document.item_id,
            label=document_label,
            kind=BuddyItemKind.document,
            surface=BuddySurface.resources,
            status=document_status,
        )
    for software in context.software:
        actions[software.item_id] = BuddyAction(
            item_id=software.item_id,
            label=f"Confirm {software.title} manually",
            kind=BuddyItemKind.software,
            surface=BuddySurface.setup,
            status=software.status,
        )
    for access in context.access:
        actions[access.item_id] = BuddyAction(
            item_id=access.item_id,
            label=(
                f"Review {access.title} recommendation"
                if access.status == "recommended_for_review"
                else access.title
            ),
            kind=BuddyItemKind.access,
            surface=BuddySurface.access,
            status=access.status,
        )
    actions[context.setup.item_id] = BuddyAction(
        item_id=context.setup.item_id,
        label="Review setup preview",
        kind=BuddyItemKind.setup,
        surface=BuddySurface.setup,
        status=context.setup.status,
    )
    return actions


def _validated_actions(
    item_ids: list[str],
    action_index: dict[str, BuddyAction],
    recommendation: bool,
) -> list[BuddyAction]:
    selected: list[BuddyAction] = []
    seen: set[str] = set()
    for item_id in item_ids:
        action = action_index.get(item_id)
        if action is None or item_id in seen:
            continue
        if recommendation and not _is_recommendable(action):
            continue
        if not recommendation and not _is_blocker(action):
            continue
        selected.append(action)
        seen.add(item_id)
        if len(selected) == 3:
            break
    return selected


def _is_recommendable(action: BuddyAction) -> bool:
    if action.kind == BuddyItemKind.task:
        return action.status != "completed"
    if action.kind == BuddyItemKind.software:
        return action.status != "confirmed"
    if action.kind == BuddyItemKind.access:
        return action.status == "recommended_for_review"
    if action.kind == BuddyItemKind.setup:
        return action.status == "pending"
    return action.status != "complete"


def _is_blocker(action: BuddyAction) -> bool:
    return action.kind == BuddyItemKind.access and action.status in {
        "blocked_by_policy",
        "waiting_for_human_approval",
    }


def _build_evidence(
    context: BuddyContext, recommendations: list[BuddyAction]
) -> list[str]:
    evidence = [f"{context.progress.remaining_tasks} tasks remaining"]
    waiting = sum(
        1
        for item in context.access
        if item.status == "waiting_for_human_approval"
    )
    blocked = sum(
        1 for item in context.access if item.status == "blocked_by_policy"
    )
    if waiting:
        evidence.append(f"{waiting} access item{'s' if waiting != 1 else ''} waiting")
    elif blocked:
        evidence.append(f"{blocked} access item{'s' if blocked != 1 else ''} blocked")
    if recommendations and len(evidence) < 3:
        evidence.append(
            f"{recommendations[0].label}: {recommendations[0].status.replace('_', ' ')}"
        )
    return evidence[:3]
