from fastapi import APIRouter, HTTPException

from app.domain.models import VerifiedEmployeeProfile
from app.persistence.database import BoardlyDatabase, DuplicateWorkEmailError
from app.persistence.models import PersistedDemoState
from app.planner.service import PlannedOnboardingResult, generate_onboarding_plan

router = APIRouter(prefix="/onboarding", tags=["onboarding"])


@router.post("/plans/generate", response_model=PlannedOnboardingResult)
def generate_plan(employee: VerifiedEmployeeProfile) -> PlannedOnboardingResult:
    try:
        result = generate_onboarding_plan(employee)
        BoardlyDatabase().save_plan(result)
        return result
    except DuplicateWorkEmailError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


@router.get("/plans", response_model=list[PlannedOnboardingResult])
def list_plans() -> list[PlannedOnboardingResult]:
    return BoardlyDatabase().list_plans()


@router.get("/plans/{employee_id}", response_model=PlannedOnboardingResult)
def get_plan(employee_id: str) -> PlannedOnboardingResult:
    result = BoardlyDatabase().get_plan(employee_id)
    if result is None:
        raise HTTPException(status_code=404, detail="onboarding plan not found")
    return result


@router.get(
    "/plans/{employee_id}/demo-state",
    response_model=PersistedDemoState,
)
def get_demo_state(employee_id: str) -> PersistedDemoState:
    state = BoardlyDatabase().get_demo_state(employee_id)
    if state is None:
        raise HTTPException(status_code=404, detail="onboarding plan not found")
    return state


@router.put(
    "/plans/{employee_id}/demo-state",
    response_model=PersistedDemoState,
)
def save_demo_state(
    employee_id: str, state: PersistedDemoState
) -> PersistedDemoState:
    try:
        return BoardlyDatabase().save_demo_state(employee_id, state)
    except LookupError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
