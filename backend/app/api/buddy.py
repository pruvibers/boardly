from fastapi import APIRouter, HTTPException

from app.buddy.models import BuddyQuestionRequest, BuddyResponse
from app.buddy.service import answer_buddy_question


router = APIRouter(prefix="/onboarding", tags=["buddy"])


@router.post(
    "/plans/{employee_id}/buddy",
    response_model=BuddyResponse,
)
def ask_boardly_buddy(
    employee_id: str, request: BuddyQuestionRequest
) -> BuddyResponse:
    try:
        return answer_buddy_question(employee_id, request)
    except LookupError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
