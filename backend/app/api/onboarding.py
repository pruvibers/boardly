from fastapi import APIRouter, HTTPException

from app.domain.models import VerifiedEmployeeProfile
from app.planner.service import PlannedOnboardingResult, generate_onboarding_plan

router = APIRouter(prefix="/onboarding", tags=["onboarding"])


@router.post("/plans/generate", response_model=PlannedOnboardingResult)
def generate_plan(employee: VerifiedEmployeeProfile) -> PlannedOnboardingResult:
    try:
        return generate_onboarding_plan(employee)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
