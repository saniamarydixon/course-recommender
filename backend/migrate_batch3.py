import sqlite3
import os

def migrate():
    # Try different paths to locate the db file
    db_paths = [
        "course_recommender.db",
        "backend/course_recommender.db",
        "../course_recommender.db",
        "./course_recommender.db"
    ]
    
    db_path = None
    for path in db_paths:
        if os.path.exists(path):
            db_path = path
            break
            
    if not db_path:
        db_path = "course_recommender.db" # Default fallback
        
    print(f"Connecting to database at {db_path}...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check courses table columns
    cursor.execute("PRAGMA table_info(courses)")
    columns = [col[1] for col in cursor.fetchall()]
    print("Current courses table columns:", columns)
    
    if "has_certificate" not in columns:
        print("Adding column has_certificate (BOOLEAN DEFAULT 1) to courses...")
        cursor.execute("ALTER TABLE courses ADD COLUMN has_certificate BOOLEAN DEFAULT 1")
    else:
        print("has_certificate column already exists.")
        
    conn.commit()
    conn.close()
    print("Migration finished successfully!")

if __name__ == "__main__":
    migrate()
