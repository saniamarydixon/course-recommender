from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import api_router
from app.config import get_settings
from app.database import Base, engine

settings = get_settings()


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    debug=settings.debug,
    description="AI-Based Online Course Recommender System API",
    docs_url="/docs",
    redoc_url="/redoc",
)


@app.on_event("startup")
async def seed_database_on_startup():
    """Auto-seed database when app starts"""
    print("=" * 60)
    print("🚀 STARTUP EVENT TRIGGERED")
    print("=" * 60)
    
    try:
        from app.database import engine, Base, SessionLocal
        from app.models.user import User
        from app.models.course import Course
        
        # Create tables
        Base.metadata.create_all(bind=engine)
        print("✅ Tables created")
        
        db = SessionLocal()
        
        # Check if database needs seeding
        if db.query(Course).count() == 0 or db.query(User).count() == 0:
            print("🌱 Seeding database with 26 courses and mock data...")
            from app.seed_data import seed_database, seed_sample_data_for_user
            seed_database(db)
            seed_sample_data_for_user(db, "sania@example.com")
            print("✅ Database ready (fully seeded)!")
        else:
            print("✅ Database already populated. Skipping seeding.")
        
        db.close()
        
    except Exception as e:
        print(f"❌ Seeding error: {e}")
        import traceback
        traceback.print_exc()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://course-recommender-five.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
