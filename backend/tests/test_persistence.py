import json
from pathlib import Path

import pytest

from app.domain.models import VerifiedEmployeeProfile
from app.persistence.database import (
    BoardlyDatabase,
    DuplicateEmployeeIdError,
    DuplicateWorkEmailError,
)
from app.persistence.models import DemoItTicket, PersistedDemoState
from app.planner.service import PlannedOnboardingResult, generate_onboarding_plan
from app.setup_scripts.service import COMPANY_VPN_MANUAL_STEP


def make_result(
    employee_id: str,
    work_email: str,
    full_name: str = "Aylin Demir",
) -> PlannedOnboardingResult:
    return generate_onboarding_plan(
        VerifiedEmployeeProfile(
            employee_id=employee_id,
            full_name=full_name,
            work_email=work_email,
            role_id="backend-junior",
            department="Engineering",
            team_id="backend",
            seniority="junior",
            operating_system="windows",
            location="Istanbul",
            manager_id="mgr-001",
            notes=None,
        )
    )


def make_database(tmp_path: Path) -> BoardlyDatabase:
    return BoardlyDatabase(tmp_path / "boardly.sqlite3")


def test_plan_insert_and_retrieval(tmp_path: Path) -> None:
    database = make_database(tmp_path)
    result = make_result("persist-001", "persist-001@example.com")

    database.save_plan(result)

    assert database.get_plan("persist-001") == result


def test_manager_details_serialize_and_persist(tmp_path: Path) -> None:
    database = make_database(tmp_path)
    result = make_result("persist-manager", "manager-details@example.com")
    employee = result.plan.employee.model_copy(
        update={
            "manager_id": "jane.smith@example.com",
            "manager_name": "Jane Smith",
            "manager_work_email": "jane.smith@example.com",
            "manager_title": "Engineering Manager",
        }
    )
    result = result.model_copy(
        update={"plan": result.plan.model_copy(update={"employee": employee})}
    )

    database.save_plan(result)

    persisted = database.get_plan("persist-manager")
    assert persisted is not None
    assert persisted.plan.employee.manager_name == "Jane Smith"
    assert persisted.plan.employee.manager_work_email == "jane.smith@example.com"
    assert persisted.plan.employee.manager_title == "Engineering Manager"


def test_custom_department_is_preserved_in_plan_json(tmp_path: Path) -> None:
    database = make_database(tmp_path)
    result = make_result("persist-department", "department@example.com")
    employee = result.plan.employee.model_copy(
        update={"department": "Developer Experience"}
    )
    result = result.model_copy(
        update={"plan": result.plan.model_copy(update={"employee": employee})}
    )

    database.save_plan(result)

    persisted = database.get_plan("persist-department")
    assert persisted is not None
    assert persisted.plan.employee.department == "Developer Experience"


def test_job_title_round_trips_through_persistence(tmp_path: Path) -> None:
    database = make_database(tmp_path)
    result = make_result("persist-title", "job-title@example.com")
    employee = result.plan.employee.model_copy(
        update={"job_title": "Customer Platform Analyst"}
    )
    result = result.model_copy(
        update={"plan": result.plan.model_copy(update={"employee": employee})}
    )

    database.save_plan(result)

    persisted = database.get_plan("persist-title")
    assert persisted is not None
    assert persisted.plan.employee.job_title == "Customer Platform Analyst"


def test_duplicate_employee_id_is_rejected_without_replacing_plan(
    tmp_path: Path,
) -> None:
    database = make_database(tmp_path)
    database.save_plan(make_result("persist-001", "first@example.com"))
    replacement = make_result(
        "persist-001", "replacement@example.com", "Replacement Name"
    )

    with pytest.raises(DuplicateEmployeeIdError):
        database.save_plan(replacement)

    assert database.list_plans() == [
        make_result("persist-001", "first@example.com")
    ]
    assert database.get_plan_by_email("first@example.com") is not None
    assert database.get_plan_by_email("replacement@example.com") is None


def test_explicit_plan_replacement_by_employee_id(tmp_path: Path) -> None:
    database = make_database(tmp_path)
    database.save_plan(make_result("persist-001", "first@example.com"))
    replacement = make_result(
        "persist-001", "replacement@example.com", "Replacement Name"
    )

    database.save_plan(replacement, replace_existing=True)

    assert database.list_plans() == [replacement]
    assert database.get_plan_by_email("replacement@example.com") == replacement
    assert database.get_plan_by_email("first@example.com") is None


def test_plan_listing_is_newest_updated_first(tmp_path: Path) -> None:
    database = make_database(tmp_path)
    first = make_result("persist-001", "first@example.com")
    second = make_result("persist-002", "second@example.com")
    database.save_plan(first)
    database.save_plan(second)

    assert database.list_plans() == [second, first]


def test_duplicate_email_for_another_employee_is_rejected(tmp_path: Path) -> None:
    database = make_database(tmp_path)
    database.save_plan(make_result("persist-001", "shared@example.com"))

    with pytest.raises(DuplicateWorkEmailError):
        database.save_plan(make_result("persist-002", "SHARED@example.com"))


def test_same_employee_regeneration_with_same_email_is_rejected(
    tmp_path: Path,
) -> None:
    database = make_database(tmp_path)
    database.save_plan(make_result("persist-001", "same@example.com"))

    with pytest.raises(DuplicateEmployeeIdError):
        database.save_plan(
            make_result("persist-001", "SAME@example.com", "Updated Employee")
        )

    assert database.get_plan("persist-001") is not None


def test_demo_state_save_and_retrieval(tmp_path: Path) -> None:
    database = make_database(tmp_path)
    result = make_result("persist-001", "state@example.com")
    database.save_plan(result)
    task_id = result.plan.checklist[0].id
    document_id = result.plan.document_ids[0]
    software_id = result.plan.software_ids[0]
    access_id = result.plan.access_recommendations[0].resource_id
    state = PersistedDemoState(
        task_completion_overrides={task_id: True},
        document_review_state={document_id: True},
        demo_summary_received={document_id: True},
        demo_acknowledgment_signer_names={document_id: "Aylin Demir"},
        software_confirmations={software_id: True},
        demo_it_tickets={
            f"access:{access_id}": DemoItTicket(
                submitted=True,
                category="access",
                subject="Access question",
                description="Please review this demo access question.",
                note="",
            ),
            f"setup:{COMPANY_VPN_MANUAL_STEP}": DemoItTicket(
                submitted=True,
                category="setup",
                subject="Setup help",
                description="Please review this manual setup step.",
                note="",
            ),
        },
        setup_preview_generated=True,
    )

    database.save_demo_state("persist-001", state)

    assert database.get_demo_state("persist-001") == state


@pytest.mark.parametrize(
    ("field_name", "value"),
    [
        ("task_completion_overrides", {"unknown-task": True}),
        ("document_review_state", {"unknown-document": True}),
        ("demo_summary_received", {"unknown-document": True}),
        ("software_confirmations", {"unknown-software": True}),
    ],
)
def test_invalid_demo_state_ids_are_rejected(
    tmp_path: Path, field_name: str, value: dict[str, bool]
) -> None:
    database = make_database(tmp_path)
    database.save_plan(make_result("persist-001", "invalid@example.com"))
    state = PersistedDemoState.model_validate({field_name: value})

    with pytest.raises(ValueError):
        database.save_demo_state("persist-001", state)


def test_invalid_ticket_resource_is_rejected(tmp_path: Path) -> None:
    database = make_database(tmp_path)
    database.save_plan(make_result("persist-001", "ticket@example.com"))
    state = PersistedDemoState(
        demo_it_tickets={
            "access:unknown-resource": DemoItTicket(
                submitted=True,
                category="access",
                subject="Question",
                description="Unknown resource question.",
                note="",
            )
        }
    )

    with pytest.raises(ValueError):
        database.save_demo_state("persist-001", state)


def test_regeneration_resets_only_that_employees_demo_state(
    tmp_path: Path,
) -> None:
    database = make_database(tmp_path)
    first = make_result("persist-001", "first@example.com")
    second = make_result("persist-002", "second@example.com")
    database.save_plan(first)
    database.save_plan(second)
    first_state = PersistedDemoState(
        task_completion_overrides={first.plan.checklist[0].id: True}
    )
    second_state = PersistedDemoState(
        task_completion_overrides={second.plan.checklist[0].id: True}
    )
    database.save_demo_state("persist-001", first_state)
    database.save_demo_state("persist-002", second_state)

    database.save_plan(
        make_result("persist-001", "first@example.com"), replace_existing=True
    )

    assert database.get_demo_state("persist-001") == PersistedDemoState()
    assert database.get_demo_state("persist-002") == second_state


def test_missing_plan_and_demo_state_return_none(tmp_path: Path) -> None:
    database = make_database(tmp_path)

    assert database.get_plan("missing") is None
    assert database.get_demo_state("missing") is None


def test_legacy_document_receipt_state_maps_to_demo_summary_received() -> None:
    state = PersistedDemoState.model_validate(
        {"document_receipt_state": {"security-handbook": True}}
    )

    assert state.demo_summary_received == {"security-handbook": True}
    assert "document_receipt_state" not in state.model_dump()


def test_demo_summary_received_defaults_to_empty() -> None:
    assert PersistedDemoState().demo_summary_received == {}


def test_legacy_sqlite_demo_state_round_trips_without_database_reset(
    tmp_path: Path,
) -> None:
    database = make_database(tmp_path)
    result = make_result("legacy-state", "legacy-state@example.com")
    database.save_plan(result)
    document_id = result.plan.document_ids[0]
    legacy_json = json.dumps(
        {"document_receipt_state": {document_id: True}}
    )
    with database.connect() as connection:
        connection.execute(
            "INSERT INTO demo_states (employee_id, state_json) VALUES (?, ?)",
            ("legacy-state", legacy_json),
        )

    loaded = database.get_demo_state("legacy-state")

    assert loaded is not None
    assert loaded.demo_summary_received == {document_id: True}
    database.save_demo_state("legacy-state", loaded)
    with database.connect() as connection:
        stored_json = connection.execute(
            "SELECT state_json FROM demo_states WHERE employee_id = ?",
            ("legacy-state",),
        ).fetchone()["state_json"]
    assert "demo_summary_received" in stored_json
    assert "document_receipt_state" not in stored_json
