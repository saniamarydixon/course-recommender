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
    print("=" * 50)
    print("🚀 Starting AI Course Recommender")
    print("=" * 50)
    
    from app.database import engine, Base, SessionLocal
    from app.models.user import User
    from app.models.course import Course
    
    # Create all tables
    print("📊 Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tables ready")
    
    # Seed database if empty
    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        course_count = db.query(Course).count()
        
        print(f"📊 Current data: {user_count} users, {course_count} courses")
        
        if user_count == 0 or course_count == 0:
            print("🌱 Database needs seeding...")
            try:
                from app.seed_data import seed_database
                seed_database(db)
                print("✅ Database seeded successfully!")
                
                # Verify
                final_users = db.query(User).count()
                final_courses = db.query(Course).count()
                print(f"✅ Final: {final_users} users, {final_courses} courses")
            except Exception as e:
                print(f"⚠️ Seeding error: {e}")
                import traceback
                traceback.print_exc()
        else:
            print("✅ Database already populated")
            
    except Exception as e:
        print(f"⚠️ Startup error: {e}")
    finally:
        db.close()
    
    print("=" * 50)
    print("✅ Application Ready!")
    print("=" * 50)

import os

# Get allowed origins
FRONTEND_URL = os.getenv('FRONTEND_URL', '')
allowed_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "https://course-recommender-five.vercel.app",
]

if FRONTEND_URL:
    allowed_origins.append(FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
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
