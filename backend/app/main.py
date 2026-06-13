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
    """Initialize and seed database on startup"""
    print("🚀 Application starting...")
    
    from app.database import engine, Base, SessionLocal
    from app.models.user import User
    from app.models.course import Course
    
    # Create all tables
    print("📊 Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tables created")
    
    # Check if database needs seeding
    db = SessionLocal()
    try:
        course_count = db.query(Course).count()
        user_count = db.query(User).count()
        
        print(f"📚 Found {course_count} courses, {user_count} users")
        
        if course_count == 0:
            print("🌱 Database empty, seeding now...")
            try:
                # Import and run seed function
                from app.seed_data import seed_database
                seed_database(db)
                print("✅ Database seeded successfully!")
                print(f"✅ Now has {db.query(Course).count()} courses")
                print(f"✅ Now has {db.query(User).count()} users")
            except Exception as seed_error:
                print(f"⚠️ Seeding error: {seed_error}")
                # Try alternative seeding
                try:
                    from app.seed_data import main as seed_main
                    seed_main()
                except Exception as e2:
                    print(f"⚠️ Alternative seeding failed: {e2}")
        else:
            print("✅ Database already has data, skipping seed")
            
    except Exception as e:
        print(f"⚠️ Startup error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()
    
    print("✅ Application started successfully!")

import os

# Get frontend URL from environment
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        FRONTEND_URL,
        "https://course-recommender-five.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app|http://localhost:\d+|http://127\.0\.0\.1:\d+",
    allow_credentials=True,
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
