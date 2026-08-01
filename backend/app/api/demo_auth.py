import os
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict

from app.persistence.database import BoardlyDatabase, normalize_work_email


router = APIRouter(prefix="/demo-auth", tags=["demo-auth"])

DEMO_AUTH_CREDENTIAL = os.getenv("DEMO_AUTH_CREDENTIAL", "123")
ADMIN_EMAIL = "admin@boardly.demo"


class DemoLoginRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    role: Literal["admin", "newcomer"]
    email: str
    password: str


class DemoLoginResult(BaseModel):
    role: Literal["admin", "newcomer"]
    employee_id: str | None
    work_email: str


@router.post("/login", response_model=DemoLoginResult)
def demo_login(credentials: DemoLoginRequest) -> DemoLoginResult:
    normalized_email = normalize_work_email(credentials.email)
    if credentials.password != DEMO_AUTH_CREDENTIAL:
        raise HTTPException(status_code=401, detail="Invalid demo credentials.")

    if credentials.role == "admin":
        if normalized_email != ADMIN_EMAIL:
            raise HTTPException(status_code=401, detail="Invalid demo credentials.")
        return DemoLoginResult(
            role="admin",
            employee_id=None,
            work_email=ADMIN_EMAIL,
        )

    result = BoardlyDatabase().get_plan_by_email(normalized_email)
    if result is None:
        raise HTTPException(
            status_code=404,
            detail=(
                "No onboarding plan was found for this work email. Ask your "
                "onboarding operator to prepare your verified onboarding plan."
            ),
        )

    employee = result.plan.employee
    return DemoLoginResult(
        role="newcomer",
        employee_id=employee.employee_id,
        work_email=normalize_work_email(employee.work_email),
    )
