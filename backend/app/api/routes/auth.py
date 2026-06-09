from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.auth import RefreshTokenRequest, Token, UserLogin, UserRegister
from app.services.auth_service import AuthService

router = APIRouter()


@router.get("/test")
def auth_test():
    return {"status": "ok", "module": "auth"}


@router.post("/register", response_model=Token, status_code=201)
def register(data: UserRegister, db: Session = Depends(get_db)):
    return AuthService(db).register(data)


@router.post("/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    return AuthService(db).login(data)


@router.post("/refresh", response_model=Token)
def refresh_token(data: RefreshTokenRequest, db: Session = Depends(get_db)):
    return AuthService(db).refresh(data.refresh_token)
