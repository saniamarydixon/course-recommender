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
        from app.utils.security import get_password_hash
        
        # Create tables
        Base.metadata.create_all(bind=engine)
        print("✅ Tables created")
        
        db = SessionLocal()
        
        # Check users
        if db.query(User).count() == 0:
            print("🌱 Seeding users...")
            users = [
                ("user1", "user1@example.com", "Test@1234"),
                ("user2", "user2@example.com", "Test@1234"),
                ("user3", "user3@example.com", "Test@1234"),
                ("user4", "user4@example.com", "Test@1234"),
                ("user5", "user5@example.com", "Test@1234"),
            ]
            for username, email, password in users:
                user = User(
                    username=username,
                    email=email,
                    hashed_password=get_password_hash(password),
                    full_name=username.capitalize(),
                    is_active=True
                )
                db.add(user)
            db.commit()
            print(f"✅ Created {len(users)} users")
        
        # Check courses
        if db.query(Course).count() == 0:
            print("🌱 Seeding courses...")
            sample_courses = [
                {"title": "Python for Beginners", "description": "Learn Python from scratch", "category": "Programming", "level": "Beginner", "duration_hours": 20, "price": 0, "rating": 4.5, "total_ratings": 150, "enrollment_count": 5000, "instructor": "Dr. Angela Yu", "thumbnail_url": "https://picsum.photos/400/300?random=1", "url": "https://example.com/1", "tags": "python,beginner"},
                {"title": "JavaScript Mastery", "description": "Master modern JavaScript", "category": "Web Dev", "level": "Intermediate", "duration_hours": 25, "price": 49.99, "rating": 4.7, "total_ratings": 200, "enrollment_count": 3500, "instructor": "Wes Bos", "thumbnail_url": "https://picsum.photos/400/300?random=2", "url": "https://example.com/2", "tags": "javascript,web"},
                {"title": "React Complete Guide", "description": "Build modern React applications", "category": "Web Dev", "level": "Intermediate", "duration_hours": 30, "price": 69.99, "rating": 4.8, "total_ratings": 250, "enrollment_count": 4000, "instructor": "Maximilian Schwarzmuller", "thumbnail_url": "https://picsum.photos/400/300?random=3", "url": "https://example.com/3", "tags": "react,javascript"},
                {"title": "Machine Learning A-Z", "description": "Complete ML course", "category": "ML", "level": "Intermediate", "duration_hours": 40, "price": 79.99, "rating": 4.7, "total_ratings": 300, "enrollment_count": 5000, "instructor": "Kirill Eremenko", "thumbnail_url": "https://picsum.photos/400/300?random=4", "url": "https://example.com/4", "tags": "ml,python"},
                {"title": "Deep Learning Fundamentals", "description": "Master deep learning", "category": "ML", "level": "Advanced", "duration_hours": 45, "price": 99.99, "rating": 4.9, "total_ratings": 280, "enrollment_count": 3500, "instructor": "Andrew Ng", "thumbnail_url": "https://picsum.photos/400/300?random=5", "url": "https://example.com/5", "tags": "deep-learning,ai"},
                {"title": "Data Science with Python", "description": "Data analysis and visualization", "category": "Data Science", "level": "Intermediate", "duration_hours": 35, "price": 59.99, "rating": 4.6, "total_ratings": 220, "enrollment_count": 4200, "instructor": "Jose Portilla", "thumbnail_url": "https://picsum.photos/400/300?random=6", "url": "https://example.com/6", "tags": "data-science,python"},
                {"title": "AWS Cloud Practitioner", "description": "AWS certification prep", "category": "Cloud", "level": "Beginner", "duration_hours": 20, "price": 0, "rating": 4.5, "total_ratings": 350, "enrollment_count": 6000, "instructor": "Stephane Maarek", "thumbnail_url": "https://picsum.photos/400/300?random=7", "url": "https://example.com/7", "tags": "aws,cloud"},
                {"title": "Ethical Hacking Complete", "description": "Cybersecurity fundamentals", "category": "Cybersecurity", "level": "Advanced", "duration_hours": 50, "price": 89.99, "rating": 4.7, "total_ratings": 200, "enrollment_count": 2500, "instructor": "Zaid Sabih", "thumbnail_url": "https://picsum.photos/400/300?random=8", "url": "https://example.com/8", "tags": "security,hacking"},
                {"title": "Flutter App Development", "description": "Build mobile apps with Flutter", "category": "Mobile Dev", "level": "Intermediate", "duration_hours": 28, "price": 49.99, "rating": 4.6, "total_ratings": 180, "enrollment_count": 3200, "instructor": "Maximilian Schwarzmuller", "thumbnail_url": "https://picsum.photos/400/300?random=9", "url": "https://example.com/9", "tags": "flutter,mobile"},
                {"title": "UI/UX Design Masterclass", "description": "Complete design course", "category": "Design", "level": "Beginner", "duration_hours": 22, "price": 39.99, "rating": 4.8, "total_ratings": 280, "enrollment_count": 5500, "instructor": "Daniel Walter Scott", "thumbnail_url": "https://picsum.photos/400/300?random=10", "url": "https://example.com/10", "tags": "design,ui-ux"},
            ]
            
            for c in sample_courses:
                course = Course(**c)
                db.add(course)
            db.commit()
            print(f"✅ Created {len(sample_courses)} courses")
        
        db.close()
        print("✅ Database ready!")
        
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
