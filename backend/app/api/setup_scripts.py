from fastapi import APIRouter, HTTPException

from app.domain.models import VerifiedEmployeeProfile
from app.setup_scripts.models import SetupScriptPreview
from app.setup_scripts.service import generate_setup_script_preview

router = APIRouter(prefix="/onboarding", tags=["onboarding"])


@router.post("/setup-script/preview", response_model=SetupScriptPreview)
def preview_setup_script(employee: VerifiedEmployeeProfile) -> SetupScriptPreview:
    try:
        return generate_setup_script_preview(employee)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
