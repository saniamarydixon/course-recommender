from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import api_router
from app.config import get_settings
from app.database import Base, engine

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    debug=settings.debug,
    description="AI-Based Online Course Recommender System API",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)


@app.on_event("startup")
async def startup_event():
    print("🚀 Starting application...")
    
    from app.database import engine, Base, SessionLocal
    from app.models.user import User
    from app.utils.security import get_password_hash
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    print("✅ Tables created")
    
    # Seed users if empty
    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            print("🌱 Creating test users...")
            test_users = [
                ("user1", "user1@example.com", "Test@1234", "User One"),
                ("user2", "user2@example.com", "Test@1234", "User Two"),
                ("user3", "user3@example.com", "Test@1234", "User Three"),
            ]
            
            for username, email, password, full_name in test_users:
                user = User(
                    username=username,
                    email=email,
                    hashed_password=get_password_hash(password),
                    full_name=full_name,
                    is_active=True
                )
                db.add(user)
            
            db.commit()
            print("✅ 3 test users created!")
        else:
            print(f"✅ Database has {db.query(User).count()} users")
        
        # Seed courses too
        from app.models.course import Course
        if db.query(Course).count() == 0:
            print("🌱 Seeding courses...")
            try:
                from app.seed_data import seed_database
                seed_database(db)
                print("✅ Courses seeded")
            except Exception as e:
                print(f"⚠️ Course seed error: {e}")
                
    except Exception as e:
        print(f"⚠️ Startup error: {e}")
    finally:
        db.close()
    
    print("✅ Application ready!")

import os

# Get frontend URL from environment
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins temporarily
    allow_credentials=False,  # Must be False when allow_origins="*"
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

from app.api.routes import learning_paths
app.include_router(
    learning_paths.router, 
    prefix="/api/v1/learning-paths", 
    tags=["Learning Paths"]
)

from fastapi.staticfiles import StaticFiles
import os
os.makedirs("static/avatars", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
def root():
    return {
        "message": "Welcome to AI Course Recommender API",
        "version": settings.app_version,
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment,
    }
