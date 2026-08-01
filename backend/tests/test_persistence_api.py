from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def employee_payload(employee_id: str, work_email: str) -> dict[str, object]:
    return {
        "employee_id": employee_id,
        "full_name": "Persisted Employee",
        "work_email": work_email,
        "role_id": "backend-junior",
        "department": "Engineering",
        "team_id": "backend",
        "seniority": "junior",
        "operating_system": "windows",
        "location": "Istanbul",
        "manager_id": "mgr-001",
        "notes": None,
    }


def test_persisted_plan_list_and_retrieval_endpoints() -> None:
    generated = client.post(
        "/onboarding/plans/generate",
        json=employee_payload("api-persist-001", "api-persist@example.com"),
    )

    listed = client.get("/onboarding/plans")
    retrieved = client.get("/onboarding/plans/api-persist-001")

    assert generated.status_code == 200
    assert listed.status_code == 200
    assert any(
        item["plan"]["employee"]["employee_id"] == "api-persist-001"
        for item in listed.json()
    )
    assert retrieved.status_code == 200
    assert retrieved.json() == generated.json()


def test_missing_persisted_plan_returns_404() -> None:
    response = client.get("/onboarding/plans/missing-api-employee")

    assert response.status_code == 404


def test_demo_state_put_and_get_endpoints() -> None:
    generated = client.post(
        "/onboarding/plans/generate",
        json=employee_payload("api-state-001", "api-state@example.com"),
    ).json()
    task_id = generated["plan"]["checklist"][0]["id"]
    state = {
        "task_completion_overrides": {task_id: True},
        "document_review_state": {},
        "document_receipt_state": {},
        "demo_acknowledgment_signer_names": {},
        "software_confirmations": {},
        "demo_it_tickets": {},
        "setup_preview_generated": False,
    }

    saved = client.put(
        "/onboarding/plans/api-state-001/demo-state", json=state
    )
    retrieved = client.get("/onboarding/plans/api-state-001/demo-state")

    assert saved.status_code == 200
    assert saved.json() == state
    assert retrieved.status_code == 200
    assert retrieved.json() == state


def test_invalid_demo_state_id_returns_422() -> None:
    client.post(
        "/onboarding/plans/generate",
        json=employee_payload("api-invalid-001", "api-invalid@example.com"),
    )

    response = client.put(
        "/onboarding/plans/api-invalid-001/demo-state",
        json={"task_completion_overrides": {"unknown-task": True}},
    )

    assert response.status_code == 422


def test_missing_demo_state_plan_returns_404() -> None:
    response = client.get(
        "/onboarding/plans/missing-api-state/demo-state"
    )

    assert response.status_code == 404
