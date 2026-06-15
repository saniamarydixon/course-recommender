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
    """Initialize database and seed on startup"""
    print("=" * 60)
    print("🚀 STARTING APPLICATION")
    print("=" * 60)
    
    try:
        from app.database import engine, Base, SessionLocal
        from app.models.user import User
        from app.models.course import Course
        from app.utils.security import get_password_hash
        from datetime import datetime
        
        # Create all tables
        print("📊 Creating database tables...")
        Base.metadata.create_all(bind=engine)
        print("✅ Tables created successfully")
        
        # Open database session
        db = SessionLocal()
        
        # Check current data
        user_count = db.query(User).count()
        course_count = db.query(Course).count()
        print(f"📊 Current data: {user_count} users, {course_count} courses")
        
        # Seed users if empty
        if user_count == 0:
            print("🌱 Creating test users...")
            test_users = [
                {"username": "user1", "email": "user1@example.com", "password": "Test@1234", "full_name": "User One"},
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
            print(f"✅ Created {len(test_users)} test users")
        else:
            print(f"✅ {user_count} users already exist")
        
        # Seed courses if empty
        if course_count == 0:
            print("🌱 Creating courses...")
            
            courses_data = [
                {"title": "Python for Beginners", "description": "Learn Python programming from scratch with hands-on examples and projects. Master the fundamentals of Python including variables, data types, control flow, functions, and object-oriented programming. Build real-world applications and become proficient in one of the most popular programming languages.", "category": "Programming", "level": "Beginner", "duration_hours": 20, "price": 0, "rating": 4.5, "total_ratings": 150, "enrollment_count": 5000, "instructor": "Dr. Angela Yu", "thumbnail_url": "https://picsum.photos/400/300?random=1", "url": "https://example.com/python-beginners", "tags": "python,programming,beginner"},
                {"title": "Python Core and Advanced", "description": "Master advanced Python concepts including decorators, generators, metaclasses, and asynchronous programming. Deep dive into Python internals, performance optimization, and design patterns. Perfect for developers who want to take their Python skills to the next level.", "category": "Programming", "level": "Advanced", "duration_hours": 30, "price": 29.99, "rating": 4.1, "total_ratings": 151, "enrollment_count": 2500, "instructor": "Dr. Angela Yu", "thumbnail_url": "https://picsum.photos/400/300?random=2", "url": "https://example.com/python-advanced", "tags": "python,advanced,programming"},
                {"title": "Java Fundamentals and Object-Oriented Design", "description": "Comprehensive Java course covering object-oriented programming, data structures, and design patterns. Learn to build robust enterprise applications using Java best practices. Includes hands-on projects and real-world examples.", "category": "Programming", "level": "Beginner", "duration_hours": 25, "price": 49.99, "rating": 4.5, "total_ratings": 120, "enrollment_count": 3500, "instructor": "Tim Buchalka", "thumbnail_url": "https://picsum.photos/400/300?random=3", "url": "https://example.com/java", "tags": "java,oop,programming"},
                {"title": "C++ Systems Programming and Performance", "description": "Advanced C++ programming for systems development, performance optimization, and low-level programming. Master memory management, templates, STL, and modern C++ features. Build high-performance applications.", "category": "Programming", "level": "Advanced", "duration_hours": 35, "price": 89.99, "rating": 4.0, "total_ratings": 172, "enrollment_count": 1500, "instructor": "Bjarne Stroustrup", "thumbnail_url": "https://picsum.photos/400/300?random=4", "url": "https://example.com/cpp", "tags": "cpp,systems,advanced"},
                {"title": "Full-Stack Web Development with Node.js", "description": "Build complete web applications using Node.js, Express, MongoDB, and React. Learn server-side JavaScript, REST APIs, authentication, and deployment. Perfect for becoming a full-stack developer.", "category": "Web Dev", "level": "Intermediate", "duration_hours": 40, "price": 59.99, "rating": 4.6, "total_ratings": 200, "enrollment_count": 4500, "instructor": "Jonas Schmedtmann", "thumbnail_url": "https://picsum.photos/400/300?random=5", "url": "https://example.com/nodejs", "tags": "nodejs,fullstack,javascript"},
                {"title": "HTML5, CSS3, and Responsive Web Design", "description": "Master modern web design with HTML5, CSS3, Flexbox, and Grid. Build responsive websites that work on all devices. Learn animations, transitions, and modern CSS techniques.", "category": "Web Dev", "level": "Beginner", "duration_hours": 15, "price": 0, "rating": 4.4, "total_ratings": 180, "enrollment_count": 6000, "instructor": "Brad Traversy", "thumbnail_url": "https://picsum.photos/400/300?random=6", "url": "https://example.com/html-css", "tags": "html,css,web,design"},
                {"title": "Python for Data Science and Data Analysis", "description": "Comprehensive data science course using Python, Pandas, NumPy, and Matplotlib. Learn data manipulation, analysis, visualization, and statistical analysis. Includes real-world projects.", "category": "Data Science", "level": "Intermediate", "duration_hours": 30, "price": 49.99, "rating": 4.7, "total_ratings": 250, "enrollment_count": 5500, "instructor": "Jose Portilla", "thumbnail_url": "https://picsum.photos/400/300?random=7", "url": "https://example.com/data-science", "tags": "python,data-science,pandas"},
                {"title": "Advanced Data Visualization with Tableau", "description": "Master data visualization using Tableau. Create stunning dashboards, interactive reports, and powerful data stories. Learn best practices for visual communication.", "category": "Data Science", "level": "Advanced", "duration_hours": 20, "price": 79.99, "rating": 4.5, "total_ratings": 150, "enrollment_count": 2800, "instructor": "Kirill Eremenko", "thumbnail_url": "https://picsum.photos/400/300?random=8", "url": "https://example.com/tableau", "tags": "tableau,visualization,data"},
                {"title": "Practical Machine Learning with Scikit-Learn", "description": "Hands-on machine learning course using Python and Scikit-Learn. Learn classification, regression, clustering, and model evaluation. Build real ML applications.", "category": "ML", "level": "Intermediate", "duration_hours": 35, "price": 69.99, "rating": 4.8, "total_ratings": 300, "enrollment_count": 4000, "instructor": "Aurelien Geron", "thumbnail_url": "https://picsum.photos/400/300?random=9", "url": "https://example.com/ml", "tags": "machine-learning,python,sklearn"},
                {"title": "Deep Learning with TensorFlow and Keras", "description": "Master deep learning with TensorFlow 2.0 and Keras. Build neural networks for computer vision, NLP, and time series. Learn CNNs, RNNs, and transformers.", "category": "ML", "level": "Advanced", "duration_hours": 45, "price": 99.99, "rating": 4.9, "total_ratings": 280, "enrollment_count": 3200, "instructor": "Lazy Programmer", "thumbnail_url": "https://picsum.photos/400/300?random=10", "url": "https://example.com/deep-learning", "tags": "deep-learning,tensorflow,keras"},
                {"title": "Artificial Intelligence Fundamentals", "description": "Introduction to AI concepts including search algorithms, expert systems, fuzzy logic, and neural networks. Understand the fundamentals of intelligent systems.", "category": "AI", "level": "Beginner", "duration_hours": 25, "price": 39.99, "rating": 4.6, "total_ratings": 200, "enrollment_count": 4500, "instructor": "Andrew Ng", "thumbnail_url": "https://picsum.photos/400/300?random=11", "url": "https://example.com/ai", "tags": "ai,fundamentals,beginner"},
                {"title": "ChatGPT and Large Language Models", "description": "Learn to use and build with ChatGPT, GPT-4, and other LLMs. Master prompt engineering, fine-tuning, and building AI applications.", "category": "AI", "level": "Intermediate", "duration_hours": 15, "price": 49.99, "rating": 4.7, "total_ratings": 220, "enrollment_count": 5500, "instructor": "Hadelin de Ponteves", "thumbnail_url": "https://picsum.photos/400/300?random=12", "url": "https://example.com/chatgpt", "tags": "ai,gpt,llm,chatgpt"},
                {"title": "iOS App Development with Swift", "description": "Build native iOS apps using Swift and SwiftUI. Learn UI design, data persistence, networking, and App Store submission.", "category": "Mobile Dev", "level": "Intermediate", "duration_hours": 40, "price": 79.99, "rating": 4.6, "total_ratings": 180, "enrollment_count": 3000, "instructor": "Angela Yu", "thumbnail_url": "https://picsum.photos/400/300?random=13", "url": "https://example.com/ios", "tags": "ios,swift,mobile"},
                {"title": "Android Development with Kotlin", "description": "Master Android app development using Kotlin. Build modern Android apps with Jetpack Compose, MVVM architecture, and Material Design.", "category": "Mobile Dev", "level": "Intermediate", "duration_hours": 35, "price": 69.99, "rating": 4.5, "total_ratings": 160, "enrollment_count": 3500, "instructor": "Philipp Lackner", "thumbnail_url": "https://picsum.photos/400/300?random=14", "url": "https://example.com/android", "tags": "android,kotlin,mobile"},
                {"title": "Flutter Cross-Platform Development", "description": "Build beautiful native apps for iOS and Android with Flutter. Learn Dart, widgets, state management, and deployment.", "category": "Mobile Dev", "level": "Beginner", "duration_hours": 30, "price": 0, "rating": 4.7, "total_ratings": 240, "enrollment_count": 5000, "instructor": "Maximilian Schwarzmuller", "thumbnail_url": "https://picsum.photos/400/300?random=15", "url": "https://example.com/flutter", "tags": "flutter,dart,mobile"},
                {"title": "AWS Cloud Practitioner Certification", "description": "Prepare for AWS Cloud Practitioner certification. Learn AWS core services, pricing, security, and architecture best practices.", "category": "Cloud", "level": "Beginner", "duration_hours": 20, "price": 0, "rating": 4.6, "total_ratings": 300, "enrollment_count": 7000, "instructor": "Stephane Maarek", "thumbnail_url": "https://picsum.photos/400/300?random=16", "url": "https://example.com/aws", "tags": "aws,cloud,certification"},
                {"title": "Google Cloud Platform (GCP) Fundamentals", "description": "Get started with Google Cloud Platform. Learn compute, storage, networking, and AI services on GCP.", "category": "Cloud", "level": "Beginner", "duration_hours": 25, "price": 0, "rating": 4.5, "total_ratings": 180, "enrollment_count": 4000, "instructor": "Dan Sullivan", "thumbnail_url": "https://picsum.photos/400/300?random=17", "url": "https://example.com/gcp", "tags": "gcp,cloud,google"},
                {"title": "Azure Cloud Solutions and Services", "description": "Master Microsoft Azure cloud services. Learn deployment, security, monitoring, and DevOps on Azure.", "category": "Cloud", "level": "Intermediate", "duration_hours": 30, "price": 49.99, "rating": 4.4, "total_ratings": 150, "enrollment_count": 3500, "instructor": "Scott Duffy", "thumbnail_url": "https://picsum.photos/400/300?random=18", "url": "https://example.com/azure", "tags": "azure,cloud,microsoft"},
                {"title": "Certified Ethical Hacker (CEH) Preparation", "description": "Comprehensive ethical hacking course covering penetration testing, vulnerability assessment, and security tools. Prepare for CEH certification.", "category": "Cybersecurity", "level": "Advanced", "duration_hours": 50, "price": 99.99, "rating": 4.7, "total_ratings": 220, "enrollment_count": 3000, "instructor": "Zaid Sabih", "thumbnail_url": "https://picsum.photos/400/300?random=19", "url": "https://example.com/ceh", "tags": "ethical-hacking,security,ceh"},
                {"title": "Information Security and Cyber Defense Basics", "description": "Learn the fundamentals of cybersecurity, network security, and cyber defense. Perfect introduction to information security.", "category": "Cybersecurity", "level": "Beginner", "duration_hours": 25, "price": 0, "rating": 4.0, "total_ratings": 65, "enrollment_count": 4500, "instructor": "Nathan House", "thumbnail_url": "https://picsum.photos/400/300?random=20", "url": "https://example.com/security", "tags": "cybersecurity,defense,basics"},
                {"title": "UI/UX Design Essentials and Figma Prototyping", "description": "Master UI/UX design principles and Figma. Create stunning user interfaces and prototypes. Learn design thinking and user research.", "category": "Design", "level": "Beginner", "duration_hours": 20, "price": 39.99, "rating": 4.8, "total_ratings": 280, "enrollment_count": 5500, "instructor": "Daniel Walter Scott", "thumbnail_url": "https://picsum.photos/400/300?random=21", "url": "https://example.com/uiux", "tags": "ui,ux,design,figma"},
                {"title": "Graphic Design Masterclass with Adobe", "description": "Complete graphic design course using Adobe Photoshop, Illustrator, and InDesign. Create professional designs for print and digital.", "category": "Design", "level": "Intermediate", "duration_hours": 35, "price": 69.99, "rating": 4.6, "total_ratings": 200, "enrollment_count": 4000, "instructor": "Lindsay Marsh", "thumbnail_url": "https://picsum.photos/400/300?random=22", "url": "https://example.com/graphic-design", "tags": "graphic-design,adobe,photoshop"},
                {"title": "Digital Marketing and Social Media Analytics", "description": "Master digital marketing including SEO, social media, content marketing, and analytics. Build effective marketing campaigns.", "category": "Business", "level": "Intermediate", "duration_hours": 25, "price": 59.99, "rating": 4.5, "total_ratings": 220, "enrollment_count": 5000, "instructor": "Daragh Walsh", "thumbnail_url": "https://picsum.photos/400/300?random=23", "url": "https://example.com/marketing", "tags": "marketing,digital,seo"},
                {"title": "Product Management Masterclass", "description": "Learn product management from idea to launch. Master agile, user research, roadmapping, and stakeholder management.", "category": "Business", "level": "Intermediate", "duration_hours": 30, "price": 79.99, "rating": 4.7, "total_ratings": 180, "enrollment_count": 3500, "instructor": "Cole Mercer", "thumbnail_url": "https://picsum.photos/400/300?random=24", "url": "https://example.com/product-management", "tags": "product-management,business,agile"},
                {"title": "Financial Analysis and Investment Management", "description": "Master financial analysis, valuation, and investment strategies. Learn to analyze companies and make informed investment decisions.", "category": "Business", "level": "Advanced", "duration_hours": 40, "price": 99.99, "rating": 4.8, "total_ratings": 250, "enrollment_count": 4500, "instructor": "365 Careers", "thumbnail_url": "https://picsum.photos/400/300?random=25", "url": "https://example.com/finance", "tags": "finance,investment,analysis"},
                {"title": "Excel for Business and Data Analysis", "description": "Master Excel for business analytics. Learn formulas, pivot tables, charts, and VBA programming.", "category": "Business", "level": "Beginner", "duration_hours": 15, "price": 0, "rating": 4.7, "total_ratings": 350, "enrollment_count": 8000, "instructor": "Chris Dutton", "thumbnail_url": "https://picsum.photos/400/300?random=26", "url": "https://example.com/excel", "tags": "excel,business,analysis"},
            ]
            
            for c in courses_data:
                course = Course(**c)
                db.add(course)
            
            db.commit()
            print(f"✅ Created {len(courses_data)} courses")
        else:
            print(f"✅ {course_count} courses already exist")
        
        db.close()
        print("✅ Database initialization complete!")
        
    except Exception as e:
        print(f"❌ Startup error: {e}")
        import traceback
        traceback.print_exc()
    
    print("=" * 60)
    print("✅ APPLICATION READY!")
    print("=" * 60)

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
