import sys

from app.database import SessionLocal
from app.models.user import User
from app.utils.security import get_password_hash

TARGET_EMAIL = "saniamarydixon@gmail.com"
NEW_PASSWORD = "Test@1234"


def reset_password(email: str, new_password: str) -> bool:
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).one_or_none()
        if user is None:
            print(f"No user found with email: {email}")
            return False

        hashed_password = get_password_hash(new_password)
        user.hashed_password = hashed_password
        db.add(user)
        db.commit()

        print(f"Password updated for user: {email}")
        return True
    except Exception as exc:
        db.rollback()
        print(f"Failed to reset password for {email}: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    email_to_reset = TARGET_EMAIL
    password_to_set = NEW_PASSWORD

    if len(sys.argv) > 1:
        email_to_reset = sys.argv[1]
    if len(sys.argv) > 2:
        password_to_set = sys.argv[2]

    reset_password(email_to_reset, password_to_set)
