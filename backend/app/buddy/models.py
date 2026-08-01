from enum import Enum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class BuddySurface(str, Enum):
    overview = "overview"
    tasks = "tasks"
    resources = "resources"
    access = "access"
    setup = "setup"


class BuddyItemKind(str, Enum):
    task = "task"
    document = "document"
    software = "software"
    access = "access"
    setup = "setup"


class BuddyQuestionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    question: str = Field(min_length=1, max_length=800)
    current_surface: BuddySurface

    @field_validator("question")
    @classmethod
    def normalize_question(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("question must not be blank")
        return normalized


class BuddyEmployeeContext(BaseModel):
    employee_id: str
    name: str
    job_title: str
    policy_role: str
    department: str
    team: str
    seniority: str
    manager_name: str | None


class BuddyProgressContext(BaseModel):
    completed_tasks: int
    remaining_tasks: int
    total_tasks: int
    percentage: int


class BuddyTaskContext(BaseModel):
    item_id: str
    id: str
    title: str
    phase: str
    status: Literal["completed", "in_progress", "pending"]
    description: str
    why_it_matters: str
    blocked: bool = False


class BuddyDocumentContext(BaseModel):
    item_id: str
    id: str
    title: str
    reviewed: bool
    demo_summary_received: bool
    demo_acknowledged: bool


class BuddySoftwareContext(BaseModel):
    item_id: str
    id: str
    title: str
    status: Literal["confirmed", "pending"]


class BuddyAccessContext(BaseModel):
    item_id: str
    id: str
    title: str
    status: Literal[
        "blocked_by_policy",
        "waiting_for_human_approval",
        "recommended_for_review",
    ]
    reason: str


class BuddyTicketContext(BaseModel):
    category: Literal["software", "access", "setup"]


class BuddySetupContext(BaseModel):
    item_id: str = "setup:preview"
    status: Literal["prepared", "pending", "unsupported"]
    operating_system: str
    human_review_required: bool = True
    automatic_execution: bool = False


class BuddyContext(BaseModel):
    employee: BuddyEmployeeContext
    progress: BuddyProgressContext
    tasks: list[BuddyTaskContext]
    documents: list[BuddyDocumentContext]
    software: list[BuddySoftwareContext]
    access: list[BuddyAccessContext]
    demo_tickets: list[BuddyTicketContext]
    setup: BuddySetupContext
    current_surface: BuddySurface


class BuddyModelOutput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    message: str = Field(min_length=1, max_length=1200)
    recommended_item_ids: list[str] = Field(default_factory=list, max_length=12)
    blocker_item_ids: list[str] = Field(default_factory=list, max_length=12)
    status_summary: str = Field(min_length=1, max_length=320)
    missing_information: str | None = Field(default=None, max_length=320)

    @field_validator("message", "status_summary")
    @classmethod
    def required_text_must_not_be_blank(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("must not be blank")
        return normalized

    @field_validator("missing_information")
    @classmethod
    def normalize_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return value.strip() or None


class BuddyAction(BaseModel):
    item_id: str
    label: str
    kind: BuddyItemKind
    surface: BuddySurface
    status: str


class BuddyResponse(BaseModel):
    source: Literal["local_model", "basic_fallback"]
    message: str
    recommended_actions: list[BuddyAction] = Field(max_length=3)
    blockers: list[BuddyAction] = Field(max_length=3)
    status_summary: str
    missing_information: str | None = None
    evidence: list[str] = Field(max_length=3)
