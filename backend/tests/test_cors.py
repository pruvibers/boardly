from fastapi.testclient import TestClient

from app.main import create_app


def make_employee_payload(**overrides: object) -> dict[str, object]:
    payload: dict[str, object] = {
        "employee_id": "emp-001",
        "full_name": "Aylin Demir",
        "work_email": "aylin.demir@example.com",
        "role_id": "backend-junior",
        "department": "Engineering",
        "team_id": "backend",
        "seniority": "junior",
        "operating_system": "windows",
        "location": "Istanbul",
        "manager_id": "mgr-001",
        "notes": None,
    }
    payload.update(overrides)
    return payload


def make_client() -> TestClient:
    return TestClient(create_app())


def test_local_frontend_preflight_to_onboarding_endpoint_succeeds(monkeypatch) -> None:
    monkeypatch.delenv("BOARDLY_ALLOWED_ORIGINS", raising=False)
    client = make_client()

    response = client.options(
        "/onboarding/plans/generate",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type",
        },
    )

    assert response.status_code == 200


def test_preflight_includes_expected_access_control_allow_origin(monkeypatch) -> None:
    monkeypatch.setenv("BOARDLY_ALLOWED_ORIGINS", " http://localhost:3000 ")
    client = make_client()

    response = client.options(
        "/onboarding/plans/generate",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type",
        },
    )

    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"


def test_unapproved_origin_does_not_receive_access_control_allow_origin(
    monkeypatch,
) -> None:
    monkeypatch.setenv("BOARDLY_ALLOWED_ORIGINS", "http://localhost:3000")
    client = make_client()

    response = client.options(
        "/onboarding/plans/generate",
        headers={
            "Origin": "http://malicious.localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type",
        },
    )

    assert "access-control-allow-origin" not in response.headers


def test_existing_root_behavior_remains_unchanged(monkeypatch) -> None:
    monkeypatch.delenv("BOARDLY_ALLOWED_ORIGINS", raising=False)
    response = make_client().get("/")

    assert response.status_code == 200
    assert response.json() == {
        "product": "Boardly",
        "status": "ok",
        "docs": "API documentation: /docs",
    }


def test_existing_health_behavior_remains_unchanged(monkeypatch) -> None:
    monkeypatch.delenv("BOARDLY_ALLOWED_ORIGINS", raising=False)
    response = make_client().get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "boardly-backend",
    }


def test_existing_onboarding_plan_endpoint_behavior_remains_unchanged(
    monkeypatch,
) -> None:
    monkeypatch.delenv("BOARDLY_ALLOWED_ORIGINS", raising=False)
    response = make_client().post(
        "/onboarding/plans/generate",
        json=make_employee_payload(),
    )

    assert response.status_code == 200
    assert "plan" in response.json()
    assert "policy_decisions" in response.json()


def test_existing_setup_script_endpoint_behavior_remains_unchanged(monkeypatch) -> None:
    monkeypatch.delenv("BOARDLY_ALLOWED_ORIGINS", raising=False)
    response = make_client().post(
        "/onboarding/setup-script/preview",
        json=make_employee_payload(),
    )

    assert response.status_code == 200
    assert response.json()["shell"] == "powershell"
