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
    
    # Check users table columns
    cursor.execute("PRAGMA table_info(users)")
    columns = [col[1] for col in cursor.fetchall()]
    print("Current users table columns:", columns)
    
    new_cols = {
        "avatar_url": "TEXT",
        "location": "TEXT",
        "skills": "TEXT",
        "social_links": "TEXT",
        "is_public": "BOOLEAN DEFAULT 0"
    }
    
    for col, c_type in new_cols.items():
        if col not in columns:
            print(f"Adding column {col} ({c_type}) to users...")
            cursor.execute(f"ALTER TABLE users ADD COLUMN {col} {c_type}")
            
    conn.commit()
    conn.close()
    print("Migration finished successfully!")

if __name__ == "__main__":
    migrate()
