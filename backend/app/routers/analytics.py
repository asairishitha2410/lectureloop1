from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..models import User
from ..schemas import AnalyticsOut, DueCard
from ..services import analytics

router = APIRouter(tags=["analytics"])


@router.get("/analytics", response_model=AnalyticsOut)
def get_analytics(
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
) -> AnalyticsOut:
    return AnalyticsOut(**analytics.compute_analytics(db, user))


@router.get("/revision/due", response_model=list[DueCard])
def revision_due(
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
) -> list[DueCard]:
    return [DueCard(**c) for c in analytics.due_cards(db, user)]
