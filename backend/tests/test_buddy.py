import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.buddy.context import build_buddy_context
from app.buddy.models import BuddyQuestionRequest, BuddySurface
from app.buddy.ollama import BuddyModelUnavailable
from app.buddy.service import answer_buddy_question
from app.domain.models import VerifiedEmployeeProfile
from app.main import create_app
from app.persistence.database import BoardlyDatabase
from app.persistence.models import PersistedDemoState
from app.planner.service import generate_onboarding_plan


def make_database(tmp_path: Path) -> BoardlyDatabase:
    return BoardlyDatabase(tmp_path / "buddy.sqlite3")


def save_employee(
    database: BoardlyDatabase,
    employee_id: str,
    full_name: str,
    work_email: str,
):
    result = generate_onboarding_plan(
        VerifiedEmployeeProfile(
            employee_id=employee_id,
            full_name=full_name,
            work_email=work_email,
            role_id="backend-junior",
            job_title="Backend Engineer",
            department="Engineering",
            team_id="backend",
            seniority="junior",
            operating_system="windows",
            location="Istanbul",
            manager_id="mgr-001",
            manager_name="Deniz Kaya",
            manager_work_email="deniz.kaya@example.com",
        )
    )
    database.save_plan(result)
    return result


class StubModelClient:
    def __init__(self, responses: list[str | Exception]) -> None:
        self.responses = responses
        self.messages: list[list[dict[str, str]]] = []

    def generate(self, messages: list[dict[str, str]]) -> str:
        self.messages.append(messages)
        response = self.responses.pop(0)
        if isinstance(response, Exception):
            raise response
        return response


def model_output(
    recommended_item_ids: list[str] | None = None,
    blocker_item_ids: list[str] | None = None,
) -> str:
    return json.dumps(
        {
            "message": "Focus on the next verified items in your plan.",
            "recommended_item_ids": recommended_item_ids or [],
            "blocker_item_ids": blocker_item_ids or [],
            "status_summary": "Your current Boardly state is reflected here.",
            "missing_information": None,
        }
    )


def test_context_uses_only_the_requested_employee(tmp_path: Path) -> None:
    database = make_database(tmp_path)
    first = save_employee(
        database,
        "EMP-1002",
        "Abdulkerim Akten",
        "abdulkerim@example.com",
    )
    second = save_employee(
        database,
        "EMP-1003",
        "Aylin Demir",
        "aylin@example.com",
    )
    second_task = second.plan.checklist[0].id
    database.save_demo_state(
        "EMP-1003",
        PersistedDemoState(task_completion_overrides={second_task: True}),
    )

    first_context = build_buddy_context(
        "EMP-1002", BuddySurface.tasks, database
    )
    second_context = build_buddy_context(
        "EMP-1003", BuddySurface.tasks, database
    )

    assert first_context.employee.employee_id == "EMP-1002"
    assert first_context.employee.name == "Abdulkerim Akten"
    assert second_context.employee.employee_id == "EMP-1003"
    assert second_context.employee.name == "Aylin Demir"
    assert first_context.progress.completed_tasks == 0
    assert second_context.progress.completed_tasks == 1
    assert "Aylin Demir" not in first_context.model_dump_json()
    assert "Abdulkerim Akten" not in second_context.model_dump_json()
    assert {task.id for task in first_context.tasks} == {
        task.id for task in first.plan.checklist
    }


def test_context_reflects_current_persisted_state_on_every_build(
    tmp_path: Path,
) -> None:
    database = make_database(tmp_path)
    result = save_employee(
        database,
        "EMP-1002",
        "Abdulkerim Akten",
        "abdulkerim@example.com",
    )
    task_id = result.plan.checklist[0].id
    document_id = result.plan.document_ids[0]

    before = build_buddy_context("EMP-1002", BuddySurface.tasks, database)
    database.save_demo_state(
        "EMP-1002",
        PersistedDemoState(
            task_completion_overrides={task_id: True},
            document_review_state={document_id: True},
            demo_summary_received={document_id: True},
        ),
    )
    after = build_buddy_context("EMP-1002", BuddySurface.resources, database)

    assert before.progress.completed_tasks == 0
    assert after.progress.completed_tasks == 1
    assert next(task for task in after.tasks if task.id == task_id).status == (
        "completed"
    )
    document = next(
        item for item in after.documents if item.id == document_id
    )
    assert document.reviewed is True
    assert document.demo_summary_received is True
    assert any(
        item.status == "waiting_for_human_approval" for item in after.access
    )
    assert after.current_surface == BuddySurface.resources


def test_model_ids_are_validated_and_recommendations_are_limited(
    tmp_path: Path,
) -> None:
    database = make_database(tmp_path)
    result = save_employee(
        database,
        "EMP-1002",
        "Abdulkerim Akten",
        "abdulkerim@example.com",
    )
    completed_task = result.plan.checklist[0]
    database.save_demo_state(
        "EMP-1002",
        PersistedDemoState(
            task_completion_overrides={completed_task.id: True}
        ),
    )
    task_ids = [f"task:{task.id}" for task in result.plan.checklist[:5]]
    client = StubModelClient(
        [model_output(["task:invented", *task_ids])]
    )

    response = answer_buddy_question(
        "EMP-1002",
        BuddyQuestionRequest(
            question="What should I do next?",
            current_surface=BuddySurface.tasks,
        ),
        database,
        client,
    )

    assert response.source == "local_model"
    assert len(response.recommended_actions) == 3
    assert "task:invented" not in {
        action.item_id for action in response.recommended_actions
    }
    assert f"task:{completed_task.id}" not in {
        action.item_id for action in response.recommended_actions
    }


def test_document_action_names_the_exact_remaining_state(tmp_path: Path) -> None:
    database = make_database(tmp_path)
    result = save_employee(
        database,
        "EMP-1002",
        "Abdulkerim Akten",
        "abdulkerim@example.com",
    )
    document_id = result.plan.document_ids[0]
    database.save_demo_state(
        "EMP-1002",
        PersistedDemoState(
            document_review_state={document_id: True},
            demo_summary_received={document_id: True},
        ),
    )
    client = StubModelClient([model_output([f"document:{document_id}"])])

    response = answer_buddy_question(
        "EMP-1002",
        BuddyQuestionRequest(
            question="What remains for this document?",
            current_surface=BuddySurface.resources,
        ),
        database,
        client,
    )

    action = response.recommended_actions[0]
    assert action.label.startswith("Acknowledge ")
    assert action.status == "demo_acknowledgment_pending"


def test_malformed_model_json_is_retried_once(tmp_path: Path) -> None:
    database = make_database(tmp_path)
    result = save_employee(
        database,
        "EMP-1002",
        "Abdulkerim Akten",
        "abdulkerim@example.com",
    )
    next_task_id = f"task:{result.plan.checklist[0].id}"
    client = StubModelClient(["not json", model_output([next_task_id])])

    response = answer_buddy_question(
        "EMP-1002",
        BuddyQuestionRequest(
            question="What should I do next?",
            current_surface=BuddySurface.tasks,
        ),
        database,
        client,
    )

    assert response.source == "local_model"
    assert response.recommended_actions[0].item_id == next_task_id
    assert len(client.messages) == 2
    assert "corrected JSON object" in client.messages[1][-1]["content"]


@pytest.mark.parametrize(
    "responses",
    [
        [BuddyModelUnavailable("offline")],
        ["not json", "still not json"],
        [TimeoutError("timed out")],
    ],
)
def test_unavailable_or_invalid_model_uses_basic_fallback(
    tmp_path: Path, responses: list[str | Exception]
) -> None:
    database = make_database(tmp_path)
    save_employee(
        database,
        "EMP-1002",
        "Abdulkerim Akten",
        "abdulkerim@example.com",
    )

    response = answer_buddy_question(
        "EMP-1002",
        BuddyQuestionRequest(
            question="What can I finish while access is pending?",
            current_surface=BuddySurface.access,
        ),
        database,
        StubModelClient(responses),
    )

    assert response.source == "basic_fallback"
    assert response.message == (
        "JedAI's local model is currently unavailable. Showing basic plan guidance."
    )
    assert len(response.recommended_actions) <= 1
    assert len(response.blockers) <= 1


@pytest.mark.parametrize("question", ["", "   ", "x" * 801])
def test_question_rejects_blank_and_oversized_values(question: str) -> None:
    with pytest.raises(ValidationError):
        BuddyQuestionRequest(
            question=question,
            current_surface=BuddySurface.overview,
        )


def test_buddy_api_validates_requests_and_returns_fallback(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    database_path = tmp_path / "api.sqlite3"
    monkeypatch.setenv("BOARDLY_DB_PATH", str(database_path))
    monkeypatch.delenv("OLLAMA_BASE_URL", raising=False)
    monkeypatch.delenv("OLLAMA_MODEL", raising=False)
    database = BoardlyDatabase(database_path)
    save_employee(
        database,
        "EMP-1002",
        "Abdulkerim Akten",
        "abdulkerim@example.com",
    )
    client = TestClient(create_app())

    response = client.post(
        "/onboarding/plans/EMP-1002/buddy",
        json={
            "question": "What should I do next?",
            "current_surface": "tasks",
        },
    )

    assert response.status_code == 200
    assert response.json()["source"] == "basic_fallback"
    assert client.post(
        "/onboarding/plans/EMP-1002/buddy",
        json={"question": " ", "current_surface": "tasks"},
    ).status_code == 422
    assert client.post(
        "/onboarding/plans/EMP-1002/buddy",
        json={"question": "x" * 801, "current_surface": "tasks"},
    ).status_code == 422
    assert client.post(
        "/onboarding/plans/missing/buddy",
        json={"question": "What next?", "current_surface": "tasks"},
    ).status_code == 404


def test_acknowledgment_marks_reviewed_without_receiving_demo_summary(
    tmp_path: Path,
) -> None:
    database = make_database(tmp_path)
    result = save_employee(
        database,
        "EMP-1002",
        "Abdulkerim Akten",
        "abdulkerim@example.com",
    )
    document_id = result.plan.document_ids[0]
    other_document_id = result.plan.document_ids[1]

    state = PersistedDemoState(
        demo_acknowledgment_signer_names={
            document_id: "Abdulkerim Akten"
        }
    )
    database.save_demo_state("EMP-1002", state)
    repeated = PersistedDemoState.model_validate(state.model_dump())
    database.save_demo_state("EMP-1002", repeated)
    persisted = database.get_demo_state("EMP-1002")

    assert persisted is not None
    assert persisted.document_review_state[document_id] is True
    assert persisted.demo_acknowledgment_signer_names[document_id] == (
        "Abdulkerim Akten"
    )
    assert persisted.demo_summary_received.get(document_id, False) is False
    assert persisted.document_review_state.get(other_document_id, False) is False


def test_document_state_is_isolated_between_employees(tmp_path: Path) -> None:
    database = make_database(tmp_path)
    first = save_employee(
        database,
        "EMP-1002",
        "Abdulkerim Akten",
        "abdulkerim@example.com",
    )
    second = save_employee(
        database,
        "EMP-1003",
        "Aylin Demir",
        "aylin@example.com",
    )
    first_document = first.plan.document_ids[0]
    database.save_demo_state(
        "EMP-1002",
        PersistedDemoState(
            demo_acknowledgment_signer_names={
                first_document: "Abdulkerim Akten"
            }
        ),
    )

    second_state = database.get_demo_state("EMP-1003")

    assert second_state is not None
    assert second_state == PersistedDemoState()
    assert first_document not in second_state.document_review_state
    assert second.plan.employee.employee_id == "EMP-1003"
