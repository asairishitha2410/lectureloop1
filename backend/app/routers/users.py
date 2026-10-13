from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..models import User
from ..schemas import UserOut, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserOut)
def get_me(user: User = Depends(get_current_user)) -> UserOut:
    return UserOut.model_validate(user)


@router.patch("/me", response_model=UserOut)
def update_me(
    payload: UserUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserOut:
    data = payload.model_dump(exclude_unset=True)
    if "name" in data and data["name"]:
        user.name = data["name"].strip()
    if data.get("preferred_language"):
        user.preferred_language = data["preferred_language"]
    if data.get("default_difficulty"):
        user.default_difficulty = data["default_difficulty"]
    if "notifications_enabled" in data and data["notifications_enabled"] is not None:
        user.notifications_enabled = data["notifications_enabled"]
    db.commit()
    db.refresh(user)
    return UserOut.model_validate(user)
