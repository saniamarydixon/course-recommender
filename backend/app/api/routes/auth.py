from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.auth import RefreshTokenRequest, Token, UserLogin, UserRegister
from app.services.auth_service import AuthService
from app.models.user import User
from app.utils.security import get_password_hash

router = APIRouter()


@router.get("/test")
def auth_test():
    return {"status": "ok", "module": "auth"}


@router.post("/register", status_code=201)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    try:
        # Check if user exists
        existing = db.query(User).filter(
            (User.email == user_data.email) | 
            (User.username == user_data.username)
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=400, 
                detail="Email or username already exists"
            )
        
        # Create user
        hashed_pwd = get_password_hash(user_data.password)
        new_user = User(
            email=user_data.email,
            username=user_data.username,
            hashed_password=hashed_pwd,
            full_name=user_data.full_name,
            is_active=True
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # Create tokens for automatic login
        auth_service = AuthService(db)
        tokens = auth_service._create_tokens(str(new_user.id))
        
        return {
            "message": "User created successfully",
            "user_id": new_user.id,
            "email": new_user.email,
            "access_token": tokens.access_token,
            "refresh_token": tokens.refresh_token,
            "token_type": "bearer"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Registration error: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Registration failed: {str(e)}"
        )


@router.post("/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    return AuthService(db).login(data)


@router.post("/refresh", response_model=Token)
def refresh_token(data: RefreshTokenRequest, db: Session = Depends(get_db)):
    return AuthService(db).refresh(data.refresh_token)
