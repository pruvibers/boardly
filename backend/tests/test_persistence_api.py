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


def test_employee_specific_plan_and_demo_state_endpoints_do_not_cross() -> None:
    abdulkerim = employee_payload("EMP-1002", "abdulkerim@example.com")
    abdulkerim["full_name"] = "Abdulkerim Akten"
    at = employee_payload("EMP-1003", "at@example.com")
    at["full_name"] = "At Aygunes"
    client.post("/onboarding/plans/generate", json=abdulkerim)
    client.post("/onboarding/plans/generate", json=at)
    abdulkerim_state = {
        "task_completion_overrides": {},
        "document_review_state": {},
        "demo_summary_received": {},
        "demo_acknowledgment_signer_names": {},
        "software_confirmations": {},
        "demo_it_tickets": {},
        "setup_preview_generated": True,
    }
    at_state = {**abdulkerim_state, "setup_preview_generated": False}

    client.put("/onboarding/plans/EMP-1002/demo-state", json=abdulkerim_state)
    client.put("/onboarding/plans/EMP-1003/demo-state", json=at_state)
    abdulkerim_plan = client.get("/onboarding/plans/EMP-1002").json()
    at_plan = client.get("/onboarding/plans/EMP-1003").json()

    assert abdulkerim_plan["plan"]["employee"]["employee_id"] == "EMP-1002"
    assert abdulkerim_plan["plan"]["employee"]["full_name"] == "Abdulkerim Akten"
    assert at_plan["plan"]["employee"]["employee_id"] == "EMP-1003"
    assert at_plan["plan"]["employee"]["full_name"] == "At Aygunes"
    assert client.get("/onboarding/plans/EMP-1002/demo-state").json() == abdulkerim_state
    assert client.get("/onboarding/plans/EMP-1003/demo-state").json() == at_state


def test_demo_state_put_and_get_endpoints() -> None:
    generated = client.post(
        "/onboarding/plans/generate",
        json=employee_payload("api-state-001", "api-state@example.com"),
    ).json()
    task_id = generated["plan"]["checklist"][0]["id"]
    state = {
        "task_completion_overrides": {task_id: True},
        "document_review_state": {},
        "demo_summary_received": {},
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


def test_demo_summary_receipt_is_persisted_idempotently() -> None:
    generated = client.post(
        "/onboarding/plans/generate",
        json=employee_payload("summary-001", "summary-001@example.com"),
    ).json()
    document_id = generated["plan"]["document_ids"][0]
    state = {"demo_summary_received": {document_id: True}}

    first = client.put(
        "/onboarding/plans/summary-001/demo-state", json=state
    )
    repeated = client.put(
        "/onboarding/plans/summary-001/demo-state", json=state
    )
    retrieved = client.get(
        "/onboarding/plans/summary-001/demo-state"
    )

    assert first.status_code == 200
    assert repeated.status_code == 200
    assert first.json()["demo_summary_received"] == {document_id: True}
    assert repeated.json() == first.json()
    assert retrieved.json() == first.json()


def test_failed_demo_summary_update_does_not_change_state() -> None:
    client.post(
        "/onboarding/plans/generate",
        json=employee_payload("summary-failed", "summary-failed@example.com"),
    )

    response = client.put(
        "/onboarding/plans/summary-failed/demo-state",
        json={"demo_summary_received": {"unknown-document": True}},
    )
    persisted = client.get(
        "/onboarding/plans/summary-failed/demo-state"
    )

    assert response.status_code == 422
    assert persisted.json()["demo_summary_received"] == {}


def test_demo_summary_receipt_is_isolated_between_employees() -> None:
    first = client.post(
        "/onboarding/plans/generate",
        json=employee_payload("summary-first", "summary-first@example.com"),
    ).json()
    client.post(
        "/onboarding/plans/generate",
        json=employee_payload("summary-second", "summary-second@example.com"),
    )
    document_id = first["plan"]["document_ids"][0]

    client.put(
        "/onboarding/plans/summary-first/demo-state",
        json={"demo_summary_received": {document_id: True}},
    )

    first_state = client.get(
        "/onboarding/plans/summary-first/demo-state"
    ).json()
    second_state = client.get(
        "/onboarding/plans/summary-second/demo-state"
    ).json()
    assert first_state["demo_summary_received"] == {document_id: True}
    assert second_state["demo_summary_received"] == {}
