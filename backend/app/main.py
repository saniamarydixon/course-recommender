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
async def startup_seed_database():
    """Auto-seed database on application startup if empty"""
    print("=" * 70)
    print("🚀 APPLICATION STARTUP - INITIALIZING DATABASE")
    print("=" * 70)
    
    try:
        from app.database import engine, Base, SessionLocal
        from app.models.user import User
        from app.models.course import Course
        from app.utils.security import get_password_hash
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables verified/created")
        
        db = SessionLocal()
        
        # Count existing data
        user_count = db.query(User).count()
        course_count = db.query(Course).count()
        print(f"📊 Current data: {user_count} users, {course_count} courses")
        
        # SEED USERS if empty
        if user_count == 0:
            print("🌱 Seeding test users...")
            
            test_users = [
                ("user1", "user1@example.com", "Test@1234", "User One"),
                ("user2", "user2@example.com", "Test@1234", "User Two"),
                ("user3", "user3@example.com", "Test@1234", "User Three"),
                ("user4", "user4@example.com", "Test@1234", "User Four"),
                ("user5", "user5@example.com", "Test@1234", "User Five"),
                ("demo", "demo@example.com", "Demo@1234", "Demo User"),
                ("admin", "admin@example.com", "Admin@1234", "Admin User"),
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
            print(f"✅ Created {len(test_users)} test users")
        else:
            print(f"✅ {user_count} users already exist")
        
        # SEED COURSES if empty - use existing seed_data.py logic
        if course_count == 0:
            print("🌱 Seeding courses...")
            try:
                from app.seed_data import seed_database as seed_courses
                seed_courses(db) if callable(seed_courses) else None
                print("✅ Courses seeded from seed_data.py")
            except Exception as seed_error:
                print(f"⚠️ Standard seed failed: {seed_error}")
                print("🔄 Using fallback course data...")
                
                # Fallback: Create 26 sample courses
                fallback_courses = [
                    {"title": "Python for Beginners", "description": "Learn Python from scratch with hands-on projects and real-world examples. Master variables, functions, loops, and OOP.", "category": "Programming", "level": "Beginner", "duration_hours": 20, "price": 0, "rating": 4.5, "total_ratings": 150, "enrollment_count": 5000, "instructor": "Dr. Angela Yu", "thumbnail_url": "https://picsum.photos/400/300?random=1", "url": "https://example.com/1", "tags": "python,beginner,programming"},
                    {"title": "Python Advanced Programming", "description": "Master advanced Python concepts including decorators, generators, metaclasses, and async programming for production apps.", "category": "Programming", "level": "Advanced", "duration_hours": 30, "price": 29.99, "rating": 4.7, "total_ratings": 180, "enrollment_count": 3500, "instructor": "Mosh Hamedani", "thumbnail_url": "https://picsum.photos/400/300?random=2", "url": "https://example.com/2", "tags": "python,advanced"},
                    {"title": "Java Fundamentals", "description": "Comprehensive Java course covering OOP, data structures, design patterns and enterprise development.", "category": "Programming", "level": "Beginner", "duration_hours": 25, "price": 49.99, "rating": 4.5, "total_ratings": 200, "enrollment_count": 4000, "instructor": "Tim Buchalka", "thumbnail_url": "https://picsum.photos/400/300?random=3", "url": "https://example.com/3", "tags": "java,oop"},
                    {"title": "C++ Programming Complete", "description": "Modern C++ programming with memory management, templates, STL and high-performance computing.", "category": "Programming", "level": "Intermediate", "duration_hours": 35, "price": 59.99, "rating": 4.6, "total_ratings": 170, "enrollment_count": 2500, "instructor": "Bjarne Stroustrup", "thumbnail_url": "https://picsum.photos/400/300?random=4", "url": "https://example.com/4", "tags": "cpp,programming"},
                    {"title": "Full-Stack Node.js Development", "description": "Build complete web apps with Node.js, Express, MongoDB and React. Master REST APIs and authentication.", "category": "Web Dev", "level": "Intermediate", "duration_hours": 40, "price": 59.99, "rating": 4.7, "total_ratings": 250, "enrollment_count": 4500, "instructor": "Jonas Schmedtmann", "thumbnail_url": "https://picsum.photos/400/300?random=5", "url": "https://example.com/5", "tags": "nodejs,fullstack"},
                    {"title": "HTML5 CSS3 Responsive Design", "description": "Master modern web design with HTML5, CSS3 Flexbox, Grid and responsive techniques for all devices.", "category": "Web Dev", "level": "Beginner", "duration_hours": 15, "price": 0, "rating": 4.6, "total_ratings": 300, "enrollment_count": 6000, "instructor": "Brad Traversy", "thumbnail_url": "https://picsum.photos/400/300?random=6", "url": "https://example.com/6", "tags": "html,css,web"},
                    {"title": "React Complete Guide", "description": "Build modern React applications with hooks, Redux, and best practices for production deployment.", "category": "Web Dev", "level": "Intermediate", "duration_hours": 35, "price": 69.99, "rating": 4.8, "total_ratings": 320, "enrollment_count": 5500, "instructor": "Maximilian Schwarzmuller", "thumbnail_url": "https://picsum.photos/400/300?random=7", "url": "https://example.com/7", "tags": "react,javascript"},
                    {"title": "Python for Data Science", "description": "Data analysis with Pandas, NumPy, Matplotlib and statistical analysis with real datasets.", "category": "Data Science", "level": "Intermediate", "duration_hours": 30, "price": 49.99, "rating": 4.7, "total_ratings": 280, "enrollment_count": 5000, "instructor": "Jose Portilla", "thumbnail_url": "https://picsum.photos/400/300?random=8", "url": "https://example.com/8", "tags": "python,data-science"},
                    {"title": "Data Visualization with Tableau", "description": "Create stunning data visualizations and interactive dashboards for business intelligence.", "category": "Data Science", "level": "Advanced", "duration_hours": 20, "price": 79.99, "rating": 4.5, "total_ratings": 150, "enrollment_count": 2800, "instructor": "Kirill Eremenko", "thumbnail_url": "https://picsum.photos/400/300?random=9", "url": "https://example.com/9", "tags": "tableau,visualization"},
                    {"title": "SQL for Data Analysis", "description": "Master SQL queries, joins, window functions for data analysis and business intelligence.", "category": "Data Science", "level": "Beginner", "duration_hours": 18, "price": 0, "rating": 4.6, "total_ratings": 220, "enrollment_count": 4500, "instructor": "Mosh Hamedani", "thumbnail_url": "https://picsum.photos/400/300?random=10", "url": "https://example.com/10", "tags": "sql,database"},
                    {"title": "Machine Learning A-Z", "description": "Complete ML course with Python and R. Learn classification, regression, clustering and deep learning.", "category": "ML", "level": "Intermediate", "duration_hours": 40, "price": 79.99, "rating": 4.7, "total_ratings": 300, "enrollment_count": 4500, "instructor": "Kirill Eremenko", "thumbnail_url": "https://picsum.photos/400/300?random=11", "url": "https://example.com/11", "tags": "ml,python"},
                    {"title": "Deep Learning Specialization", "description": "Master deep learning with TensorFlow, Keras. Build CNNs, RNNs and transformers for real applications.", "category": "ML", "level": "Advanced", "duration_hours": 50, "price": 99.99, "rating": 4.9, "total_ratings": 280, "enrollment_count": 3500, "instructor": "Andrew Ng", "thumbnail_url": "https://picsum.photos/400/300?random=12", "url": "https://example.com/12", "tags": "deep-learning,tensorflow"},
                    {"title": "AI Fundamentals", "description": "Introduction to artificial intelligence, search algorithms, expert systems and neural networks basics.", "category": "AI", "level": "Beginner", "duration_hours": 25, "price": 39.99, "rating": 4.6, "total_ratings": 200, "enrollment_count": 4000, "instructor": "Andrew Ng", "thumbnail_url": "https://picsum.photos/400/300?random=13", "url": "https://example.com/13", "tags": "ai,fundamentals"},
                    {"title": "ChatGPT and LLMs Masterclass", "description": "Learn prompt engineering, GPT-4, Claude and building AI applications with large language models.", "category": "AI", "level": "Intermediate", "duration_hours": 15, "price": 49.99, "rating": 4.8, "total_ratings": 250, "enrollment_count": 6000, "instructor": "Hadelin de Ponteves", "thumbnail_url": "https://picsum.photos/400/300?random=14", "url": "https://example.com/14", "tags": "ai,chatgpt,llm"},
                    {"title": "iOS Development with Swift", "description": "Build native iOS apps with Swift, SwiftUI, Core Data and publish to App Store.", "category": "Mobile Dev", "level": "Intermediate", "duration_hours": 40, "price": 79.99, "rating": 4.6, "total_ratings": 180, "enrollment_count": 3000, "instructor": "Angela Yu", "thumbnail_url": "https://picsum.photos/400/300?random=15", "url": "https://example.com/15", "tags": "ios,swift"},
                    {"title": "Android Development with Kotlin", "description": "Master Android development with Kotlin, Jetpack Compose and Material Design 3.", "category": "Mobile Dev", "level": "Intermediate", "duration_hours": 35, "price": 69.99, "rating": 4.5, "total_ratings": 170, "enrollment_count": 3500, "instructor": "Philipp Lackner", "thumbnail_url": "https://picsum.photos/400/300?random=16", "url": "https://example.com/16", "tags": "android,kotlin"},
                    {"title": "Flutter Mobile Apps", "description": "Build cross-platform mobile apps with Flutter and Dart. Deploy to iOS and Android.", "category": "Mobile Dev", "level": "Beginner", "duration_hours": 30, "price": 0, "rating": 4.7, "total_ratings": 240, "enrollment_count": 5000, "instructor": "Maximilian Schwarzmuller", "thumbnail_url": "https://picsum.photos/400/300?random=17", "url": "https://example.com/17", "tags": "flutter,dart"},
                    {"title": "AWS Cloud Practitioner", "description": "AWS certification preparation. Master EC2, S3, Lambda, RDS and cloud architecture.", "category": "Cloud", "level": "Beginner", "duration_hours": 20, "price": 0, "rating": 4.6, "total_ratings": 300, "enrollment_count": 7000, "instructor": "Stephane Maarek", "thumbnail_url": "https://picsum.photos/400/300?random=18", "url": "https://example.com/18", "tags": "aws,cloud"},
                    {"title": "Google Cloud Platform", "description": "Master GCP services, BigQuery, Cloud Functions and architecture for scalable apps.", "category": "Cloud", "level": "Intermediate", "duration_hours": 25, "price": 49.99, "rating": 4.5, "total_ratings": 180, "enrollment_count": 4000, "instructor": "Dan Sullivan", "thumbnail_url": "https://picsum.photos/400/300?random=19", "url": "https://example.com/19", "tags": "gcp,cloud"},
                    {"title": "Azure Cloud Solutions", "description": "Microsoft Azure services, DevOps, Active Directory and enterprise cloud deployment.", "category": "Cloud", "level": "Intermediate", "duration_hours": 30, "price": 59.99, "rating": 4.4, "total_ratings": 150, "enrollment_count": 3500, "instructor": "Scott Duffy", "thumbnail_url": "https://picsum.photos/400/300?random=20", "url": "https://example.com/20", "tags": "azure,microsoft"},
                    {"title": "Ethical Hacking Complete", "description": "Penetration testing, vulnerability assessment, Kali Linux and ethical hacking techniques.", "category": "Cybersecurity", "level": "Advanced", "duration_hours": 50, "price": 99.99, "rating": 4.7, "total_ratings": 220, "enrollment_count": 3000, "instructor": "Zaid Sabih", "thumbnail_url": "https://picsum.photos/400/300?random=21", "url": "https://example.com/21", "tags": "hacking,security"},
                    {"title": "Cybersecurity Fundamentals", "description": "Network security, firewalls, encryption, and cyber defense basics for beginners.", "category": "Cybersecurity", "level": "Beginner", "duration_hours": 25, "price": 0, "rating": 4.5, "total_ratings": 200, "enrollment_count": 4500, "instructor": "Nathan House", "thumbnail_url": "https://picsum.photos/400/300?random=22", "url": "https://example.com/22", "tags": "security,network"},
                    {"title": "UI/UX Design with Figma", "description": "Master UI/UX design principles, Figma tool, design systems and prototyping.", "category": "Design", "level": "Beginner", "duration_hours": 20, "price": 39.99, "rating": 4.8, "total_ratings": 280, "enrollment_count": 5500, "instructor": "Daniel Walter Scott", "thumbnail_url": "https://picsum.photos/400/300?random=23", "url": "https://example.com/23", "tags": "design,figma"},
                    {"title": "Adobe Graphic Design", "description": "Master Photoshop, Illustrator and InDesign for professional graphic design.", "category": "Design", "level": "Intermediate", "duration_hours": 35, "price": 69.99, "rating": 4.6, "total_ratings": 200, "enrollment_count": 4000, "instructor": "Lindsay Marsh", "thumbnail_url": "https://picsum.photos/400/300?random=24", "url": "https://example.com/24", "tags": "design,adobe"},
                    {"title": "Digital Marketing Strategy", "description": "SEO, social media, content marketing, Google Ads and complete digital marketing strategy.", "category": "Business", "level": "Intermediate", "duration_hours": 25, "price": 59.99, "rating": 4.5, "total_ratings": 220, "enrollment_count": 5000, "instructor": "Daragh Walsh", "thumbnail_url": "https://picsum.photos/400/300?random=25", "url": "https://example.com/25", "tags": "marketing,seo"},
                    {"title": "Excel for Business Analysis", "description": "Advanced Excel with formulas, pivot tables, VBA and data analysis for business.", "category": "Business", "level": "Beginner", "duration_hours": 15, "price": 0, "rating": 4.7, "total_ratings": 350, "enrollment_count": 8000, "instructor": "Chris Dutton", "thumbnail_url": "https://picsum.photos/400/300?random=26", "url": "https://example.com/26", "tags": "excel,business"},
                ]
                
                for course_data in fallback_courses:
                    course = Course(**course_data)
                    db.add(course)
                db.commit()
                print(f"✅ Created {len(fallback_courses)} fallback courses")
        else:
            print(f"✅ {course_count} courses already exist")
        
        db.close()
        print("=" * 70)
        print("✅ DATABASE READY FOR PRODUCTION!")
        print("=" * 70)
        
    except Exception as e:
        print(f"❌ STARTUP ERROR: {e}")
        import traceback
        traceback.print_exc()

import os

# Get frontend URL from environment
FRONTEND_URL = os.getenv('FRONTEND_URL', '')

allowed_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "https://course-recommender-five.vercel.app",
]

if FRONTEND_URL and FRONTEND_URL not in allowed_origins:
    allowed_origins.append(FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
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
