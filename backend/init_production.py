"""Initialize production database with sample data"""
from app.database import engine, Base, SessionLocal
from app.seed_data import seed_database

def init():
    print("🚀 Initializing production database...")
    
    # Create all tables
    print("📊 Creating tables...")
    Base.metadata.create_all(bind=engine)
    
    # Seed data
    print("🌱 Seeding sample data...")
    db = SessionLocal()
    try:
        seed_database(db)
        print("✅ Database initialized successfully!")
    except Exception as e:
        print(f"⚠️ Seeding error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    init()
