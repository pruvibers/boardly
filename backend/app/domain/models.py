from enum import Enum

from pydantic import BaseModel, Field, field_validator, model_validator


class SeniorityLevel(str, Enum):
    intern = "intern"
    junior = "junior"
    mid = "mid"
    senior = "senior"
    lead = "lead"


class OperatingSystem(str, Enum):
    windows = "windows"
    macos = "macos"
    linux = "linux"


class RiskLevel(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class ResourceType(str, Enum):
    repository = "repository"
    slack_channel = "slack_channel"
    jira_board = "jira_board"
    documentation = "documentation"
    vpn = "vpn"
    internal_tool = "internal_tool"
    privileged_access = "privileged_access"


class AccessLevel(str, Enum):
    viewer = "viewer"
    reporter = "reporter"
    member = "member"
    developer = "developer"
    maintainer = "maintainer"
    admin = "admin"


class RecommendationStatus(str, Enum):
    recommended = "recommended"
    blocked = "blocked"
    pending_approval = "pending_approval"
    approved = "approved"
    rejected = "rejected"


class ChecklistPhase(str, Enum):
    day_one = "day_one"
    week_one = "week_one"


def _reject_blank(value: str) -> str:
    if not value.strip():
        raise ValueError("must not be blank")
    return value


def _reject_duplicate_ids(values: list[str], field_name: str) -> list[str]:
    if len(values) != len(set(values)):
        raise ValueError(f"{field_name} must not contain duplicate IDs")
    return values


class VerifiedEmployeeProfile(BaseModel):
    employee_id: str
    full_name: str
    work_email: str
    role_id: str
    department: str
    team_id: str
    seniority: SeniorityLevel
    operating_system: OperatingSystem
    location: str
    manager_id: str
    notes: str | None = Field(
        default=None,
        max_length=1000,
        description=(
            "Untrusted user input that must never control authorization decisions."
        ),
    )

    @field_validator(
        "employee_id",
        "full_name",
        "work_email",
        "role_id",
        "department",
        "team_id",
        "location",
        "manager_id",
    )
    @classmethod
    def required_strings_must_not_be_blank(cls, value: str) -> str:
        return _reject_blank(value)

    @field_validator("work_email")
    @classmethod
    def work_email_must_have_basic_company_format(cls, value: str) -> str:
        value = value.strip().lower()
        local_part, separator, domain = value.partition("@")
        domain_labels = domain.split(".")
        if (
            separator != "@"
            or not local_part
            or not domain
            or any(not label for label in domain_labels)
            or len(domain_labels) < 2
            or any(character.isspace() for character in value)
        ):
            raise ValueError("work_email must be a valid company-style email")
        return value


class RoleDefinition(BaseModel):
    id: str
    name: str
    department: str
    default_team_id: str
    seniority: SeniorityLevel
    description: str


class CompanyResource(BaseModel):
    id: str
    name: str
    resource_type: ResourceType
    risk: RiskLevel
    available_access_levels: tuple[AccessLevel, ...] = Field(min_length=1)
    description: str


class SoftwarePackage(BaseModel):
    id: str
    name: str
    supported_operating_systems: tuple[OperatingSystem, ...] = Field(min_length=1)
    install_commands: dict[OperatingSystem, str]
    risk: RiskLevel = RiskLevel.low
    description: str

    @model_validator(mode="after")
    def install_commands_must_match_supported_systems(self) -> "SoftwarePackage":
        supported_systems = set(self.supported_operating_systems)
        unsupported_systems = set(self.install_commands) - supported_systems
        if unsupported_systems:
            raise ValueError(
                "install command keys must be declared as supported operating systems"
            )

        secret_markers = ("password=", "token=", "api_key=")
        for command in self.install_commands.values():
            command_lower = command.lower()
            if any(marker in command_lower for marker in secret_markers):
                raise ValueError("install commands must not include secrets")

        return self


class KnowledgeDocument(BaseModel):
    id: str
    title: str
    category: str
    description: str


class AccessRecommendation(BaseModel):
    resource_id: str
    requested_access_level: AccessLevel
    reason: str
    risk: RiskLevel
    status: RecommendationStatus = RecommendationStatus.recommended
    approval_required: bool
    expires_in_days: int | None = Field(default=None, ge=1, le=365)

    @field_validator("reason")
    @classmethod
    def reason_must_not_be_blank(cls, value: str) -> str:
        return _reject_blank(value)


class ChecklistItem(BaseModel):
    id: str
    title: str
    description: str
    phase: ChecklistPhase
    completed: bool = False


class OnboardingPlan(BaseModel):
    employee: VerifiedEmployeeProfile
    access_recommendations: list[AccessRecommendation]
    software_ids: list[str]
    document_ids: list[str]
    repository_ids: list[str]
    checklist: list[ChecklistItem]
    welcome_summary: str

    @field_validator("software_ids", "document_ids", "repository_ids")
    @classmethod
    def catalog_reference_ids_must_be_unique(
        cls, values: list[str], info
    ) -> list[str]:
        return _reject_duplicate_ids(values, info.field_name)

    @field_validator("welcome_summary")
    @classmethod
    def welcome_summary_must_not_be_blank(cls, value: str) -> str:
        return _reject_blank(value)

    @model_validator(mode="after")
    def checklist_item_ids_must_be_unique(self) -> "OnboardingPlan":
        checklist_ids = [item.id for item in self.checklist]
        if len(checklist_ids) != len(set(checklist_ids)):
            raise ValueError("checklist item IDs must be unique")
        return self
