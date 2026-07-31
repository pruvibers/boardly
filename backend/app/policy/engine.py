from app.domain.catalogs import RESOURCE_CATALOG
from app.domain.models import (
    AccessLevel,
    AccessRecommendation,
    CompanyResource,
    RiskLevel,
    VerifiedEmployeeProfile,
)
from app.policy.models import PolicyDecision, PolicyDecisionType
from app.policy.rules import ACCESS_LEVEL_RANKING, RISK_APPROVAL_RULES, ROLE_POLICY_MATRIX


RESOURCE_BY_ID: dict[str, CompanyResource] = {
    resource.id: resource for resource in RESOURCE_CATALOG
}


def evaluate_access_recommendation(
    employee: VerifiedEmployeeProfile,
    recommendation: AccessRecommendation,
) -> PolicyDecision:
    role_policy = ROLE_POLICY_MATRIX.get(employee.role_id)
    if role_policy is None:
        return _blocked_decision(
            recommendation=recommendation,
            risk=None,
            reason="Verified employee role is not present in the policy matrix.",
        )

    resource = RESOURCE_BY_ID.get(recommendation.resource_id)
    if resource is None:
        return _blocked_decision(
            recommendation=recommendation,
            risk=None,
            reason="Requested resource is not present in the trusted resource catalog.",
        )

    trusted_risk = resource.risk
    if recommendation.requested_access_level not in resource.available_access_levels:
        return _blocked_decision(
            recommendation=recommendation,
            risk=trusted_risk,
            reason="Requested access level is not supported by the resource.",
        )

    if trusted_risk is RiskLevel.critical:
        return _blocked_decision(
            recommendation=recommendation,
            risk=trusted_risk,
            reason="Critical-risk resources are always blocked.",
        )

    maximum_access_level = role_policy.get(resource.id)
    if maximum_access_level is None:
        return _blocked_decision(
            recommendation=recommendation,
            risk=trusted_risk,
            reason="Verified employee role has no policy entry for the resource.",
        )

    if _exceeds_maximum_access(
        requested=recommendation.requested_access_level,
        maximum=maximum_access_level,
    ):
        return _blocked_decision(
            recommendation=recommendation,
            risk=trusted_risk,
            reason="Requested access level exceeds the role policy maximum.",
        )

    return PolicyDecision(
        resource_id=recommendation.resource_id,
        requested_access_level=recommendation.requested_access_level,
        decision=PolicyDecisionType.allowed,
        reason="Access recommendation satisfies deterministic policy rules.",
        risk=trusted_risk,
        required_approvers=RISK_APPROVAL_RULES[trusted_risk],
        effective_access_level=recommendation.requested_access_level,
    )


def evaluate_access_plan(
    employee: VerifiedEmployeeProfile,
    recommendations: list[AccessRecommendation],
) -> list[PolicyDecision]:
    resource_ids = [recommendation.resource_id for recommendation in recommendations]
    if len(resource_ids) != len(set(resource_ids)):
        raise ValueError("access plan recommendations must not contain duplicate resources")

    return [
        evaluate_access_recommendation(employee, recommendation)
        for recommendation in recommendations
    ]


def _blocked_decision(
    recommendation: AccessRecommendation,
    risk: RiskLevel | None,
    reason: str,
) -> PolicyDecision:
    return PolicyDecision(
        resource_id=recommendation.resource_id,
        requested_access_level=recommendation.requested_access_level,
        decision=PolicyDecisionType.blocked,
        reason=reason,
        risk=risk,
        required_approvers=(),
        effective_access_level=None,
    )


def _exceeds_maximum_access(requested: AccessLevel, maximum: AccessLevel) -> bool:
    return ACCESS_LEVEL_RANKING[requested] > ACCESS_LEVEL_RANKING[maximum]
