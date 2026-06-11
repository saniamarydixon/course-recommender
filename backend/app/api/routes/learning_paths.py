from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.utils.dependencies import get_current_user
from app.models.user import User
from app.models.course import Course

router = APIRouter()

# Pre-defined learning paths
LEARNING_PATHS = {
    "python_developer": {
        "title": "🐍 Python Developer Path",
        "description": "Master Python from beginner to advanced. Learn syntax, OOP, web development, and data science.",
        "duration": "3-4 months",
        "level": "Beginner to Advanced",
        "icon": "🐍",
        "color": "#3776AB",
        "categories": ["Programming"],
        "career": "Python Developer"
    },
    "web_developer": {
        "title": "🌐 Full-Stack Web Developer",
        "description": "Become a full-stack web developer with HTML, CSS, JavaScript, React, and Node.js",
        "duration": "4-6 months",
        "level": "Beginner to Intermediate",
        "icon": "🌐",
        "color": "#61DAFB",
        "categories": ["Web Dev"],
        "career": "Web Developer"
    },
    "data_scientist": {
        "title": "📊 Data Scientist Path",
        "description": "Master data analysis, visualization, statistics, and Python for data science",
        "duration": "5-6 months",
        "level": "Intermediate",
        "icon": "📊",
        "color": "#FF6B6B",
        "categories": ["Data Science", "Programming"],
        "career": "Data Scientist"
    },
    "ml_engineer": {
        "title": "🤖 Machine Learning Engineer",
        "description": "Master ML algorithms, deep learning, and AI model deployment",
        "duration": "6-8 months",
        "level": "Advanced",
        "icon": "🤖",
        "color": "#9333EA",
        "categories": ["ML", "AI", "Data Science"],
        "career": "ML Engineer"
    },
    "mobile_developer": {
        "title": "📱 Mobile App Developer",
        "description": "Build native iOS and Android apps with Swift, Kotlin, and Flutter",
        "duration": "4-5 months",
        "level": "Beginner to Intermediate",
        "icon": "📱",
        "color": "#10B981",
        "categories": ["Mobile Dev"],
        "career": "Mobile Developer"
    },
    "cloud_engineer": {
        "title": "☁️ Cloud Engineer",
        "description": "Master AWS, Azure, and Google Cloud Platform for scalable applications",
        "duration": "4-6 months",
        "level": "Intermediate",
        "icon": "☁️",
        "color": "#FF9900",
        "categories": ["Cloud"],
        "career": "Cloud Engineer"
    },
    "cybersecurity_expert": {
        "title": "🔐 Cybersecurity Expert",
        "description": "Learn ethical hacking, network security, and defense strategies",
        "duration": "5-7 months",
        "level": "Intermediate to Advanced",
        "icon": "🔐",
        "color": "#EF4444",
        "categories": ["Cybersecurity"],
        "career": "Cybersecurity Analyst"
    },
    "ui_ux_designer": {
        "title": "🎨 UI/UX Designer",
        "description": "Master design principles, Figma, Adobe tools, and user experience",
        "duration": "3-4 months",
        "level": "Beginner",
        "icon": "🎨",
        "color": "#EC4899",
        "categories": ["Design"],
        "career": "UI/UX Designer"
    }
}


@router.get("/")
def get_all_learning_paths(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all available learning paths with course details"""
    paths_with_courses = []
    
    for path_id, path_info in LEARNING_PATHS.items():
        # Find matching courses
        courses = []
        for category in path_info["categories"]:
            cat_courses = db.query(Course).filter(
                Course.category == category
            ).all()
            courses.extend(cat_courses)
        
        # Remove duplicates
        seen = set()
        unique_courses = []
        for c in courses:
            if c.id not in seen:
                seen.add(c.id)
                unique_courses.append(c)
        
        # Sort by level (Beginner → Advanced)
        level_order = {"Beginner": 0, "Intermediate": 1, "Advanced": 2}
        unique_courses.sort(key=lambda x: level_order.get(x.level, 3))
        
        paths_with_courses.append({
            "id": path_id,
            **path_info,
            "courses": [
                {
                    "id": c.id,
                    "title": c.title,
                    "instructor": c.instructor,
                    "level": c.level,
                    "duration_hours": c.duration_hours,
                    "rating": c.rating,
                    "price": c.price,
                    "thumbnail_url": c.thumbnail_url,
                    "category": c.category
                } for c in unique_courses[:6]
            ],
            "total_courses": len(unique_courses),
            "total_hours": sum(c.duration_hours for c in unique_courses[:6])
        })
    
    return {"learning_paths": paths_with_courses}


@router.get("/{path_id}")
def get_learning_path_detail(
    path_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed view of a learning path"""
    if path_id not in LEARNING_PATHS:
        raise HTTPException(status_code=404, detail="Learning path not found")
    
    path_info = LEARNING_PATHS[path_id]
    
    # Get all matching courses
    courses = []
    for category in path_info["categories"]:
        cat_courses = db.query(Course).filter(
            Course.category == category
        ).all()
        courses.extend(cat_courses)
    
    # Remove duplicates
    seen = set()
    unique_courses = []
    for c in courses:
        if c.id not in seen:
            seen.add(c.id)
            unique_courses.append(c)
    
    # Sort by level
    level_order = {"Beginner": 0, "Intermediate": 1, "Advanced": 2}
    unique_courses.sort(key=lambda x: level_order.get(x.level, 3))
    
    return {
        "id": path_id,
        **path_info,
        "courses": [
            {
                "id": c.id,
                "title": c.title,
                "description": c.description,
                "instructor": c.instructor,
                "level": c.level,
                "duration_hours": c.duration_hours,
                "rating": c.rating,
                "price": c.price,
                "thumbnail_url": c.thumbnail_url,
                "category": c.category,
                "tags": c.tags
            } for c in unique_courses
        ],
        "total_courses": len(unique_courses),
        "total_hours": sum(c.duration_hours for c in unique_courses)
    }


@router.post("/generate-custom")
def generate_custom_roadmap(
    request: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a custom roadmap based on user input"""
    skill = request.get('skill')
    target_level = request.get('target_level', 'Beginner')
    timeline_months = request.get('timeline_months', 3)
    
    if not skill:
        raise HTTPException(status_code=400, detail="Skill is required")
    
    # Skill to category mapping
    skill_mapping = {
        'Python': ['Programming'],
        'JavaScript': ['Programming', 'Web Dev'],
        'Web Development': ['Web Dev'],
        'Data Science': ['Data Science', 'Programming'],
        'Machine Learning': ['ML', 'AI', 'Data Science'],
        'AI': ['AI', 'ML'],
        'Mobile Development': ['Mobile Dev'],
        'Cloud Computing': ['Cloud'],
        'Cybersecurity': ['Cybersecurity'],
        'Design': ['Design'],
        'Business': ['Business']
    }
    
    # Get categories for skill
    categories = skill_mapping.get(skill, [skill])
    
    # Get matching courses
    courses = []
    for category in categories:
        cat_courses = db.query(Course).filter(
            Course.category.ilike(f'%{category}%')
        ).all()
        courses.extend(cat_courses)
    
    # Remove duplicates
    seen = set()
    unique_courses = []
    for c in courses:
        if c.id not in seen:
            seen.add(c.id)
            unique_courses.append(c)
    
    # Filter by target level
    level_order = {"Beginner": 0, "Intermediate": 1, "Advanced": 2}
    target_level_num = level_order.get(target_level, 0)
    
    # Include courses up to target level
    filtered = [c for c in unique_courses 
                if level_order.get(c.level, 3) <= target_level_num]
    
    # Sort by level (Beginner first)
    filtered.sort(key=lambda x: level_order.get(x.level, 3))
    
    # Calculate weeks per course based on timeline
    total_weeks = timeline_months * 4
    weeks_per_course = max(1, total_weeks // max(len(filtered), 1))
    
    # Build roadmap
    skill_icons = {
        'Python': '🐍', 'JavaScript': '⚡', 'Web Development': '🌐',
        'Data Science': '📊', 'Machine Learning': '🤖', 'AI': '🧠',
        'Mobile Development': '📱', 'Cloud Computing': '☁️',
        'Cybersecurity': '🔐', 'Design': '🎨', 'Business': '💼'
    }
    
    skill_colors = {
        'Python': '#3776AB', 'JavaScript': '#F7DF1E', 
        'Web Development': '#61DAFB', 'Data Science': '#FF6B6B',
        'Machine Learning': '#9333EA', 'AI': '#8B5CF6',
        'Mobile Development': '#10B981', 'Cloud Computing': '#FF9900',
        'Cybersecurity': '#EF4444', 'Design': '#EC4899', 'Business': '#F59E0B'
    }
    
    return {
        "id": f"custom_{current_user.id}_{datetime.utcnow().timestamp()}",
        "title": f"{skill_icons.get(skill, '🎯')} {skill} Custom Path",
        "description": f"Personalized {skill} learning path - {target_level} level in {timeline_months} months",
        "icon": skill_icons.get(skill, '🎯'),
        "color": skill_colors.get(skill, '#667eea'),
        "skill": skill,
        "target_level": target_level,
        "timeline_months": timeline_months,
        "weeks_per_course": weeks_per_course,
        "courses": [
            {
                "id": c.id,
                "title": c.title,
                "description": c.description[:200],
                "instructor": c.instructor,
                "level": c.level,
                "duration_hours": c.duration_hours,
                "rating": c.rating,
                "price": c.price,
                "thumbnail_url": c.thumbnail_url,
                "category": c.category,
                "weeks_estimated": weeks_per_course
            } for c in filtered
        ],
        "total_courses": len(filtered),
        "total_hours": sum(c.duration_hours for c in filtered),
        "is_custom": True
    }
