import pytest
from pydantic import ValidationError

from app.domain.models import (
    AccessLevel,
    AccessRecommendation,
    ChecklistItem,
    ChecklistPhase,
    OnboardingPlan,
    OperatingSystem,
    RiskLevel,
    SeniorityLevel,
    SoftwarePackage,
    VerifiedEmployeeProfile,
)


def make_employee_profile(**overrides: object) -> VerifiedEmployeeProfile:
    values = {
        "employee_id": "emp-001",
        "full_name": "Aylin Demir",
        "work_email": "aylin.demir@example.com",
        "role_id": "backend-junior",
        "department": "Engineering",
        "team_id": "backend",
        "seniority": SeniorityLevel.junior,
        "operating_system": OperatingSystem.windows,
        "location": "Istanbul",
        "manager_id": "mgr-001",
        "notes": "Prefers backend API work.",
    }
    values.update(overrides)
    return VerifiedEmployeeProfile.model_validate(values)


def make_access_recommendation(**overrides: object) -> AccessRecommendation:
    values = {
        "resource_id": "gitlab-backend-api",
        "requested_access_level": AccessLevel.developer,
        "reason": "Needs repository access for assigned backend work.",
        "risk": RiskLevel.medium,
        "approval_required": True,
        "expires_in_days": 90,
    }
    values.update(overrides)
    return AccessRecommendation.model_validate(values)


def make_checklist_item(**overrides: object) -> ChecklistItem:
    values = {
        "id": "read-api-standards",
        "title": "Read API standards",
        "description": "Review the team's API design conventions.",
        "phase": ChecklistPhase.day_one,
    }
    values.update(overrides)
    return ChecklistItem.model_validate(values)


def test_valid_verified_employee_profile() -> None:
    profile = make_employee_profile()

    assert profile.employee_id == "emp-001"
    assert profile.work_email == "aylin.demir@example.com"


def test_verified_employee_profile_rejects_blank_required_field() -> None:
    with pytest.raises(ValidationError):
        make_employee_profile(full_name=" ")


def test_verified_employee_profile_rejects_invalid_work_email() -> None:
    with pytest.raises(ValidationError):
        make_employee_profile(work_email="aylin.demir")


def test_verified_employee_profile_rejects_long_notes() -> None:
    with pytest.raises(ValidationError):
        make_employee_profile(notes="x" * 1001)


def test_manager_details_are_normalized_and_derive_manager_id() -> None:
    profile = make_employee_profile(
        manager_id="",
        manager_name="  Jane Smith  ",
        manager_work_email=" JANE.SMITH@EXAMPLE.COM ",
        manager_title="  Engineering Manager  ",
    )

    assert profile.manager_name == "Jane Smith"
    assert profile.manager_work_email == "jane.smith@example.com"
    assert profile.manager_title == "Engineering Manager"
    assert profile.manager_id == "jane.smith@example.com"


@pytest.mark.parametrize(
    "overrides",
    [
        {"manager_id": "", "manager_name": "Jane Smith"},
        {"manager_id": "", "manager_work_email": "jane.smith@example.com"},
    ],
)
def test_new_manager_details_require_name_and_email(
    overrides: dict[str, object],
) -> None:
    with pytest.raises(ValidationError):
        make_employee_profile(**overrides)


def test_explicit_manager_id_remains_backward_compatible() -> None:
    profile = make_employee_profile(manager_id="legacy-manager-001")

    assert profile.manager_id == "legacy-manager-001"
    assert profile.manager_name is None
    assert profile.manager_work_email is None


def test_explicit_manager_id_is_preserved_with_manager_details() -> None:
    profile = make_employee_profile(
        manager_id="directory-manager-001",
        manager_name="Jane Smith",
        manager_work_email="jane.smith@example.com",
    )

    assert profile.manager_id == "directory-manager-001"


def test_onboarding_plan_rejects_duplicate_ids() -> None:
    employee = make_employee_profile()
    recommendation = make_access_recommendation()
    checklist_item = make_checklist_item()

    with pytest.raises(ValidationError):
        OnboardingPlan.model_validate(
            {
                "employee": employee,
                "access_recommendations": [recommendation],
                "software_ids": ["git", "git"],
                "document_ids": ["api-standards"],
                "repository_ids": ["gitlab-backend-api"],
                "checklist": [checklist_item],
                "welcome_summary": "Welcome to the backend team.",
            }
        )


def test_access_recommendation_rejects_invalid_expires_in_days() -> None:
    with pytest.raises(ValidationError):
        make_access_recommendation(expires_in_days=366)


def test_software_package_rejects_inconsistent_operating_system_commands() -> None:
    with pytest.raises(ValidationError):
        SoftwarePackage.model_validate(
            {
                "id": "example-tool",
                "name": "Example Tool",
                "supported_operating_systems": (OperatingSystem.windows,),
                "install_commands": {
                    OperatingSystem.windows: (
                        "winget install --id Example.Tool --source winget"
                    ),
                    OperatingSystem.linux: "apt install example-tool",
                },
                "description": "Example tool with inconsistent command metadata.",
            }
        )
