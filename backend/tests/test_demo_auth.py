from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def employee_payload(employee_id: str, work_email: str) -> dict[str, object]:
    return {
        "employee_id": employee_id,
        "full_name": "Alex Morgan",
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


def test_admin_demo_login_accepts_configured_credentials() -> None:
    response = client.post(
        "/demo-auth/login",
        json={
            "role": "admin",
            "email": "admin@boardly.demo",
            "password": "123",
        },
    )

    assert response.status_code == 200
    assert response.json() == {
        "role": "admin",
        "employee_id": None,
        "work_email": "admin@boardly.demo",
    }


def test_email_lookup_resolves_correct_employee() -> None:
    client.post(
        "/onboarding/plans/generate",
        json=employee_payload("auth-employee-001", "Alex.Morgan@Boardly.Local"),
    )

    response = client.post(
        "/demo-auth/login",
        json={
            "role": "newcomer",
            "email": " alex.morgan@boardly.local ",
            "password": "123",
        },
    )

    assert response.status_code == 200
    assert response.json() == {
        "role": "newcomer",
        "employee_id": "auth-employee-001",
        "work_email": "alex.morgan@boardly.local",
    }


def test_unknown_email_is_rejected_without_exposing_other_accounts() -> None:
    response = client.post(
        "/demo-auth/login",
        json={
            "role": "newcomer",
            "email": "unknown@boardly.local",
            "password": "123",
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"].startswith(
        "No onboarding plan was found for this work email."
    )


def test_incorrect_password_is_rejected() -> None:
    response = client.post(
        "/demo-auth/login",
        json={
            "role": "admin",
            "email": "admin@boardly.demo",
            "password": "incorrect",
        },
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid demo credentials."


def test_duplicate_email_for_different_employee_returns_409() -> None:
    first = client.post(
        "/onboarding/plans/generate",
        json=employee_payload("auth-duplicate-001", "duplicate@boardly.local"),
    )
    duplicate = client.post(
        "/onboarding/plans/generate",
        json=employee_payload("auth-duplicate-002", "DUPLICATE@boardly.local"),
    )

    assert first.status_code == 200
    assert duplicate.status_code == 409
    assert "already assigned" in duplicate.json()["detail"]


def test_same_employee_regeneration_is_rejected() -> None:
    first = client.post(
        "/onboarding/plans/generate",
        json=employee_payload("auth-regenerate-001", "regen@boardly.local"),
    )
    replacement = client.post(
        "/onboarding/plans/generate",
        json=employee_payload("auth-regenerate-001", "REGEN@boardly.local"),
    )

    assert first.status_code == 200
    assert replacement.status_code == 409
    assert "already exists" in replacement.json()["detail"]
