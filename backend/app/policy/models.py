from enum import Enum

from pydantic import BaseModel, field_validator, model_validator

from app.domain.models import AccessLevel, RiskLevel


class PolicyDecisionType(str, Enum):
    allowed = "allowed"
    blocked = "blocked"


class ApprovalRole(str, Enum):
    admin = "admin"
    team_lead = "team_lead"
    it_security = "it_security"


class PolicyDecision(BaseModel):
    resource_id: str
    requested_access_level: AccessLevel
    decision: PolicyDecisionType
    reason: str
    risk: RiskLevel | None
    required_approvers: tuple[ApprovalRole, ...]
    effective_access_level: AccessLevel | None

    @field_validator("reason")
    @classmethod
    def reason_must_not_be_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("reason must not be blank")
        return value

    @model_validator(mode="after")
    def decision_shape_must_match_outcome(self) -> "PolicyDecision":
        if self.decision is PolicyDecisionType.blocked:
            if self.effective_access_level is not None:
                raise ValueError("blocked decisions must not have effective access")
            if self.required_approvers:
                raise ValueError("blocked decisions must not require approvers")

        if (
            self.decision is PolicyDecisionType.allowed
            and self.effective_access_level is None
        ):
            raise ValueError("allowed decisions must have effective access")

        return self
