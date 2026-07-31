from typing import Mapping

from pydantic import BaseModel, model_validator

from app.domain.catalogs import (
    DOCUMENT_CATALOG,
    RESOURCE_CATALOG,
    ROLE_CATALOG,
    SOFTWARE_CATALOG,
)
from app.domain.models import (
    AccessLevel,
    AccessRecommendation,
    CompanyResource,
    ChecklistItem,
    OnboardingPlan,
    RecommendationStatus,
    ResourceType,
    RoleDefinition,
    SoftwarePackage,
    VerifiedEmployeeProfile,
)
from app.planner.rules import (
    CHECKLIST_TEMPLATES,
    ROLE_DOCUMENT_TEMPLATES,
    ROLE_SOFTWARE_TEMPLATES,
)
from app.policy.engine import evaluate_access_plan
from app.policy.models import PolicyDecision
from app.policy.rules import ROLE_POLICY_MATRIX


ROLE_BY_ID: dict[str, RoleDefinition] = {role.id: role for role in ROLE_CATALOG}
RESOURCE_BY_ID: dict[str, CompanyResource] = {
    resource.id: resource for resource in RESOURCE_CATALOG
}
SOFTWARE_BY_ID: dict[str, SoftwarePackage] = {
    software.id: software for software in SOFTWARE_CATALOG
}
DOCUMENT_IDS = {document.id for document in DOCUMENT_CATALOG}


class PlannedOnboardingResult(BaseModel):
    plan: OnboardingPlan
    policy_decisions: list[PolicyDecision]

    @model_validator(mode="after")
    def policy_decisions_must_match_recommendations(self) -> "PlannedOnboardingResult":
        recommendation_resource_ids = [
            recommendation.resource_id
            for recommendation in self.plan.access_recommendations
        ]
        decision_resource_ids = [
            decision.resource_id for decision in self.policy_decisions
        ]
        if recommendation_resource_ids != decision_resource_ids:
            raise ValueError(
                "policy decisions must match access recommendations in order"
            )
        return self


def generate_onboarding_plan(
    employee: VerifiedEmployeeProfile,
) -> PlannedOnboardingResult:
    role = _validate_employee_role(employee)
    role_policy = _get_role_policy(employee.role_id)
    software_ids = _get_supported_software_ids(employee)
    document_ids = _get_document_ids(employee.role_id)
    access_recommendations = _build_access_recommendations(role, role_policy)
    policy_decisions = evaluate_access_plan(employee, access_recommendations)
    repository_ids = _get_repository_ids(role_policy)
    checklist = _build_checklist()

    plan = OnboardingPlan(
        employee=employee,
        access_recommendations=access_recommendations,
        software_ids=software_ids,
        document_ids=document_ids,
        repository_ids=repository_ids,
        checklist=checklist,
        welcome_summary=_build_welcome_summary(
            employee=employee,
            role=role,
            access_count=len(access_recommendations),
            software_count=len(software_ids),
            document_count=len(document_ids),
            checklist_count=len(checklist),
        ),
    )

    return PlannedOnboardingResult(plan=plan, policy_decisions=policy_decisions)


def _validate_employee_role(employee: VerifiedEmployeeProfile) -> RoleDefinition:
    role = ROLE_BY_ID.get(employee.role_id)
    if role is None:
        raise ValueError(f"unknown role ID: {employee.role_id}")
    if employee.seniority is not role.seniority:
        raise ValueError(
            f"seniority mismatch for role {employee.role_id}: "
            f"expected {role.seniority.value}"
        )
    if employee.department != role.department:
        raise ValueError(
            f"department mismatch for role {employee.role_id}: "
            f"expected {role.department}"
        )
    return role


def _get_role_policy(role_id: str) -> Mapping[str, AccessLevel]:
    role_policy = ROLE_POLICY_MATRIX.get(role_id)
    if role_policy is None:
        raise ValueError(f"missing role policy for role ID: {role_id}")

    for resource_id in role_policy:
        if resource_id not in RESOURCE_BY_ID:
            raise ValueError(f"role policy references unknown resource ID: {resource_id}")
        if resource_id == "production-admin-access":
            raise ValueError("deterministic plans must not include production admin access")

    return role_policy


def _get_supported_software_ids(employee: VerifiedEmployeeProfile) -> list[str]:
    template = ROLE_SOFTWARE_TEMPLATES.get(employee.role_id)
    if template is None:
        raise ValueError(f"missing software template for role ID: {employee.role_id}")

    software_ids: list[str] = []
    for software_id in template:
        software = SOFTWARE_BY_ID.get(software_id)
        if software is None:
            raise ValueError(f"software template references unknown software ID: {software_id}")
        if employee.operating_system in software.supported_operating_systems:
            software_ids.append(software_id)

    return software_ids


def _get_document_ids(role_id: str) -> list[str]:
    template = ROLE_DOCUMENT_TEMPLATES.get(role_id)
    if template is None:
        raise ValueError(f"missing document template for role ID: {role_id}")

    document_ids: list[str] = []
    for document_id in template:
        if document_id not in DOCUMENT_IDS:
            raise ValueError(f"document template references unknown document ID: {document_id}")
        document_ids.append(document_id)

    return document_ids


def _build_access_recommendations(
    role: RoleDefinition,
    role_policy: Mapping[str, AccessLevel],
) -> list[AccessRecommendation]:
    recommendations: list[AccessRecommendation] = []
    for resource_id, access_level in role_policy.items():
        resource = RESOURCE_BY_ID[resource_id]
        recommendations.append(
            AccessRecommendation(
                resource_id=resource_id,
                requested_access_level=access_level,
                reason=(
                    f"{role.name} requires {access_level.value} access to "
                    f"{resource.name} for baseline onboarding."
                ),
                risk=resource.risk,
                status=RecommendationStatus.recommended,
                approval_required=True,
            )
        )
    return recommendations


def _get_repository_ids(role_policy: Mapping[str, AccessLevel]) -> list[str]:
    return [
        resource_id
        for resource_id in role_policy
        if RESOURCE_BY_ID[resource_id].resource_type is ResourceType.repository
    ]


def _build_checklist() -> list[ChecklistItem]:
    return [
        ChecklistItem(
            id=template.id,
            title=template.title,
            description=template.description,
            phase=template.phase,
            completed=False,
        )
        for template in CHECKLIST_TEMPLATES
    ]


def _build_welcome_summary(
    employee: VerifiedEmployeeProfile,
    role: RoleDefinition,
    access_count: int,
    software_count: int,
    document_count: int,
    checklist_count: int,
) -> str:
    return (
        f"Welcome {employee.full_name} to Boardly onboarding for {role.name} "
        f"on team {employee.team_id}. This plan includes {access_count} access "
        f"recommendations, {software_count} software packages, {document_count} "
        f"documents, and {checklist_count} checklist items."
    )
