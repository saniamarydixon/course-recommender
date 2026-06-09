import sys

from app.database import SessionLocal
from app.models.user import User

TARGET_EMAIL = "saniamarydixon@gmail.com"


def delete_user_by_email(email: str) -> bool:
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).one_or_none()
        if user is None:
            print(f"No user found with email: {email}")
            return False

        print(f"Deleting user: {user.email} (id={user.id}, username={user.username})")
        db.delete(user)
        db.commit()
        print("User deleted successfully.")
        return True
    except Exception as exc:
        db.rollback()
        print(f"Failed to delete user with email {email}: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    email_to_delete = TARGET_EMAIL
    if len(sys.argv) > 1:
        email_to_delete = sys.argv[1]

    delete_user_by_email(email_to_delete)
