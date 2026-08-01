from app.buddy.models import (
    BuddyAccessContext,
    BuddyContext,
    BuddyDocumentContext,
    BuddyEmployeeContext,
    BuddyProgressContext,
    BuddySetupContext,
    BuddySoftwareContext,
    BuddySurface,
    BuddyTaskContext,
    BuddyTicketContext,
)
from app.domain.catalogs import (
    DOCUMENT_CATALOG,
    RESOURCE_CATALOG,
    ROLE_CATALOG,
    SOFTWARE_CATALOG,
)
from app.domain.models import ChecklistItem
from app.persistence.database import BoardlyDatabase


DOCUMENT_TITLES = {document.id: document.title for document in DOCUMENT_CATALOG}
RESOURCE_TITLES = {resource.id: resource.name for resource in RESOURCE_CATALOG}
ROLE_TITLES = {role.id: role.name for role in ROLE_CATALOG}
SOFTWARE_TITLES = {software.id: software.name for software in SOFTWARE_CATALOG}


def build_buddy_context(
    employee_id: str,
    current_surface: BuddySurface,
    database: BoardlyDatabase | None = None,
) -> BuddyContext:
    store = database or BoardlyDatabase()
    result = store.get_plan(employee_id)
    state = store.get_demo_state(employee_id)
    if result is None or state is None:
        raise LookupError("onboarding plan not found")

    employee = result.plan.employee
    effective_tasks: list[tuple[ChecklistItem, bool]] = [
        (
            item,
            state.task_completion_overrides.get(item.id, item.completed),
        )
        for item in result.plan.checklist
    ]
    first_incomplete_id = next(
        (item.id for item, completed in effective_tasks if not completed),
        None,
    )
    tasks = [
        BuddyTaskContext(
            item_id=f"task:{item.id}",
            id=item.id,
            title=item.title,
            phase=item.phase.value,
            status=(
                "completed"
                if completed
                else "in_progress"
                if item.id == first_incomplete_id
                else "pending"
            ),
            description=item.description,
            why_it_matters=item.description,
            blocked=False,
        )
        for item, completed in effective_tasks
    ]
    completed_count = sum(1 for _, completed in effective_tasks if completed)
    total_count = len(effective_tasks)

    documents = [
        BuddyDocumentContext(
            item_id=f"document:{document_id}",
            id=document_id,
            title=DOCUMENT_TITLES.get(document_id, _format_identifier(document_id)),
            reviewed=state.document_review_state.get(document_id, False),
            demo_summary_received=state.demo_summary_received.get(
                document_id,
                False,
            ),
            demo_acknowledged=(
                document_id in state.demo_acknowledgment_signer_names
            ),
        )
        for document_id in result.plan.document_ids
    ]
    software = [
        BuddySoftwareContext(
            item_id=f"software:{software_id}",
            id=software_id,
            title=SOFTWARE_TITLES.get(software_id, _format_identifier(software_id)),
            status=(
                "confirmed"
                if state.software_confirmations.get(software_id, False)
                else "pending"
            ),
        )
        for software_id in result.plan.software_ids
    ]
    decisions = {
        decision.resource_id: decision for decision in result.policy_decisions
    }
    access = []
    for recommendation in result.plan.access_recommendations:
        decision = decisions.get(recommendation.resource_id)
        if decision is not None and decision.decision.value == "blocked":
            status = "blocked_by_policy"
            reason = decision.reason
        elif recommendation.approval_required:
            status = "waiting_for_human_approval"
            reason = recommendation.reason
        else:
            status = "recommended_for_review"
            reason = recommendation.reason
        access.append(
            BuddyAccessContext(
                item_id=f"access:{recommendation.resource_id}",
                id=recommendation.resource_id,
                title=RESOURCE_TITLES.get(
                    recommendation.resource_id,
                    _format_identifier(recommendation.resource_id),
                ),
                status=status,
                reason=reason,
            )
        )

    return BuddyContext(
        employee=BuddyEmployeeContext(
            employee_id=employee.employee_id,
            name=employee.full_name,
            job_title=(
                employee.job_title
                or ROLE_TITLES.get(
                    employee.role_id,
                    _format_identifier(employee.role_id),
                )
            ),
            policy_role=employee.role_id,
            department=employee.department,
            team=employee.team_id,
            seniority=employee.seniority.value,
            manager_name=employee.manager_name,
        ),
        progress=BuddyProgressContext(
            completed_tasks=completed_count,
            remaining_tasks=max(total_count - completed_count, 0),
            total_tasks=total_count,
            percentage=(
                0 if total_count == 0 else round(completed_count / total_count * 100)
            ),
        ),
        tasks=tasks,
        documents=documents,
        software=software,
        access=access,
        demo_tickets=[
            BuddyTicketContext(category=ticket.category)
            for ticket in state.demo_it_tickets.values()
            if ticket.submitted
        ],
        setup=BuddySetupContext(
            status=(
                "unsupported"
                if employee.operating_system.value != "windows"
                else "prepared"
                if state.setup_preview_generated
                else "pending"
            ),
            operating_system=employee.operating_system.value,
        ),
        current_surface=current_surface,
    )


def _format_identifier(value: str) -> str:
    return " ".join(
        part.capitalize()
        for part in value.replace("_", "-").split("-")
        if part
    )
