from fastapi import APIRouter, HTTPException

from app.domain.models import VerifiedEmployeeProfile
from app.persistence.database import BoardlyDatabase
from app.setup_scripts.models import SetupScriptPreview
from app.setup_scripts.service import generate_setup_script_preview

router = APIRouter(prefix="/onboarding", tags=["onboarding"])


@router.post("/setup-script/preview", response_model=SetupScriptPreview)
def preview_setup_script(employee: VerifiedEmployeeProfile) -> SetupScriptPreview:
    try:
        preview = generate_setup_script_preview(employee)
        database = BoardlyDatabase()
        state = database.get_demo_state(employee.employee_id)
        if state is not None:
            database.save_demo_state(
                employee.employee_id,
                state.model_copy(update={"setup_preview_generated": True}),
            )
        return preview
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
