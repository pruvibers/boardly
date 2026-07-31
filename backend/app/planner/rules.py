from dataclasses import dataclass
from types import MappingProxyType
from typing import Mapping

from app.domain.models import ChecklistPhase


ROLE_SOFTWARE_TEMPLATES: Mapping[str, tuple[str, ...]] = MappingProxyType(
    {
        "software-engineering-intern": (
            "git",
            "visual-studio-code",
            "python",
            "postman",
            "company-vpn-client",
        ),
        "backend-junior": (
            "git",
            "visual-studio-code",
            "docker-desktop",
            "python",
            "postman",
            "company-vpn-client",
        ),
        "backend-mid": (
            "git",
            "visual-studio-code",
            "docker-desktop",
            "python",
            "postman",
            "company-vpn-client",
        ),
        "backend-senior": (
            "git",
            "visual-studio-code",
            "docker-desktop",
            "python",
            "postman",
            "company-vpn-client",
        ),
        "platform-engineer": (
            "git",
            "visual-studio-code",
            "docker-desktop",
            "python",
            "nodejs",
            "postman",
            "company-vpn-client",
        ),
    }
)


ROLE_DOCUMENT_TEMPLATES: Mapping[str, tuple[str, ...]] = MappingProxyType(
    {
        "software-engineering-intern": (
            "architecture-overview",
            "api-standards",
            "git-workflow",
            "security-handbook",
            "team-handbook",
        ),
        "backend-junior": (
            "architecture-overview",
            "api-standards",
            "git-workflow",
            "security-handbook",
            "team-handbook",
        ),
        "backend-mid": (
            "architecture-overview",
            "api-standards",
            "git-workflow",
            "deployment-guide",
            "security-handbook",
            "team-handbook",
        ),
        "backend-senior": (
            "architecture-overview",
            "api-standards",
            "git-workflow",
            "deployment-guide",
            "security-handbook",
            "team-handbook",
        ),
        "platform-engineer": (
            "architecture-overview",
            "git-workflow",
            "deployment-guide",
            "security-handbook",
            "team-handbook",
        ),
    }
)


@dataclass(frozen=True)
class ChecklistTemplate:
    id: str
    title: str
    description: str
    phase: ChecklistPhase


CHECKLIST_TEMPLATES: tuple[ChecklistTemplate, ...] = (
    ChecklistTemplate(
        id="receive-device",
        title="Receive device",
        description="Confirm company device handoff and basic access readiness.",
        phase=ChecklistPhase.day_one,
    ),
    ChecklistTemplate(
        id="activate-company-account",
        title="Activate company account",
        description="Sign in to the company account and confirm required baseline access.",
        phase=ChecklistPhase.day_one,
    ),
    ChecklistTemplate(
        id="review-security-handbook",
        title="Review security handbook",
        description="Read the security handbook before handling company systems.",
        phase=ChecklistPhase.day_one,
    ),
    ChecklistTemplate(
        id="install-required-software",
        title="Install required software",
        description="Install approved software packages for the verified role and device.",
        phase=ChecklistPhase.day_one,
    ),
    ChecklistTemplate(
        id="request-approved-access",
        title="Request approved access",
        description="Submit access requests that were allowed by the policy engine.",
        phase=ChecklistPhase.day_one,
    ),
    ChecklistTemplate(
        id="meet-manager",
        title="Meet manager",
        description="Meet the manager to align on onboarding expectations.",
        phase=ChecklistPhase.day_one,
    ),
    ChecklistTemplate(
        id="read-architecture-overview",
        title="Read architecture overview",
        description="Review the architecture overview for the relevant product area.",
        phase=ChecklistPhase.week_one,
    ),
    ChecklistTemplate(
        id="run-project-locally",
        title="Run project locally",
        description="Set up the local development environment for the assigned project.",
        phase=ChecklistPhase.week_one,
    ),
    ChecklistTemplate(
        id="meet-team",
        title="Meet team",
        description="Meet team members and learn collaboration norms.",
        phase=ChecklistPhase.week_one,
    ),
    ChecklistTemplate(
        id="complete-security-training",
        title="Complete security training",
        description="Complete required security training for engineering access.",
        phase=ChecklistPhase.week_one,
    ),
    ChecklistTemplate(
        id="complete-first-task",
        title="Complete first task",
        description="Complete a small first task with manager or mentor review.",
        phase=ChecklistPhase.week_one,
    ),
)
