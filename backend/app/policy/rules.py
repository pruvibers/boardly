from types import MappingProxyType
from typing import Mapping

from app.domain.models import AccessLevel, RiskLevel
from app.policy.models import ApprovalRole


ACCESS_LEVEL_RANKING: Mapping[AccessLevel, int] = MappingProxyType(
    {
        AccessLevel.viewer: 1,
        AccessLevel.reporter: 2,
        AccessLevel.member: 3,
        AccessLevel.developer: 4,
        AccessLevel.maintainer: 5,
        AccessLevel.admin: 6,
    }
)


ROLE_POLICY_MATRIX: Mapping[str, Mapping[str, AccessLevel]] = MappingProxyType(
    {
        "software-engineering-intern": MappingProxyType(
            {
                "gitlab-backend-api": AccessLevel.reporter,
                "slack-engineering": AccessLevel.member,
                "jira-backend-board": AccessLevel.viewer,
                "architecture-documentation": AccessLevel.viewer,
                "development-vpn": AccessLevel.member,
            }
        ),
        "backend-junior": MappingProxyType(
            {
                "gitlab-backend-api": AccessLevel.developer,
                "gitlab-auth-service": AccessLevel.reporter,
                "gitlab-payments-service": AccessLevel.reporter,
                "slack-engineering": AccessLevel.member,
                "jira-backend-board": AccessLevel.member,
                "architecture-documentation": AccessLevel.viewer,
                "development-vpn": AccessLevel.member,
            }
        ),
        "backend-mid": MappingProxyType(
            {
                "gitlab-backend-api": AccessLevel.developer,
                "gitlab-auth-service": AccessLevel.developer,
                "gitlab-payments-service": AccessLevel.developer,
                "slack-engineering": AccessLevel.member,
                "jira-backend-board": AccessLevel.member,
                "architecture-documentation": AccessLevel.viewer,
                "development-vpn": AccessLevel.member,
            }
        ),
        "backend-senior": MappingProxyType(
            {
                "gitlab-backend-api": AccessLevel.maintainer,
                "gitlab-auth-service": AccessLevel.maintainer,
                "gitlab-payments-service": AccessLevel.maintainer,
                "gitlab-infrastructure": AccessLevel.reporter,
                "slack-engineering": AccessLevel.member,
                "jira-backend-board": AccessLevel.member,
                "architecture-documentation": AccessLevel.viewer,
                "development-vpn": AccessLevel.member,
            }
        ),
        "platform-engineer": MappingProxyType(
            {
                "gitlab-infrastructure": AccessLevel.maintainer,
                "gitlab-backend-api": AccessLevel.reporter,
                "gitlab-auth-service": AccessLevel.reporter,
                "gitlab-payments-service": AccessLevel.reporter,
                "slack-engineering": AccessLevel.member,
                "slack-platform-engineering": AccessLevel.member,
                "jira-backend-board": AccessLevel.viewer,
                "architecture-documentation": AccessLevel.viewer,
                "development-vpn": AccessLevel.member,
            }
        ),
    }
)


RISK_APPROVAL_RULES: Mapping[RiskLevel, tuple[ApprovalRole, ...]] = MappingProxyType(
    {
        RiskLevel.low: (ApprovalRole.admin,),
        RiskLevel.medium: (ApprovalRole.admin, ApprovalRole.team_lead),
        RiskLevel.high: (ApprovalRole.team_lead, ApprovalRole.it_security),
        RiskLevel.critical: (),
    }
)
