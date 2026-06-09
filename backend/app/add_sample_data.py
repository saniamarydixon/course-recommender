import argparse

from app.database import Base, SessionLocal, engine
from app.seed_data import seed_sample_data_for_user


def main():
    parser = argparse.ArgumentParser(description="Add sample data for a user.")
    parser.add_argument(
        "--email",
        default="saniamarydixon@gmail.com",
        help="Email of the user to seed sample data for.",
    )
    args = parser.parse_args()

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_sample_data_for_user(db, args.email)
    finally:
        db.close()


if __name__ == "__main__":
    main()
