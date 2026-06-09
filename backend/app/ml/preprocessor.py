import re
import string

def clean_text(text: str | None) -> str:
    """
    Clean text by converting to lowercase, removing punctuation, 
    and removing extra spaces.
    """
    if not text:
        return ""
    # Convert to lowercase
    text = text.lower()
    # Remove punctuation (keep letters, numbers, and spaces)
    text = re.sub(r'[^\w\s]', '', text)
    # Remove extra whitespaces
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def combine_course_features(course) -> str:
    """
    Combine course features (title, description, tags, category, level)
    into a single preprocessed text string.
    """
    title = course.title or ""
    description = course.description or ""
    tags = course.tags or ""
    category = course.category or ""
    level = course.level or ""
    
    combined = f"{title} {description} {tags} {category} {level}"
    return clean_text(combined)
