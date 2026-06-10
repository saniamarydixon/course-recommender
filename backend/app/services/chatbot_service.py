import google.generativeai as genai
from app.config import get_settings
from sqlalchemy.orm import Session
from app.models.course import Course
from app.models.user import User
from app.models.interaction import Interaction

class ChatbotService:
    def __init__(self, db: Session):
        self.db = db
        self.settings = get_settings()
        self.api_key_valid = False
        
        # Configure Gemini API key if it is not default placeholder
        api_key = self.settings.GEMINI_API_KEY
        if api_key and api_key != "your-actual-key-here" and api_key != "your-gemini-api-key-here":
            try:
                genai.configure(api_key=api_key)
                self.model = genai.GenerativeModel('gemini-2.0-flash')
                self.api_key_valid = True
            except Exception as e:
                try:
                    print(f"Error configuring Gemini API: {e}. Running in fallback mode.")
                except Exception:
                    pass
                self.api_key_valid = False
        else:
            self.api_key_valid = False

    def get_relevant_courses(self, query: str):
        """Filter courses based on query keywords and handle typos"""
        if not query:
            return self.db.query(Course).all()
            
        query_lower = query.lower()
        # Handle typos
        query_lower = query_lower.replace("buissness", "business").replace("buisness", "business")
        query_lower = query_lower.replace("developement", "web dev").replace("development", "web dev")
        
        category_keywords = {
            'business': ['business', 'marketing', 'finance', 'mba'],
            'web dev': ['web', 'html', 'css', 'react', 'node', 'frontend', 'backend', 'website'],
            'python': ['python', 'django', 'flask', 'programming', 'java', 'cpp'],
            'ml': ['ml', 'machine learning', 'sklearn', 'scikit-learn'],
            'ai': ['ai', 'artificial intelligence', 'gpt', 'llm', 'prompt'],
            'data science': ['data', 'analytics', 'pandas', 'numpy', 'data science'],
            'mobile dev': ['mobile', 'android', 'ios', 'flutter', 'swift', 'kotlin'],
            'cloud': ['cloud', 'aws', 'azure', 'gcp', 'computing'],
            'cybersecurity': ['security', 'hacking', 'pentesting', 'cyber', 'cybersecurity'],
            'design': ['design', 'ui', 'ux', 'figma', 'photoshop']
        }
        
        matched_category = None
        for category, keywords in category_keywords.items():
            if any(kw in query_lower for kw in keywords):
                matched_category = category
                break
        
        if matched_category:
            db_category_map = {
                'business': 'Business',
                'web dev': 'Web Dev',
                'python': 'Programming',
                'ml': 'ML',
                'ai': 'AI',
                'data science': 'Data Science',
                'mobile dev': 'Mobile Dev',
                'cloud': 'Cloud',
                'cybersecurity': 'Cybersecurity',
                'design': 'Design'
            }
            db_cat = db_category_map.get(matched_category)
            
            # Special case for Programming/Python keyword filtering to only return Python courses if requested
            if matched_category == 'python' and 'python' in query_lower:
                return self.db.query(Course).filter(
                    Course.category == 'Programming',
                    Course.title.ilike('%python%')
                ).all()
                
            return self.db.query(Course).filter(
                Course.category.ilike(f'%{db_cat}%')
            ).all()
        
        return self.db.query(Course).all()

    def validate_response_category(self, query: str, response: str) -> bool:
        """
        Check if a category was mentioned in the query, and if so,
        ensure that the response contains at least one course from that category.
        """
        query_lower = query.lower()
        query_lower = query_lower.replace("buissness", "business").replace("buisness", "business")
        query_lower = query_lower.replace("developement", "web dev").replace("development", "web dev")
        
        category_keywords = {
            'business': ['business', 'marketing', 'finance', 'mba'],
            'web dev': ['web', 'html', 'css', 'react', 'node', 'frontend', 'backend', 'website'],
            'python': ['python', 'django', 'flask', 'programming', 'java', 'cpp'],
            'ml': ['ml', 'machine learning', 'sklearn', 'scikit-learn'],
            'ai': ['ai', 'artificial intelligence', 'gpt', 'llm', 'prompt'],
            'data science': ['data', 'analytics', 'pandas', 'numpy', 'data science'],
            'mobile dev': ['mobile', 'android', 'ios', 'flutter', 'swift', 'kotlin'],
            'cloud': ['cloud', 'aws', 'azure', 'gcp', 'computing'],
            'cybersecurity': ['security', 'hacking', 'pentesting', 'cyber', 'cybersecurity'],
            'design': ['design', 'ui', 'ux', 'figma', 'photoshop']
        }
        
        matched_category = None
        for category, keywords in category_keywords.items():
            if any(kw in query_lower for kw in keywords):
                matched_category = category
                break
                
        if not matched_category:
            return True  # No category restriction
            
        db_category_map = {
            'business': 'Business',
            'web dev': 'Web Dev',
            'python': 'Programming',
            'ml': 'ML',
            'ai': 'AI',
            'data science': 'Data Science',
            'mobile dev': 'Mobile Dev',
            'cloud': 'Cloud',
            'cybersecurity': 'Cybersecurity',
            'design': 'Design'
        }
        db_cat = db_category_map.get(matched_category)
        
        # Filter for category courses
        category_courses = self.db.query(Course).filter(Course.category.ilike(f'%{db_cat}%')).all()
        
        # Verify the response mentions at least one course title from the expected category
        for c in category_courses:
            if c.title.lower() in response.lower():
                return True
                
        return False

    def get_system_prompt(self, user: User, query: str = None):
        filtered_courses = self.get_relevant_courses(query)
        
        # Format courses with FULL details
        course_catalog = "\n".join([
            f"""
            📚 {c.title}
            - ID: {c.id}
            - Category: {c.category}
            - Level: {c.level}
            - Price: ${c.price if c.price > 0 else 'FREE'}
            - Instructor: {c.instructor}
            - Duration: {c.duration_hours} hours
            - Rating: {c.rating}/5
            - Tags: {c.tags}
            - Description: {c.description[:200]}
            """
            for c in filtered_courses
        ])
        
        # Get user's enrolled courses
        enrolled = self.db.query(Interaction).filter(
            Interaction.user_id == user.id,
            Interaction.interaction_type == 'enrollment'
        ).all()
        enrolled_titles = [e.course.title for e in enrolled if e.course]
        
        # Find matched category for specific custom prompt guidance
        matched_category = None
        if query:
            query_lower = query.lower().replace("buissness", "business").replace("buisness", "business")
            query_lower = query_lower.replace("developement", "web dev").replace("development", "web dev")
            category_keywords = {
                'business': ['business', 'marketing', 'finance', 'mba'],
                'web dev': ['web', 'html', 'css', 'react', 'node', 'frontend', 'backend', 'website'],
                'python': ['python', 'django', 'flask', 'programming', 'java', 'cpp'],
                'ml': ['ml', 'machine learning', 'sklearn', 'scikit-learn'],
                'ai': ['ai', 'artificial intelligence', 'gpt', 'llm', 'prompt'],
                'data science': ['data', 'analytics', 'pandas', 'numpy', 'data science'],
                'mobile dev': ['mobile', 'android', 'ios', 'flutter', 'swift', 'kotlin'],
                'cloud': ['cloud', 'aws', 'azure', 'gcp', 'computing'],
                'cybersecurity': ['security', 'hacking', 'pentesting', 'cyber', 'cybersecurity'],
                'design': ['design', 'ui', 'ux', 'figma', 'photoshop']
            }
            for category, keywords in category_keywords.items():
                if any(kw in query_lower for kw in keywords):
                    matched_category = category
                    break
                    
        category_text = ""
        if matched_category:
            category_text = f"User is asking about {matched_category.upper()}. Here are {matched_category.upper()} courses ONLY:\n"
            
        return f'''You are CourseRec AI, an expert course advisor 
        for an online learning platform with 25 courses.

        ## USER PROFILE
        - Name: {user.username}
        - Email: {user.email}
        - Currently Enrolled: {", ".join(enrolled_titles) if enrolled_titles else "None"}

        ## COMPLETE COURSE CATALOG ({len(filtered_courses)} courses)
        {category_text}
        {course_catalog}

        ## YOUR JOB
        1. ANALYZE the user's query
        2. FIND matching courses from the catalog above
        3. RECOMMEND 3-5 specific courses with full details
        4. EXPLAIN why each course fits their needs
        5. SUGGEST learning order if multiple courses

        ## RESPONSE RULES
        ✅ DO: Recommend specific courses by name
        ✅ DO: Include price, level, instructor
        ✅ DO: Use emojis and formatting
        ✅ DO: Be enthusiastic and helpful
        ✅ DO: Suggest next steps
        
        ❌ DON'T: Give generic responses
        ❌ DON'T: Say "I can help you explore"
        ❌ DON'T: List all categories
        ❌ DON'T: Be vague
        
        ## CATEGORY MAPPING
        If user mentions:
        - "business" → recommend Business category courses
        - "web dev" / "website" → Web Dev courses
        - "python" → Python courses (Programming + Data Science + ML)
        - "data science" → Data Science courses
        - "machine learning" / "ML" → ML courses
        - "AI" → AI courses
        - "mobile" → Mobile Dev courses
        - "cloud" → Cloud courses
        - "security" → Cybersecurity courses
        - "design" → Design courses
        
        ## RESPONSE FORMAT (use markdown)
        
        ### Brief intro (1 sentence)
        
        **Course 1: [Name]**
        - 📊 Level: ...
        - 💰 Price: ...
        - 👨🏫 Instructor: ...
        - ✨ Why: [reason]
        
        **Course 2: [Name]**
        [same format]
        
        ### Recommended Learning Order
        1. Start with...
        2. Then move to...
        3. Finally...
        
        ### Question for user
        [Ask follow-up to refine]
        '''

    def get_fallback_response(self, user: User, message: str) -> str:
        """
        Fallback response helper if Gemini is offline, rate-limited,
        or if the API key is not yet configured.
        """
        query_text = message.lower()
        query_text = query_text.replace("buissness", "business").replace("buisness", "business")
        query_text = query_text.replace("developement", "web dev").replace("development", "web dev")
        
        # Helper to format recommendations in the standard RESPONSE FORMAT
        def format_course_recommendations(intro_text: str, matched_courses: list, learning_order: list, follow_up: str) -> str:
            courses_formatted = []
            for i, c in enumerate(matched_courses, 1):
                price_str = "FREE" if c.price == 0 else f"${c.price}"
                
                # Dynamic customized "Why" reason based on course details
                why_reason = f"Perfect for learning {c.category.lower()} concepts and hands-on projects."
                if "marketing" in c.title.lower():
                    why_reason = "Perfect for mastering digital campaigns, SEO, and social media analytics."
                elif "product management" in c.title.lower():
                    why_reason = "Best for aspiring product managers and learning product life cycle."
                elif "financial" in c.title.lower():
                    why_reason = "Great for finance fundamentals and Excel modeling."
                elif "beginners" in c.title.lower():
                    why_reason = "Designed for absolute beginners to build strong foundational skills."
                elif "advanced" in c.title.lower() or "systems" in c.title.lower():
                    why_reason = "Excellent for advanced learners seeking deep systems optimization."
                elif "react" in c.title.lower():
                    why_reason = "Ideal for mastering component state and modern frontend hooks."
                elif "node.js" in c.title.lower() or "full stack" in c.title.lower():
                    why_reason = "Great for backend APIs, database modeling, and full-stack architecture."
                elif "html" in c.title.lower():
                    why_reason = "Perfect for learning responsive web styling and layouts."
                elif "data science" in c.title.lower():
                    why_reason = "Learn key data structures, data analysis, Pandas, and NumPy."
                elif "visualization" in c.title.lower():
                    why_reason = "Ideal for learning Tableau, PowerBI, and dashboard storytelling."
                elif "scikit-learn" in c.title.lower():
                    why_reason = "Best for implementing regression, classification, and ML models."
                elif "deep learning" in c.title.lower():
                    why_reason = "Master neural networks using PyTorch and TensorFlow."
                elif "ethical hacker" in c.title.lower():
                    why_reason = "Prepare for CEH exam and explore the hacker mindset."
                elif "security" in c.title.lower() or "defense" in c.title.lower():
                    why_reason = "Learn basic network defense, cryptography, and risk management."
                elif "ui/ux" in c.title.lower() or "figma" in c.title.lower():
                    why_reason = "Excellent for wireframing and interactive prototyping in Figma."
                elif "graphic design" in c.title.lower():
                    why_reason = "Master Illustrator, Photoshop, and branding foundations."
                elif "llm" in c.title.lower() or "prompt" in c.title.lower():
                    why_reason = "Learn prompt engineering and building LLM-powered apps."
                elif "aws" in c.title.lower():
                    why_reason = "Best for AWS cloud practitioner and solutions architect prep."
                elif "gcp" in c.title.lower():
                    why_reason = "Excellent free introduction to GCP cloud services."
                elif "azure" in c.title.lower():
                    why_reason = "Master virtual machines and enterprise Microsoft cloud solutions."
                elif "ios" in c.title.lower():
                    why_reason = "Learn Swift and SwiftUI to launch native iOS apps."
                elif "flutter" in c.title.lower():
                    why_reason = "Build cross-platform mobile apps for iOS and Android."
                elif "kotlin" in c.title.lower() or "android" in c.title.lower():
                    why_reason = "Master native Android app design with Kotlin."
                
                courses_formatted.append(
                    f"**Course {i}: {c.title}**\n"
                    f"- 📊 Level: {c.level}\n"
                    f"- 💰 Price: {price_str}\n"
                    f"- 👨🏫 Instructor: {c.instructor}\n"
                    f"- ✨ Why: {why_reason}"
                )
            
            courses_str = "\n\n".join(courses_formatted)
            
            order_formatted = []
            for j, step in enumerate(learning_order, 1):
                order_formatted.append(f"{j}. {step}")
            order_str = "\n".join(order_formatted)
            
            return f"{intro_text}\n\n{courses_str}\n\n### Recommended Learning Order\n{order_str}\n\n### Question for user\n{follow_up}"

        all_courses = self.db.query(Course).all()
        
        # 1. Business courses
        if any(k in query_text for k in ["business", "marketing", "finance", "mba"]):
            matched = [c for c in all_courses if c.category.lower() == "business"]
            matched = sorted(matched, key=lambda x: x.id)
            intro = "💼 Great! Here are our Business courses:"
            order = []
            if len(matched) > 0:
                order.append(f"Start with **{matched[0].title}** to learn digital campaigns and SEO fundamentals.")
            if len(matched) > 2:
                order.append(f"Next, take **{matched[2].title}** to master corporate finance and Excel modeling.")
            if len(matched) > 1:
                order.append(f"Finally, complete the sequence with **{matched[1].title}** to learn product strategy and execution.")
            follow_up = "Which area interests you most? I can recommend a learning path! 🚀"
            return format_course_recommendations(intro, matched, order, follow_up)
            
        # 2. Python courses (Cheapest Python or general Python)
        elif any(k in query_text for k in ["python", "django", "flask", "programming", "java", "cpp", "tutorials"]):
            python_courses = [c for c in all_courses if "python" in c.title.lower() or "python" in (c.tags or "").lower()]
            if not python_courses:
                python_courses = [c for c in all_courses if c.category.lower() == "programming"]
                
            if "cheapest" in query_text or "free" in query_text:
                matched = sorted(python_courses, key=lambda x: x.price)
                matched = matched[:3]
                intro = "🐍 Here are our Python courses sorted by price, starting with the cheapest:"
                order = []
                if len(matched) > 0:
                    order.append(f"Start with **{matched[0].title}** (priced at ${matched[0].price if matched[0].price > 0 else 'FREE'}) to learn basic variables and loops.")
                if len(matched) > 1:
                    order.append(f"Then move to **{matched[1].title}** to master object-oriented programming and advanced syntax.")
                if len(matched) > 2:
                    order.append(f"Finally, take **{matched[2].title}** to apply your Python skills to data science.")
                follow_up = "Would you like to enroll in our most affordable Python course? 🚀"
                return format_course_recommendations(intro, matched, order, follow_up)
            else:
                matched = sorted(python_courses, key=lambda x: x.id)[:3]
                intro = "🐍 Python is the foundation for Web Dev, Data Science, and AI. Here are our Python courses:"
                order = []
                if len(matched) > 0:
                    order.append(f"Start with **{matched[0].title}** to learn core Python variables.")
                if len(matched) > 1:
                    order.append(f"Then move to **{matched[1].title}** to learn pandas and numpy for data analysis.")
                follow_up = "Are you learning Python for general programming or for data science/AI? 🚀"
                return format_course_recommendations(intro, matched, order, follow_up)
                
        # 3. Web Dev / Web Development
        elif any(k in query_text for k in ["web dev", "web development", "website", "html", "css", "react", "node", "frontend", "backend", "web"]):
            matched = [c for c in all_courses if c.category.lower() == "web dev"]
            matched = sorted(matched, key=lambda x: x.price)
            intro = "🌐 Excellent choice! Here are our Web Development courses to build websites and web apps:"
            if "beginner" in query_text:
                intro = "🌐 Since you are a beginner, here are our Web Development courses starting with the foundations:"
            order = []
            if len(matched) > 0:
                order.append(f"Start with the FREE course **{matched[0].title}** to master HTML/CSS and responsive design.")
            if len(matched) > 1:
                order.append(f"Next, learn JavaScript and move to **{matched[1].title}** to build interactive frontends.")
            if len(matched) > 2:
                order.append(f"Finally, build full stack backends with **{matched[2].title}** using Node.js and database integration.")
            follow_up = "Would you like to start with the free responsive design course? 🚀"
            return format_course_recommendations(intro, matched, order, follow_up)
            
        # 4. Cloud courses
        elif any(k in query_text for k in ["cloud", "aws", "gcp", "azure", "computing"]):
            matched = [c for c in all_courses if c.category.lower() == "cloud"]
            matched = sorted(matched, key=lambda x: x.price)
            intro = "☁️ Here are our Cloud computing courses to master AWS, Google Cloud, and Azure:"
            order = []
            if len(matched) > 0:
                order.append(f"Start with the FREE course **{matched[0].title}** to learn core cloud concepts.")
            if len(matched) > 1:
                order.append(f"Then study **{matched[1].title}** for enterprise Microsoft cloud solutions.")
            if len(matched) > 2:
                order.append(f"Finally, take **{matched[2].title}** to prepare for solutions architect certification.")
            follow_up = "Which cloud platform (AWS, GCP, Azure) are you targeting? 🚀"
            return format_course_recommendations(intro, matched, order, follow_up)

        # 5. Data Science / Data Scientist roadmap
        elif any(k in query_text for k in ["data science", "data scientist", "data", "analytics", "pandas", "numpy"]):
            matched = [c for c in all_courses if c.category.lower() in ["data science", "ml"]]
            matched = sorted(matched, key=lambda x: x.id)[:4]
            intro = "📊 Here is the complete learning roadmap to become a Data Scientist:"
            order = []
            if len(matched) > 0:
                order.append(f"Start with **{matched[0].title}** to learn data manipulation using Pandas and NumPy.")
            if len(matched) > 1:
                order.append(f"Then study **{matched[1].title}** to learn Tableau, PowerBI, and dashboard layouts.")
            if len(matched) > 2:
                order.append(f"Move to **{matched[2].title}** to master regression, classification, and classical ML.")
            if len(matched) > 3:
                order.append(f"Finally, take **{matched[3].title}** to learn deep neural networks and PyTorch/TensorFlow.")
            follow_up = "Would you like me to guide you through registering for your first data science course? 🚀"
            return format_course_recommendations(intro, matched, order, follow_up)

        # 6. ML / AI / Machine Learning
        elif any(k in query_text for k in ["machine learning", "ml", "sklearn", "scikit-learn"]):
            matched = [c for c in all_courses if c.category.lower() in ["ml", "ai"]]
            matched = sorted(matched, key=lambda x: x.id)[:4]
            intro = "🤖 Here are our Artificial Intelligence and Machine Learning courses:"
            order = []
            if len(matched) > 2:
                order.append(f"Start with the FREE **{matched[2].title}** to learn classical search algorithms.")
            if len(matched) > 0:
                order.append(f"Move to **{matched[0].title}** to master scikit-learn models.")
            if len(matched) > 1:
                order.append(f"Advance to **{matched[1].title}** to build deep neural networks.")
            if len(matched) > 3:
                order.append(f"Finally, take **{matched[3].title}** to master prompt engineering and LLM applications.")
            follow_up = "Are you interested in classical machine learning algorithms, or generative AI? 🚀"
            return format_course_recommendations(intro, matched, order, follow_up)

        elif any(k in query_text for k in ["ai", "artificial intelligence", "gpt", "llm", "prompt"]):
            matched = [c for c in all_courses if c.category.lower() == "ai"]
            matched = sorted(matched, key=lambda x: x.id)
            intro = "🤖 Here are our Artificial Intelligence courses:"
            order = []
            if len(matched) > 0:
                order.append(f"Start with the FREE **{matched[0].title}** to learn AI search algorithms.")
            if len(matched) > 1:
                order.append(f"Then take **{matched[1].title}** to learn Prompt Engineering and LLMs.")
            follow_up = "Would you like to build LLM-powered applications? 🚀"
            return format_course_recommendations(intro, matched, order, follow_up)

        # 7. Mobile Dev / Mobile Development
        elif any(k in query_text for k in ["mobile", "android", "ios", "flutter", "swift", "kotlin"]):
            matched = [c for c in all_courses if c.category.lower() == "mobile dev"]
            matched = sorted(matched, key=lambda x: x.id)
            intro = "📱 Here are our Mobile Development courses to build native or cross-platform applications:"
            order = []
            if len(matched) > 0:
                order.append(f"For native iOS, take **{matched[0].title}** to learn Swift and SwiftUI.")
            if len(matched) > 2:
                order.append(f"For native Android, take **{matched[2].title}** to master Kotlin and Compose.")
            if len(matched) > 1:
                order.append(f"For cross-platform, take **{matched[1].title}** to target both iOS and Android simultaneously.")
            follow_up = "Do you prefer native iOS/Android development or a cross-platform framework like Flutter? 🚀"
            return format_course_recommendations(intro, matched, order, follow_up)

        # 8. Cybersecurity
        elif any(k in query_text for k in ["security", "cybersecurity", "cyber", "hacking", "pentesting"]):
            matched = [c for c in all_courses if c.category.lower() == "cybersecurity"]
            matched = sorted(matched, key=lambda x: x.id)
            intro = "🛡️ Here are our Cybersecurity courses to learn cyber defense and ethical hacking:"
            order = []
            if len(matched) > 1:
                order.append(f"Start with the FREE course **{matched[1].title}** to learn basic firewalls, crypt, and network defense.")
            if len(matched) > 0:
                order.append(f"Then take **{matched[0].title}** to learn penetration testing and prepare for the CEH exam.")
            follow_up = "Would you like to enroll in our free security basics course? 🚀"
            return format_course_recommendations(intro, matched, order, follow_up)

        # 9. Design / UI/UX
        elif any(k in query_text for k in ["design", "ui", "ux", "ui/ux", "figma", "photoshop", "adobe"]):
            matched = [c for c in all_courses if c.category.lower() == "design"]
            matched = sorted(matched, key=lambda x: x.id)
            intro = "🎨 Here are our Design courses to master graphics and UI/UX layouts:"
            order = []
            if len(matched) > 0:
                order.append(f"For web/app layouts, take **{matched[0].title}** to master Figma prototyping.")
            if len(matched) > 1:
                order.append(f"For general graphics, take **{matched[1].title}** to learn Photoshop and Illustrator.")
            follow_up = "Are you looking to learn product UI/UX design or graphic design/branding? 🚀"
            return format_course_recommendations(intro, matched, order, follow_up)

        # 10. Recommendations based on profile / "recommend something for me"
        elif any(k in query_text for k in ["recommend", "recommendation", "for me", "something", "suggest"]):
            interests = user.interests if (hasattr(user, "interests") and user.interests) else ""
            interests_lower = interests.lower()
            
            enrolled = self.db.query(Interaction).filter(
                Interaction.user_id == user.id,
                Interaction.interaction_type == 'enrollment'
            ).all()
            enrolled_course_ids = [e.course_id for e in enrolled if e.course]
            enrolled_titles = [e.course.title for e in enrolled if e.course]

            recommended_courses = []
            interest_matched_category = None
            
            for cat in ["business", "web dev", "python", "data science", "ml", "ai", "mobile dev", "cloud", "cybersecurity", "design"]:
                if cat in interests_lower:
                    interest_matched_category = cat
                    break
                    
            if interest_matched_category:
                cat_name = "ML" if interest_matched_category == "ml" else "AI" if interest_matched_category == "ai" else interest_matched_category
                recommended_courses = [c for c in all_courses if c.category.lower() == cat_name or cat_name in (c.tags or "").lower()]
            
            recommended_courses = [c for c in recommended_courses if c.id not in enrolled_course_ids]
            
            if not recommended_courses:
                favs = ["Python Core and Advanced Programming", "HTML5, CSS3, and Responsive Web Design", "Digital Marketing Strategy and Social Media Analytics"]
                recommended_courses = [c for c in all_courses if c.title in favs and c.id not in enrolled_course_ids]
                if not recommended_courses:
                    recommended_courses = [c for c in all_courses if c.id not in enrolled_course_ids]
                if not recommended_courses:
                    recommended_courses = all_courses[:3]
            
            recommended_courses = recommended_courses[:3]
            
            intro_profile = f"👋 Hello {user.username}! Based on your interests in **{interests if interests else 'Programming/Tech'}**,"
            if enrolled_titles:
                intro_profile += f" and because you are currently learning **{enrolled_titles[0]}**,"
            intro_profile += " here are some personalized recommendations for you:"
            
            order = []
            if len(recommended_courses) > 0:
                order.append(f"Start with **{recommended_courses[0].title}** to build your core competency.")
            if len(recommended_courses) > 1:
                order.append(f"Next, check out **{recommended_courses[1].title}** to expand your skill set.")
            if len(recommended_courses) > 2:
                order.append(f"Finally, study **{recommended_courses[2].title}** to round out your knowledge.")
                
            follow_up = "Do these recommendations match your goals, or would you like to focus on another topic? 🚀"
            return format_course_recommendations(intro_profile, recommended_courses, order, follow_up)

        # 11. Generic fallback (if no keywords match at all and Gemini failed)
        return "⚠️ AI Assistant is temporarily unavailable. Please try again later."

    def chat(self, user: User, message: str, history: list = None):
        if self.api_key_valid:
            try:
                print(f"API Key loaded: {self.settings.GEMINI_API_KEY[:10]}...")
            except Exception:
                pass
                
        try:
            print(f"Sending to Gemini: {message.encode('ascii', errors='replace').decode('ascii')}")
        except Exception:
            pass
        
        if not self.api_key_valid:
            try:
                print("Gemini API key is not valid. Using fallback response.")
            except Exception:
                pass
            return self.get_fallback_response(user, message), False, "Gemini API key is not configured"
            
        try:
            system_prompt = self.get_system_prompt(user, message)
            
            conversation = [
                {"role": "user", "parts": [system_prompt]},
                {"role": "model", "parts": ["I understand. I'm CourseRec AI, ready to help you find the perfect courses!"]}
            ]
            
            if history:
                for msg in history[-10:]:
                    role = "user" if msg['role'] == 'user' else "model"
                    conversation.append({"role": role, "parts": [msg['content']]})
            
            chat = self.model.start_chat(history=conversation)
            response = chat.send_message(message)
            response_text = response.text
            
            try:
                print(f"Received from Gemini: {response_text[:100].encode('ascii', errors='replace').decode('ascii')}...")
            except Exception:
                pass
            
            # Validate response category matching
            if not self.validate_response_category(message, response_text):
                try:
                    print("Gemini response category mismatch! Regenerating using fallback.")
                except Exception:
                    pass
                return self.get_fallback_response(user, message), False, "Category mismatch in LLM output"
                
            return response_text, True, None
            
        except Exception as e:
            try:
                print(f"Error in Gemini chat: {str(e).encode('ascii', errors='replace').decode('ascii')}. Falling back to rule-based response.")
            except Exception:
                pass
            return self.get_fallback_response(user, message), False, str(e)
