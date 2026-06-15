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
    from app.models.course import Course
    from app.utils.security import get_password_hash
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    print("✅ Tables created")
    
    # Auto-seed if empty
    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            print("🌱 Seeding users...")
            
            test_users = [
                {"username": "user1", "email": "user1@example.com", "password": "Test@1234", "full_name": "Sania User"},
                {"username": "user2", "email": "user2@example.com", "password": "Test@1234", "full_name": "User Two"},
                {"username": "user3", "email": "user3@example.com", "password": "Test@1234", "full_name": "User Three"},
                {"username": "user4", "email": "user4@example.com", "password": "Test@1234", "full_name": "User Four"},
                {"username": "user5", "email": "user5@example.com", "password": "Test@1234", "full_name": "User Five"},
            ]
            
            for u in test_users:
                user = User(
                    username=u["username"],
                    email=u["email"],
                    hashed_password=get_password_hash(u["password"]),
                    full_name=u["full_name"],
                    is_active=True
                )
                db.add(user)
            
            db.commit()
            print(f"✅ Created {len(test_users)} users")
        
        if db.query(Course).count() == 0:
            print("🌱 Seeding courses...")
            try:
                from app.seed_data import seed_database
                # Try calling seed function
                seed_database(db) if callable(seed_database) else None
                print("✅ Courses seeded")
            except Exception as e:
                print(f"⚠️ Course seed error: {e}")
                # Fallback: create some sample courses
                sample_courses = [
                    {"title": "Python for Beginners", "category": "Programming", "level": "Beginner", "instructor": "John Doe", "price": 0, "duration_hours": 20, "rating": 4.5, "description": "Learn Python from scratch"},
                    {"title": "React Mastery", "category": "Web Dev", "level": "Intermediate", "instructor": "Jane Smith", "price": 49.99, "duration_hours": 30, "rating": 4.7, "description": "Master React"},
                    {"title": "Machine Learning Basics", "category": "ML", "level": "Beginner", "instructor": "Andrew Ng", "price": 79.99, "duration_hours": 40, "rating": 4.8, "description": "Introduction to ML"},
                ]
                for c in sample_courses:
                    course = Course(**c)
                    db.add(course)
                db.commit()
                print(f"✅ Created {len(sample_courses)} sample courses")
                
    except Exception as e:
        print(f"⚠️ Startup error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()
    
    print("✅ Application ready!")

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
