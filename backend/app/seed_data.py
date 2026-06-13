import argparse
import os
import random
import sys
from collections import Counter
from datetime import datetime, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

# Add current directory to path if run directly
sys.path.append(os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

from app.config import get_settings
from app.database import Base, engine, SessionLocal
from app.models.course import Course
from app.models.user import User
from app.models.interaction import Interaction
from app.models.roadmap import LearningRoadmap
from app.models.roadmap_step import RoadmapStep
from app.models.recommendation import Recommendation
from app.utils.security import get_password_hash

# 25 Realistic courses with descriptions > 100 words
COURSES_DATA = [
    {
        "title": "Python Core and Advanced Programming",
        "description": "Master Python from the ground up, starting with basic syntax, data types, control flow, and functions. Progress to advanced topics such as object-oriented programming, decorators, generators, file handling, and context managers. You will build multiple hands-on projects, including a web scraper, a data analyzer, and a desktop application, ensuring you gain practical, job-ready skills. This comprehensive curriculum is designed for complete beginners as well as intermediate programmers looking to solidify their understanding. By the end of this course, you will have a deep understanding of writing clean, idiomatic Python code (Pythonic code) and be fully prepared to apply for software engineering positions or start your own programming projects.",
        "category": "Programming",
        "level": "Beginner",
        "duration_hours": 45,
        "price": 29.99,
        "instructor": "Dr. Angela Yu",
        "thumbnail_url": "https://picsum.photos/400/300?random=1",
        "url": "https://example.com/courses/python-core-advanced",
        "tags": "python,programming,coding,oop"
    },
    {
        "title": "Java Fundamentals and Object-Oriented Design",
        "description": "Explore the fundamentals of Java programming in this extensive course designed for students and professionals. Learn about the Java Virtual Machine, variables, control statements, arrays, and basic input/output. Master the core principles of object-oriented programming, including inheritance, polymorphism, encapsulation, and abstraction. You will work on real-world projects such as a banking application and an inventory management system. Discover how to handle exceptions, work with generic classes, and build interactive user interfaces. This course covers everything you need to start building robust, scalable applications in Java. With our expert guidance and interactive exercises, you will develop a solid foundation in software development and prepare yourself for professional Java certification exams.",
        "category": "Programming",
        "level": "Beginner",
        "duration_hours": 50,
        "price": 49.99,
        "instructor": "Tim Buchalka",
        "thumbnail_url": "https://picsum.photos/400/300?random=2",
        "url": "https://example.com/courses/java-fundamentals",
        "tags": "java,programming,oop,backend"
    },
    {
        "title": "C++ Systems Programming and Performance",
        "description": "Dive deep into systems programming using C++ and learn how to write high-performance, low-level applications. This course covers memory management, pointers, references, smart pointers, and the C++ standard template library in great detail. Explore advanced concepts like multithreading, concurrency, socket programming, and memory layout optimization. You will build systems-level projects including a custom memory allocator, a multi-threaded web server, and a basic shell. Gain a deep understanding of compiler optimizations and how to write efficient code that runs directly on the hardware. This course is ideal for developers looking to work in game engines, operating systems, finance, or embedded systems where performance is absolutely critical.",
        "category": "Programming",
        "level": "Advanced",
        "duration_hours": 60,
        "price": 89.99,
        "instructor": "Bjarne Stroustrup",
        "thumbnail_url": "https://picsum.photos/400/300?random=3",
        "url": "https://example.com/courses/cpp-systems",
        "tags": "cpp,systems,low-level,performance"
    },
    {
        "title": "Modern React and Redux Architecture",
        "description": "Learn React and Redux from absolute basics to advanced application architecture with this comprehensive development course. Master React hooks, custom hooks, functional components, JSX, and the virtual DOM to build fast, responsive interfaces. Understand state management in depth, including component state, context API, and advanced global state using Redux Toolkit. You will build three real-world projects: a social media dashboard, an e-commerce platform, and a real-time chat application. Learn how to optimize React performance using memoization, handle complex asynchronous data fetching, and write robust unit tests for components. This course is perfect for front-end developers aiming to build professional web applications with modern React best practices.",
        "category": "Web Dev",
        "level": "Intermediate",
        "duration_hours": 40,
        "price": 19.99,
        "instructor": "Maximilian Schwarzmüller",
        "thumbnail_url": "https://picsum.photos/400/300?random=4",
        "url": "https://example.com/courses/modern-react-redux",
        "tags": "react,redux,javascript,frontend,webdev"
    },
    {
        "title": "Full Stack Web Development with Node.js",
        "description": "Become a professional full-stack web developer by mastering Node.js, Express, and MongoDB in this project-based course. Learn how to build scalable, high-performance backend APIs from scratch, focusing on routing, middleware, and request handling. Understand database integration using Mongoose, database modeling, schema design, and advanced querying. Implement secure user authentication using JWT, password hashing, and role-based access control. You will build and deploy a complete project-management web application, including a RESTful API and a dynamic frontend. Explore advanced topics like WebSockets for real-time communication, caching with Redis, and deploying to cloud platforms. This course provides all the skills required for modern backend and full-stack development roles.",
        "category": "Web Dev",
        "level": "Intermediate",
        "duration_hours": 55,
        "price": 59.99,
        "instructor": "Jonas Schmedtmann",
        "thumbnail_url": "https://picsum.photos/400/300?random=5",
        "url": "https://example.com/courses/fullstack-node",
        "tags": "nodejs,express,mongodb,fullstack,backend,javascript"
    },
    {
        "title": "HTML5, CSS3, and Responsive Web Design",
        "description": "Master responsive web design and styling using HTML5, CSS3, Flexbox, CSS Grid, and modern design techniques. Learn how to write clean, semantic HTML structure and style it with advanced CSS layouts that work beautifully on all devices. Explore CSS animations, transitions, custom properties, preprocessors like Sass, and responsive typography. You will build a portfolio site, a landing page, and a complex dashboard layout, all optimized for mobile, tablet, and desktop screens. Discover how to implement accessibility (WCAG) standards and cross-browser compatibility. This course is ideal for web designers and front-end developers who want to create visually stunning and user-friendly web interfaces from scratch.",
        "category": "Web Dev",
        "level": "Beginner",
        "duration_hours": 30,
        "price": 0.0,
        "instructor": "Brad Traversy",
        "thumbnail_url": "https://picsum.photos/400/300?random=6",
        "url": "https://example.com/courses/responsive-html-css",
        "tags": "html,css,responsive,webdesign,frontend"
    },
    {
        "title": "Python for Data Science and Data Analysis",
        "description": "Unlock the power of data analysis and machine learning by learning Python for data science in this comprehensive course. Learn how to use essential libraries like NumPy for numerical computing and Pandas for data manipulation and analysis. Discover how to create stunning visualizations using Matplotlib and Seaborn, and perform statistical analysis on complex datasets. You will work on hands-on projects, analyzing real-world datasets from finance, healthcare, and social media. Master data cleaning, preprocessing, handling missing values, and exploratory data analysis. This course is designed to transition you from writing basic code to making data-driven decisions, building predictive models, and extracting valuable insights for business strategy.",
        "category": "Data Science",
        "level": "Beginner",
        "duration_hours": 35,
        "price": 34.99,
        "instructor": "Jose Portilla",
        "thumbnail_url": "https://picsum.photos/400/300?random=7",
        "url": "https://example.com/courses/python-datascience",
        "tags": "python,datascience,pandas,numpy,analysis"
    },
    {
        "title": "Advanced Data Visualization with Tableau and PowerBI",
        "description": "Learn how to transform raw data into interactive, visual stories using Tableau and Microsoft PowerBI. Master the art of creating dynamic dashboards, reports, and charts that drive business decisions and communicate insights effectively. Understand how to connect to various data sources, clean and transform data, and write complex calculations using DAX and Tableau formulas. You will build portfolio projects featuring sales dashboards, financial reports, and marketing performance trackers. Discover best practices in data visualization, color theory, and user experience design for dashboards. This course is perfect for business analysts, data scientists, and anyone looking to present data clearly, professionally, and persuasively to stakeholders.",
        "category": "Data Science",
        "level": "Intermediate",
        "duration_hours": 25,
        "price": 44.99,
        "instructor": "Kirill Eremenko",
        "thumbnail_url": "https://picsum.photos/400/300?random=8",
        "url": "https://example.com/courses/datavis-tableau-powerbi",
        "tags": "tableau,powerbi,visualization,dashboards,analytics"
    },
    {
        "title": "Practical Machine Learning with Scikit-Learn",
        "description": "Gain hands-on experience in building and deploying machine learning models using Python and the scikit-learn library. Learn the mathematical foundations and implementation details of regression, classification, clustering, and dimensionality reduction algorithms. Understand how to evaluate models using cross-validation, precision-recall curves, and ROC curves. Work on practical projects such as predicting house prices, detecting spam messages, and segmenting customer databases. Discover feature engineering, feature selection, and hyperparameter tuning techniques to optimize model performance. This course bridges the gap between machine learning theory and practical, real-world application, making you ready for a career as a machine learning engineer.",
        "category": "ML",
        "level": "Intermediate",
        "duration_hours": 45,
        "price": 49.99,
        "instructor": "Andrew Ng",
        "thumbnail_url": "https://picsum.photos/400/300?random=9",
        "url": "https://example.com/courses/practical-ml-sklearn",
        "tags": "machinelearning,ml,scikit-learn,python,algorithms"
    },
    {
        "title": "Deep Learning and Neural Networks",
        "description": "Enter the world of artificial neural networks and deep learning using TensorFlow, Keras, and PyTorch. Learn how to design, train, and optimize deep neural networks, convolutional neural networks, and recurrent neural networks. Explore applications in computer vision, natural language processing, and sequence modeling, building projects like image classifiers and text generators. Understand key concepts like backpropagation, optimization algorithms, regularization techniques, and transfer learning using pre-trained models. This advanced course provides a solid theoretical understanding and practical programming skills to solve complex problems using deep learning. Ideal for software engineers and data scientists looking to enter the field of advanced AI development.",
        "category": "ML",
        "level": "Advanced",
        "duration_hours": 50,
        "price": 79.99,
        "instructor": "Dr. Yann LeCun",
        "thumbnail_url": "https://picsum.photos/400/300?random=10",
        "url": "https://example.com/courses/deep-learning-neural-nets",
        "tags": "deeplearning,tensorflow,pytorch,neuralnetworks,ai"
    },
    {
        "title": "Introduction to Artificial Intelligence and Search Algorithms",
        "description": "Learn the foundational principles and algorithms of Artificial Intelligence, focusing on problem-solving, search, and knowledge representation. Understand classical search techniques including depth-first search, breadth-first search, A* search, and heuristic design. Explore game-playing algorithms like Minimax and Alpha-Beta pruning, constraint satisfaction problems, and logic-based reasoning systems. You will build AI agents that solve mazes, play games, and reason about their environments. This course provides a deep dive into the computer science fundamentals that power modern AI systems. It is perfect for computer science students and engineers looking to understand how AI agents make intelligent decisions and solve complex puzzles.",
        "category": "AI",
        "level": "Beginner",
        "duration_hours": 30,
        "price": 0.0,
        "instructor": "Prof. Sebastian Thrun",
        "thumbnail_url": "https://picsum.photos/400/300?random=11",
        "url": "https://example.com/courses/intro-ai-search",
        "tags": "ai,search,algorithms,logic,computerscience"
    },
    {
        "title": "Large Language Models and Prompt Engineering",
        "description": "Master the techniques of prompt engineering and working with Large Language Models like GPT-4 and Claude. Learn how to design effective prompts, use few-shot learning, implement chain-of-thought reasoning, and mitigate model hallucinations. Explore how to build LLM-powered applications using frameworks like LangChain and LlamaIndex for retrieval-augmented generation (RAG). You will build multiple applications, including a custom knowledge-base chatbot and an automated text summarizer. Understand the ethics, safety guidelines, and performance optimization techniques for deploying language models in production environments. This course is ideal for developers and AI enthusiasts eager to build cutting-edge generative AI applications today.",
        "category": "AI",
        "level": "Intermediate",
        "duration_hours": 20,
        "price": 39.99,
        "instructor": "Dr. Andrej Karpathy",
        "thumbnail_url": "https://picsum.photos/400/300?random=12",
        "url": "https://example.com/courses/llm-prompt-engineering",
        "tags": "llm,prompt-engineering,generative-ai,gpt,langchain"
    },
    {
        "title": "iOS App Development with Swift and SwiftUI",
        "description": "Learn how to build beautiful, native iOS applications using Apple's modern programming language Swift and SwiftUI framework. Master the fundamentals of Swift syntax, object-oriented concepts, and functional programming features. Understand declarative UI design, state management, and navigation paradigms in SwiftUI to create smooth user experiences. You will build and run projects like a weather app, a task manager, and a movie catalog on the iOS simulator. Explore how to integrate core iOS technologies like CoreData, location services, and web APIs. This course is designed for aspiring mobile developers looking to launch their apps on the Apple App Store.",
        "category": "Mobile Dev",
        "level": "Beginner",
        "duration_hours": 45,
        "price": 69.99,
        "instructor": "Paul Hudson",
        "thumbnail_url": "https://picsum.photos/400/300?random=13",
        "url": "https://example.com/courses/ios-swift-swiftui",
        "tags": "ios,swift,swiftui,mobile,apple"
    },
    {
        "title": "Cross-Platform Mobile Apps with Flutter and Dart",
        "description": "Build high-performance, beautiful mobile apps for iOS and Android simultaneously using the Flutter SDK and Dart programming language. Master Dart syntax, reactive programming, widget trees, and layout designs in Flutter to build responsive user interfaces. Understand state management solutions like Provider, Bloc, and Riverpod, and how to manage application state efficiently. You will create projects such as a personal finance tracker, a shopping app, and a social network client. Learn how to integrate device hardware, consume RESTful APIs, and deploy apps to both Google Play and Apple App Store. Perfect for developers looking to build cross-platform mobile apps.",
        "category": "Mobile Dev",
        "level": "Intermediate",
        "duration_hours": 50,
        "price": 49.99,
        "instructor": "Dr. Angela Yu",
        "thumbnail_url": "https://picsum.photos/400/300?random=14",
        "url": "https://example.com/courses/flutter-dart-mobile",
        "tags": "flutter,dart,crossplatform,mobile,android,ios"
    },
    {
        "title": "Android App Development with Kotlin",
        "description": "Learn how to build modern, native Android applications using Kotlin and Jetpack Compose in this comprehensive development course. Master Kotlin syntax, coroutines for asynchronous programming, and clean architecture patterns like MVVM. Understand declarative UI design, navigation, and theme customization using Android Jetpack libraries. You will build projects including a news reader app, a fitness tracker, and an offline-first notes application. Discover how to use Room database for local storage, Retrofit for networking, and dependency injection with Hilt. This course covers the official Android development best practices recommended by Google to build high-quality, professional Android apps.",
        "category": "Mobile Dev",
        "level": "Intermediate",
        "duration_hours": 48,
        "price": 54.99,
        "instructor": "Philipp Lackner",
        "thumbnail_url": "https://picsum.photos/400/300?random=15",
        "url": "https://example.com/courses/android-kotlin-compose",
        "tags": "android,kotlin,compose,jetpack,mobile"
    },
    {
        "title": "AWS Cloud Practitioner and Solutions Architect",
        "description": "Prepare for the AWS Certified Solutions Architect exam while gaining practical skills to design and deploy secure, scalable cloud architectures. Learn about core AWS services including EC2, S3, RDS, Lambda, VPC, IAM, and CloudWatch. Master cloud design principles, high availability, fault tolerance, cost optimization, and security best practices. You will build and configure multiple cloud architectures, including a multi-tier web application and a serverless backend. Understand hybrid cloud deployments, disaster recovery planning, and data migration strategies. This course is ideal for systems administrators, developers, and IT professionals looking to advance their career in cloud computing.",
        "category": "Cloud",
        "level": "Intermediate",
        "duration_hours": 40,
        "price": 99.99,
        "instructor": "Neal Davis",
        "thumbnail_url": "https://picsum.photos/400/300?random=16",
        "url": "https://example.com/courses/aws-certified-architect",
        "tags": "aws,cloud,solutionsarchitect,infrastructure,devops"
    },
    {
        "title": "Google Cloud Platform (GCP) Fundamentals",
        "description": "Get a solid introduction to the fundamentals of Google Cloud Platform (GCP) and how to design cloud-native solutions. Explore core GCP services including Compute Engine, App Engine, Kubernetes Engine, Cloud Storage, BigQuery, and Cloud IAM. Learn how to deploy and manage containerized applications, monitor system health, and implement security controls. You will complete hands-on labs building scalable container deployments and setting up automated CI/CD pipelines. This course prepares you for GCP certification exams and teaches you how to leverage Google's world-class infrastructure to build, test, and deploy applications rapidly and securely.",
        "category": "Cloud",
        "level": "Beginner",
        "duration_hours": 20,
        "price": 0.0,
        "instructor": "Dr. Abhishek Mishra",
        "thumbnail_url": "https://picsum.photos/400/300?random=17",
        "url": "https://example.com/courses/gcp-fundamentals",
        "tags": "gcp,googlecloud,kubernetes,cloudnative"
    },
    {
        "title": "Azure Cloud Solutions and Services",
        "description": "Master the core services and architecture of Microsoft Azure to design and implement robust enterprise cloud solutions. Learn about Azure virtual machines, app services, SQL database, active directory, and serverless functions. Understand how to manage Azure resources using portal, CLI, and resource manager templates. You will construct architectures for hybrid networks, secure storage solutions, and automated server scaling. Discover cloud governance, security compliance, and disaster recovery strategies. This course prepares you for the Azure Fundamentals and Administrator certifications, making it perfect for IT professionals and developers working in Microsoft enterprise environments.",
        "category": "Cloud",
        "level": "Intermediate",
        "duration_hours": 35,
        "price": 79.99,
        "instructor": "Scott Duffy",
        "thumbnail_url": "https://picsum.photos/400/300?random=18",
        "url": "https://example.com/courses/azure-cloud-solutions",
        "tags": "azure,microsoft,cloud,admin"
    },
    {
        "title": "Certified Ethical Hacker (CEH) Preparation",
        "description": "Learn the methodologies, tools, and techniques of ethical hacking and penetration testing to secure computer systems and networks. Explore key topics including footprinting, scanning, vulnerability analysis, system hacking, malware threats, sniffing, and social engineering. Understand how to identify and patch security flaws in web applications, databases, wireless networks, and mobile platforms. You will practice in safe, hands-on lab environments, performing penetration tests and writing detailed security reports. This course prepares you for the Certified Ethical Hacker (CEH) certification exam. Perfect for security professionals, network administrators, and developers looking to understand the hacker mindset to build secure applications.",
        "category": "Cybersecurity",
        "level": "Advanced",
        "duration_hours": 55,
        "price": 149.99,
        "instructor": "Dr. Philip Polstra",
        "thumbnail_url": "https://picsum.photos/400/300?random=19",
        "url": "https://example.com/courses/ceh-ethical-hacking",
        "tags": "cybersecurity,hacking,security,pentesting"
    },
    {
        "title": "Information Security and Cyber Defense Basics",
        "description": "Understand the fundamentals of cybersecurity, network defense, and risk management in this essential course for IT professionals. Learn about cryptography, network protocols, firewalls, intrusion detection systems, and security information and event management (SIEM). Discover how to implement security policies, manage user access, and respond to security incidents. You will analyze real-world cyberattacks, learn how they occurred, and design defense mechanisms to prevent them. This course provides a comprehensive overview of cybersecurity principles and prepares you for roles in security operations centers (SOC) and cyber defense teams. Ideal for anyone looking to build a career in cybersecurity.",
        "category": "Cybersecurity",
        "level": "Beginner",
        "duration_hours": 25,
        "price": 0.0,
        "instructor": "Nathan House",
        "thumbnail_url": "https://picsum.photos/400/300?random=20",
        "url": "https://example.com/courses/cybersecurity-basics",
        "tags": "cybersecurity,networkdefense,security,infosec"
    },
    {
        "title": "UI/UX Design Essentials and Figma Prototyping",
        "description": "Master the principles of user interface (UI) and user experience (UX) design and learn how to use Figma for professional prototyping. Understand user research, wireframing, information architecture, user journeys, and usability testing. Learn visual design principles including layout, typography, color theory, design systems, and responsive design. You will build a complete mobile app and web design project in Figma, from initial concept to high-fidelity interactive prototype. Discover how to collaborate with developers and hand off design assets smoothly. This course is perfect for aspiring UI/UX designers, product managers, and developers wanting to improve their design skills.",
        "category": "Design",
        "level": "Beginner",
        "duration_hours": 30,
        "price": 39.99,
        "instructor": "Daniel Walter Scott",
        "thumbnail_url": "https://picsum.photos/400/300?random=21",
        "url": "https://example.com/courses/uiux-design-figma",
        "tags": "design,uiux,figma,prototype,user-experience"
    },
    {
        "title": "Graphic Design Masterclass using Adobe Tools",
        "description": "Unleash your creativity and master graphic design using Adobe Photoshop, Illustrator, and InDesign in this comprehensive masterclass. Learn the core principles of design, composition, typography, color theory, and branding. You will complete practical projects including logo design, vector illustrations, photo editing, magazine layouts, and marketing materials. Discover professional workflows, print production requirements, and digital asset preparation for web and social media. Build a stunning design portfolio that showcases your skills to potential clients or employers. This course is ideal for beginners and self-taught designers wanting to establish a solid foundation in professional graphic design.",
        "category": "Design",
        "level": "Beginner",
        "duration_hours": 40,
        "price": 49.99,
        "instructor": "Lindsay Marsh",
        "thumbnail_url": "https://picsum.photos/400/300?random=22",
        "url": "https://example.com/courses/graphic-design-masterclass",
        "tags": "graphic-design,adobe,photoshop,illustrator,branding"
    },
    {
        "title": "Digital Marketing Strategy and Social Media Analytics",
        "description": "Learn how to design, execute, and analyze successful digital marketing campaigns across SEO, SEM, social media, and email marketing. Master keyword research, on-page optimization, content marketing strategies, and paid advertising on Google and Facebook. Understand how to use analytics tools like Google Analytics to track user behavior, measure conversion rates, and calculate return on investment (ROI). You will create a complete marketing plan for a product, launch mock ad campaigns, and analyze performance reports. Perfect for entrepreneurs, marketing professionals, and business owners looking to grow their online presence and drive customer acquisition using data-driven strategies.",
        "category": "Business",
        "level": "Beginner",
        "duration_hours": 28,
        "price": 19.99,
        "instructor": "Robin & Jesper",
        "thumbnail_url": "https://picsum.photos/400/300?random=23",
        "url": "https://example.com/courses/digital-marketing-strategy",
        "tags": "marketing,seo,socialmedia,analytics,business"
    },
    {
        "title": "Product Management Masterclass: Concept to Launch",
        "description": "Master the skills required to guide digital products from initial concept, through development, to a successful market launch. Learn product strategy, market research, customer discovery, writing product requirements documents (PRDs), and agile product development. Understand how to collaborate with engineering, design, marketing, and sales teams to align on product vision. You will work on case studies, creating product roadmaps, defining key performance indicators (KPIs), and prioritizing feature backlogs. This course is designed for aspiring product managers, developers transitioning to management, and startup founders looking to build products customers love and scale them.",
        "category": "Business",
        "level": "Intermediate",
        "duration_hours": 35,
        "price": 89.99,
        "instructor": "Cole Mercer",
        "thumbnail_url": "https://picsum.photos/400/300?random=24",
        "url": "https://example.com/courses/product-management-masterclass",
        "tags": "product-management,agile,product,business,strategy"
    },
    {
        "title": "Financial Analysis and Investment Management Basics",
        "description": "Learn the fundamentals of corporate finance, financial statement analysis, and investment management in this comprehensive course. Understand how to read and analyze balance sheets, income statements, and cash flow statements to evaluate company performance. Explore concepts like time value of money, capital budgeting, stock valuation, and portfolio diversification. You will build financial models in Excel, evaluate investment projects, and analyze real-world company stock data. This course is ideal for finance students, business professionals, and personal investors looking to make informed, data-driven financial decisions and understand how corporate finance and markets work.",
        "category": "Business",
        "level": "Beginner",
        "duration_hours": 30,
        "price": 59.99,
        "instructor": "Chris Haroun",
        "thumbnail_url": "https://picsum.photos/400/300?random=25",
        "url": "https://example.com/courses/financial-analysis-investment",
        "tags": "finance,investing,financial-analysis,excel,business"
    }
]

SAMPLE_INTERACTIONS = [
    # User 1 (interests: Python, ML)
    {"email": "user1@example.com", "course_title": "Python Core and Advanced Programming", "type": "enrollment", "progress": 80, "rating": None},
    {"email": "user1@example.com", "course_title": "Python Core and Advanced Programming", "type": "rating", "progress": 80, "rating": 4.5},
    {"email": "user1@example.com", "course_title": "Practical Machine Learning with Scikit-Learn", "type": "enrollment", "progress": 100, "rating": None},
    {"email": "user1@example.com", "course_title": "Practical Machine Learning with Scikit-Learn", "type": "completion", "progress": 100, "rating": None},
    {"email": "user1@example.com", "course_title": "Practical Machine Learning with Scikit-Learn", "type": "rating", "progress": 100, "rating": 5.0},
    {"email": "user1@example.com", "course_title": "Deep Learning and Neural Networks", "type": "view", "progress": 15, "rating": None},
    {"email": "user1@example.com", "course_title": "Large Language Models and Prompt Engineering", "type": "enrollment", "progress": 30, "rating": None},

    # User 2 (interests: Web Dev)
    {"email": "user2@example.com", "course_title": "Modern React and Redux Architecture", "type": "enrollment", "progress": 100, "rating": None},
    {"email": "user2@example.com", "course_title": "Modern React and Redux Architecture", "type": "completion", "progress": 100, "rating": None},
    {"email": "user2@example.com", "course_title": "Modern React and Redux Architecture", "type": "rating", "progress": 100, "rating": 4.8},
    {"email": "user2@example.com", "course_title": "Full Stack Web Development with Node.js", "type": "enrollment", "progress": 55, "rating": None},
    {"email": "user2@example.com", "course_title": "Full Stack Web Development with Node.js", "type": "rating", "progress": 55, "rating": 4.0},
    {"email": "user2@example.com", "course_title": "HTML5, CSS3, and Responsive Web Design", "type": "view", "progress": 90, "rating": None},

    # User 3 (interests: Data Science)
    {"email": "user3@example.com", "course_title": "Python for Data Science and Data Analysis", "type": "enrollment", "progress": 100, "rating": None},
    {"email": "user3@example.com", "course_title": "Python for Data Science and Data Analysis", "type": "completion", "progress": 100, "rating": None},
    {"email": "user3@example.com", "course_title": "Python for Data Science and Data Analysis", "type": "rating", "progress": 100, "rating": 4.7},
    {"email": "user3@example.com", "course_title": "Advanced Data Visualization with Tableau and PowerBI", "type": "enrollment", "progress": 70, "rating": None},
    {"email": "user3@example.com", "course_title": "Advanced Data Visualization with Tableau and PowerBI", "type": "rating", "progress": 70, "rating": 4.2},
    {"email": "user3@example.com", "course_title": "Practical Machine Learning with Scikit-Learn", "type": "view", "progress": 40, "rating": None},

    # User 4 (interests: Mobile Dev)
    {"email": "user4@example.com", "course_title": "iOS App Development with Swift and SwiftUI", "type": "enrollment", "progress": 100, "rating": None},
    {"email": "user4@example.com", "course_title": "iOS App Development with Swift and SwiftUI", "type": "completion", "progress": 100, "rating": None},
    {"email": "user4@example.com", "course_title": "iOS App Development with Swift and SwiftUI", "type": "rating", "progress": 100, "rating": 4.9},
    {"email": "user4@example.com", "course_title": "Cross-Platform Mobile Apps with Flutter and Dart", "type": "enrollment", "progress": 65, "rating": None},
    {"email": "user4@example.com", "course_title": "Cross-Platform Mobile Apps with Flutter and Dart", "type": "rating", "progress": 65, "rating": 4.5},
    {"email": "user4@example.com", "course_title": "Android App Development with Kotlin", "type": "view", "progress": 25, "rating": None},

    # User 5 (interests: Cloud, DevOps)
    {"email": "user5@example.com", "course_title": "AWS Cloud Practitioner and Solutions Architect", "type": "enrollment", "progress": 100, "rating": None},
    {"email": "user5@example.com", "course_title": "AWS Cloud Practitioner and Solutions Architect", "type": "completion", "progress": 100, "rating": None},
    {"email": "user5@example.com", "course_title": "AWS Cloud Practitioner and Solutions Architect", "type": "rating", "progress": 100, "rating": 5.0},
    {"email": "user5@example.com", "course_title": "Google Cloud Platform (GCP) Fundamentals", "type": "enrollment", "progress": 30, "rating": None},
    {"email": "user5@example.com", "course_title": "Azure Cloud Solutions and Services", "type": "view", "progress": 15, "rating": None},
    {"email": "user5@example.com", "course_title": "Information Security and Cyber Defense Basics", "type": "enrollment", "progress": 10, "rating": None},
    {"email": "sania@example.com", "course_title": "Python for Data Science and Data Analysis", "type": "enrollment", "progress": 100, "rating": None},
    {"email": "sania@example.com", "course_title": "Python for Data Science and Data Analysis", "type": "completion", "progress": 100, "rating": None},
    {"email": "sania@example.com", "course_title": "Python for Data Science and Data Analysis", "type": "rating", "progress": 100, "rating": 4.8},
    {"email": "sania@example.com", "course_title": "Advanced Data Visualization with Tableau and PowerBI", "type": "enrollment", "progress": 55, "rating": None},
    {"email": "sania@example.com", "course_title": "Large Language Models and Prompt Engineering", "type": "in_progress", "progress": 35, "rating": None},
]

def create_or_get_user(db: Session, email: str, username: str, full_name: str, bio: str, interests: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if user:
        return user

    user = User(
        email=email,
        username=username,
        hashed_password=get_password_hash("Test@1234"),
        full_name=full_name,
        bio=bio,
        interests=interests,
        is_active=True,
        is_superuser=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def create_or_get_course(db: Session, course_data: dict) -> Course:
    course = db.query(Course).filter(Course.title == course_data["title"]).first()
    if course:
        return course

    course = Course(
        title=course_data["title"],
        description=course_data.get("description"),
        category=course_data.get("category", "Programming"),
        level=course_data.get("level", "Beginner"),
        duration_hours=course_data.get("duration_hours", 30),
        price=course_data.get("price", 0.0),
        instructor=course_data.get("instructor", "TBD"),
        thumbnail_url=course_data.get("thumbnail_url"),
        url=course_data.get("url"),
        tags=course_data.get("tags"),
        rating=0.0,
        total_ratings=0,
        enrollment_count=0,
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


def create_or_update_enrollment(db: Session, user: User, course: Course, progress: int) -> Interaction:
    interaction = (
        db.query(Interaction)
        .filter(
            Interaction.user_id == user.id,
            Interaction.course_id == course.id,
            Interaction.interaction_type == "enrollment",
        )
        .first()
    )
    if interaction:
        if progress > interaction.progress:
            interaction.progress = progress
            interaction.updated_at = datetime.now(timezone.utc)
            db.commit()
            db.refresh(interaction)
        return interaction

    interaction = Interaction(
        user_id=user.id,
        course_id=course.id,
        interaction_type="enrollment",
        progress=progress,
    )
    db.add(interaction)
    course.enrollment_count += 1
    db.add(course)
    db.commit()
    db.refresh(interaction)
    db.refresh(course)
    return interaction


def create_or_update_roadmap(db: Session, user: User, skill_name: str, target_level: str, timeline: str) -> LearningRoadmap:
    roadmap = (
        db.query(LearningRoadmap)
        .filter(
            LearningRoadmap.user_id == user.id,
            LearningRoadmap.skill_name == skill_name,
        )
        .first()
    )
    if roadmap:
        roadmap.target_level = target_level
        roadmap.timeline = timeline
        db.commit()
        db.refresh(roadmap)
        return roadmap

    roadmap = LearningRoadmap(
        user_id=user.id,
        skill_name=skill_name,
        target_level=target_level,
        timeline=timeline,
        is_active=True,
    )
    db.add(roadmap)
    db.commit()
    db.refresh(roadmap)
    return roadmap


def add_or_update_roadmap_step(
    db: Session,
    roadmap: LearningRoadmap,
    step_number: int,
    course: Course,
    status: str,
    estimated_hours: int,
    prerequisites: str | None = None,
) -> RoadmapStep:
    step = (
        db.query(RoadmapStep)
        .filter(
            RoadmapStep.roadmap_id == roadmap.id,
            RoadmapStep.course_id == course.id,
        )
        .first()
    )
    if step:
        step.step_number = step_number
        step.status = status
        step.estimated_hours = estimated_hours
        step.prerequisites = prerequisites
        db.commit()
        db.refresh(step)
        return step

    step = RoadmapStep(
        roadmap_id=roadmap.id,
        course_id=course.id,
        step_number=step_number,
        status=status,
        estimated_hours=estimated_hours,
        prerequisites=prerequisites,
    )
    db.add(step)
    db.commit()
    db.refresh(step)
    return step


def seed_sample_data_for_user(db: Session, email: str) -> None:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        username = email.split("@")[0]
        user = create_or_get_user(
            db,
            email=email,
            username=username,
            full_name="Sania Dixon",
            bio="Learning roadmap creator with a focus on AI and web development.",
            interests="Python, AI, Web Dev"
        )
        print(f"Created user {email}")

    sample_courses = [
        {
            "title": "Python for Beginners",
            "description": "An accessible Python introduction for beginners with hands-on guided modules, exercises, and mini projects to build foundational confidence.",
            "category": "Programming",
            "level": "Beginner",
            "duration_hours": 20,
            "price": 19.99,
            "instructor": "Sania Dixon",
            "thumbnail_url": "https://picsum.photos/400/300?random=101",
            "url": "https://example.com/courses/python-for-beginners",
            "tags": "python,beginner,programming,foundations"
        },
        {
            "title": "HTML5, CSS3, and Responsive Web Design",
            "description": "Master responsive web design and styling using HTML5, CSS3, Flexbox, CSS Grid, and modern design techniques.",
            "category": "Web Dev",
            "level": "Beginner",
            "duration_hours": 30,
            "price": 0.0,
            "instructor": "Brad Traversy",
            "thumbnail_url": "https://picsum.photos/400/300?random=6",
            "url": "https://example.com/courses/responsive-html-css",
            "tags": "html,css,responsive,webdesign,frontend"
        },
        {
            "title": "UI/UX Design Essentials and Figma Prototyping",
            "description": "Master the principles of UI/UX design and learn how to use Figma for professional prototyping.",
            "category": "Design",
            "level": "Beginner",
            "duration_hours": 30,
            "price": 39.99,
            "instructor": "Daniel Walter Scott",
            "thumbnail_url": "https://picsum.photos/400/300?random=21",
            "url": "https://example.com/courses/uiux-design-figma",
            "tags": "design,uiux,figma,prototype,user-experience"
        },
    ]

    course_map = {}
    for course_data in sample_courses:
        course_map[course_data["title"]] = create_or_get_course(db, course_data)

    print("Seeding user enrollments for sania...")
    create_or_update_enrollment(db, user, course_map["Python for Beginners"], 50)
    create_or_update_enrollment(db, user, course_map["HTML5, CSS3, and Responsive Web Design"], 75)
    create_or_update_enrollment(db, user, course_map["UI/UX Design Essentials and Figma Prototyping"], 25)

    print("Seeding Sania's roadmaps...")
    python_mastery = create_or_update_roadmap(db, user, "Python Mastery", "Advanced", "6 months")
    web_dev_career = create_or_update_roadmap(db, user, "Web Development Career Path", "Intermediate", "5 months")

    course_lookup = {c.title: c for c in db.query(Course).filter(Course.title.in_([
        "Python for Beginners",
        "Python for Data Science and Data Analysis",
        "Practical Machine Learning with Scikit-Learn",
        "Deep Learning and Neural Networks",
        "HTML5, CSS3, and Responsive Web Design",
        "UI/UX Design Essentials and Figma Prototyping",
        "Modern React and Redux Architecture"
    ])).all()}

    add_or_update_roadmap_step(
        db,
        python_mastery,
        1,
        course_lookup["Python for Beginners"],
        "in_progress",
        20,
        "None"
    )
    add_or_update_roadmap_step(
        db,
        python_mastery,
        2,
        course_lookup["Python for Data Science and Data Analysis"],
        "locked",
        35,
        "Python fundamentals"
    )
    add_or_update_roadmap_step(
        db,
        python_mastery,
        3,
        course_lookup["Practical Machine Learning with Scikit-Learn"],
        "locked",
        45,
        "Data science basics"
    )
    add_or_update_roadmap_step(
        db,
        python_mastery,
        4,
        course_lookup["Deep Learning and Neural Networks"],
        "locked",
        50,
        "Machine learning foundations"
    )

    add_or_update_roadmap_step(
        db,
        web_dev_career,
        1,
        course_lookup["HTML5, CSS3, and Responsive Web Design"],
        "in_progress",
        30,
        "Basic HTML/CSS skills"
    )
    add_or_update_roadmap_step(
        db,
        web_dev_career,
        2,
        course_lookup["UI/UX Design Essentials and Figma Prototyping"],
        "in_progress",
        30,
        "Web layout and design fundamentals"
    )
    add_or_update_roadmap_step(
        db,
        web_dev_career,
        3,
        course_lookup["Modern React and Redux Architecture"],
        "locked",
        40,
        "Fundamentals of JavaScript and UI design"
    )

    print(f"Sample data seeded for user {email}.")


def main():
    parser = argparse.ArgumentParser(description="Seed the database with sample data.")
    parser.add_argument("--reset", action="store_true", help="Delete and recreate the database before seeding.")
    parser.add_argument("--update-user", type=str, help="Create sample enrollments and roadmaps for the specified user email.")
    args = parser.parse_args()

    settings = get_settings()
    
    if args.reset:
        print("Resetting database...")
        # Dispose engine connections
        engine.dispose()
        
        # Determine database file if SQLite
        if settings.database_url.startswith("sqlite:///"):
            db_path = settings.database_url.replace("sqlite:///", "")
            if db_path.startswith("./"):
                db_path = db_path[2:]
            
            # Delete database file
            if os.path.exists(db_path):
                try:
                    os.remove(db_path)
                    print(f"Deleted SQLite database file: {db_path}")
                except Exception as e:
                    print(f"Warning: Could not delete database file: {e}")
            else:
                print(f"Database file {db_path} does not exist. Creating fresh.")
        else:
            print("Non-sqlite database detected. Dropping all tables via SQLAlchemy...")
            Base.metadata.drop_all(bind=engine)

        print("Creating tables...")
        Base.metadata.create_all(bind=engine)
        print("Tables created successfully.")
    else:
        Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        if args.update_user:
            seed_sample_data_for_user(db, args.update_user)
            return

        if not args.reset:
            user_count = db.query(User).count()
            course_count = db.query(Course).count()
            if user_count > 0 or course_count > 0:
                print(f"Database already contains data ({user_count} users, {course_count} courses). Skipping seeding.")
                print("Use '--reset' flag to delete existing data and reseed.")
                return
    except Exception as e:
        print(f"Error querying database (tables might not exist): {e}")
        print("Creating tables...")
        Base.metadata.create_all(bind=engine)
    finally:
        db.close()

def seed_database(db: Session) -> None:
    """Seed the database with sample courses, users, and interactions."""
    try:
        # 1. Seed Users
        print("\nSeeding users...")
        # Hash password once to speed up execution
        default_pwd_hash = get_password_hash("Test@1234")
        
        # 5 Target Users
        target_users_data = [
            {
                "email": "user1@example.com",
                "username": "user1",
                "full_name": "Alice Johnson",
                "bio": "Python enthusiast and aspiring Machine Learning Engineer.",
                "interests": "Python, ML"
            },
            {
                "email": "user2@example.com",
                "username": "user2",
                "full_name": "Bob Smith",
                "bio": "Front-end developer and JavaScript explorer.",
                "interests": "Web Dev"
            },
            {
                "email": "user3@example.com",
                "username": "user3",
                "full_name": "Charlie Brown",
                "bio": "Data Analyst passionate about statistical modeling and visualization.",
                "interests": "Data Science"
            },
            {
                "email": "user4@example.com",
                "username": "user4",
                "full_name": "David Miller",
                "bio": "App developer building next-gen iOS and Android applications.",
                "interests": "Mobile Dev"
            },
            {
                "email": "user5@example.com",
                "username": "user5",
                "full_name": "Eva Green",
                "bio": "Cloud specialist focused on AWS and DevOps automation.",
                "interests": "Cloud, DevOps"
            },
            {
                "email": "sania@example.com",
                "username": "sania",
                "full_name": "Sania Dixon",
                "bio": "Learning roadmap creator with a focus on AI and data science.",
                "interests": "AI, Data Science"
            }
        ]
        
        users_map = {}
        for u_data in target_users_data:
            user = db.query(User).filter(User.email == u_data["email"]).first()
            if not user:
                user = User(
                    email=u_data["email"],
                    username=u_data["username"],
                    hashed_password=default_pwd_hash,
                    full_name=u_data["full_name"],
                    bio=u_data["bio"],
                    interests=u_data["interests"],
                    is_active=True,
                    is_superuser=False
                )
                db.add(user)
                db.commit()
            users_map[u_data["email"]] = user
            
        # Add 200 background mock users for rich statistics
        background_users = []
        for i in range(1, 201):
            email = f"mock_user_{i}@example.com"
            bg_user = db.query(User).filter(User.email == email).first()
            if not bg_user:
                bg_user = User(
                    email=email,
                    username=f"mock_user_{i}",
                    hashed_password=default_pwd_hash,
                    full_name=f"Mock User {i}",
                    bio=f"Bio for mock user {i}",
                    interests=random.choice(["Python", "Web Dev", "Data Science", "Mobile Dev", "Cloud", "DevOps", "AI", "Design", "Business"]),
                    is_active=True,
                    is_superuser=False
                )
                db.add(bg_user)
            background_users.append(bg_user)
            
        db.commit()
        
        # Refresh to get IDs
        for email in users_map:
            db.refresh(users_map[email])
        for bg_u in background_users:
            if bg_u.id is not None:
                db.refresh(bg_u)
            
        print(f"Successfully seeded {len(target_users_data)} target users and {len(background_users)} mock users.")

        # 2. Seed Courses
        print("\nSeeding courses...")
        # Validate and auto-pad descriptions to be >= 100 words
        for c in COURSES_DATA:
            word_count = len(c["description"].split())
            if word_count < 100:
                padding = " Additionally, the course includes extensive practical exercises, downloadable resources, quizzes, and projects designed to reinforce your learning and ensure you can apply your new skills effectively in any professional or academic setting."
                c["description"] += padding
                new_word_count = len(c["description"].split())
                print(f"Padded description for '{c['title']}' from {word_count} to {new_word_count} words.")
        
        courses_map = {}
        db_courses = []
        for c_data in COURSES_DATA:
            course = Course(
                title=c_data["title"],
                description=c_data["description"],
                category=c_data["category"],
                level=c_data["level"],
                duration_hours=c_data["duration_hours"],
                price=c_data["price"],
                instructor=c_data["instructor"],
                thumbnail_url=c_data["thumbnail_url"],
                url=c_data["url"],
                tags=c_data["tags"],
                rating=0.0,
                total_ratings=0,
                enrollment_count=0
            )
            db.add(course)
            db_courses.append(course)
            courses_map[c_data["title"]] = course
            
        db.commit()
        for course in db_courses:
            db.refresh(course)
            
        print(f"Successfully seeded {len(db_courses)} courses.")

        # 3. Seed Interactions
        print("\nGenerating interactions...")
        interactions_to_add = []
        all_user_ids = [u.id for u in background_users]
        
        # Generate background interactions to build realistic distribution
        for course in db_courses:
            target_rating = random.uniform(3.7, 4.9)
            enrollment_cnt = random.randint(100, 190)
            
            # Select random users for enrollment
            enrolled_users = random.sample(all_user_ids, enrollment_cnt)
            
            # Enrollments
            for uid in enrolled_users:
                interactions_to_add.append(Interaction(
                    user_id=uid,
                    course_id=course.id,
                    interaction_type="enrollment",
                    progress=random.choice([0, 10, 30, 50, 80, 100]),
                    rating=None
                ))
                
            # Completions & Views
            completion_cnt = int(enrollment_cnt * random.uniform(0.1, 0.4))
            completed_users = random.sample(enrolled_users, completion_cnt)
            for uid in completed_users:
                interactions_to_add.append(Interaction(
                    user_id=uid,
                    course_id=course.id,
                    interaction_type="completion",
                    progress=100,
                    rating=None
                ))
            
            # Views (some users just view without enrolling)
            view_cnt = random.randint(10, 50)
            view_users = random.sample(all_user_ids, view_cnt)
            for uid in view_users:
                interactions_to_add.append(Interaction(
                    user_id=uid,
                    course_id=course.id,
                    interaction_type="view",
                    progress=random.randint(1, 15),
                    rating=None
                ))
                
            # Ratings (subset of enrolled users)
            rating_cnt = random.randint(30, min(80, enrollment_cnt))
            rating_users = random.sample(enrolled_users, rating_cnt)
            
            for uid in rating_users:
                # Generate rating near target_rating
                rating_val = round(random.gauss(target_rating, 0.5) * 2) / 2
                rating_val = max(1.0, min(5.0, rating_val))
                interactions_to_add.append(Interaction(
                    user_id=uid,
                    course_id=course.id,
                    interaction_type="rating",
                    progress=random.randint(20, 100),
                    rating=rating_val
                ))

        # Add 30 sample user-course interactions for the 5 target users
        print("Adding sample interactions for target users...")
        for sample_int in SAMPLE_INTERACTIONS:
            user = users_map.get(sample_int["email"])
            course = courses_map.get(sample_int["course_title"])
            if user and course:
                interactions_to_add.append(Interaction(
                    user_id=user.id,
                    course_id=course.id,
                    interaction_type=sample_int["type"],
                    progress=sample_int["progress"],
                    rating=sample_int["rating"]
                ))
                
        # Bulk save all interactions
        print(f"Saving {len(interactions_to_add)} interactions to database...")
        db.add_all(interactions_to_add)
        db.commit()
        print("Interactions seeded successfully.")

        # 3.5 Seed Sania's roadmap data
        print("Seeding sample roadmaps for sania@example.com...")
        sania_user = users_map.get("sania@example.com")
        if sania_user:
            roadmap1 = LearningRoadmap(
                user_id=sania_user.id,
                skill_name="Data Science",
                target_level="Intermediate",
                timeline="3 months",
                is_active=True,
            )
            roadmap2 = LearningRoadmap(
                user_id=sania_user.id,
                skill_name="AI & LLMs",
                target_level="Advanced",
                timeline="6 months",
                is_active=True,
            )
            db.add_all([roadmap1, roadmap2])
            db.commit()
            db.refresh(roadmap1)
            db.refresh(roadmap2)

            roadmap_steps = [
                RoadmapStep(
                    roadmap_id=roadmap1.id,
                    course_id=courses_map["Python for Data Science and Data Analysis"].id,
                    step_number=1,
                    status="completed",
                    estimated_hours=35,
                    prerequisites="Basic Python fundamentals",
                ),
                RoadmapStep(
                    roadmap_id=roadmap1.id,
                    course_id=courses_map["Advanced Data Visualization with Tableau and PowerBI"].id,
                    step_number=2,
                    status="in_progress",
                    estimated_hours=25,
                    prerequisites="Data cleaning and analysis",
                ),
                RoadmapStep(
                    roadmap_id=roadmap1.id,
                    course_id=courses_map["Practical Machine Learning with Scikit-Learn"].id,
                    step_number=3,
                    status="locked",
                    estimated_hours=45,
                    prerequisites="Statistics and Python basics",
                ),
                RoadmapStep(
                    roadmap_id=roadmap2.id,
                    course_id=courses_map["Large Language Models and Prompt Engineering"].id,
                    step_number=1,
                    status="in_progress",
                    estimated_hours=20,
                    prerequisites="Foundations of NLP",
                ),
                RoadmapStep(
                    roadmap_id=roadmap2.id,
                    course_id=courses_map["Deep Learning and Neural Networks"].id,
                    step_number=2,
                    status="locked",
                    estimated_hours=50,
                    prerequisites="Basic machine learning and Python",
                ),
                RoadmapStep(
                    roadmap_id=roadmap2.id,
                    course_id=courses_map["Introduction to Artificial Intelligence and Search Algorithms"].id,
                    step_number=3,
                    status="locked",
                    estimated_hours=30,
                    prerequisites="Algorithmic thinking",
                ),
            ]
            db.add_all(roadmap_steps)
            db.commit()
            print("Sample roadmaps seeded for sania@example.com.")
        else:
            print("Warning: sania@example.com user not found for roadmap seeding.")

        # 4. Post-processing: Calculate and update each course's aggregated fields
        print("\nUpdating course statistics...")
        for course in db_courses:
            rating_stats = db.query(
                func.count(Interaction.id).label("count"),
                func.avg(Interaction.rating).label("avg_rating")
            ).filter(
                Interaction.course_id == course.id,
                Interaction.interaction_type == "rating",
                Interaction.rating.isnot(None)
            ).one()
            
            enrollment_cnt = db.query(func.count(Interaction.id)).filter(
                Interaction.course_id == course.id,
                Interaction.interaction_type == "enrollment"
            ).scalar()
            
            course.total_ratings = rating_stats.count
            course.rating = round(rating_stats.avg_rating, 2) if rating_stats.avg_rating else 0.0
            course.enrollment_count = enrollment_cnt
            db.add(course)
            
        db.commit()
        print("Course statistics updated successfully.")

        # 5. Print seeding summary
        total_courses = db.query(Course).count()
        total_users = db.query(User).count()
        total_interactions = db.query(Interaction).count()
        
        categories_dist = db.query(
            Course.category, func.count(Course.id)
        ).group_by(Course.category).all()
        
        avg_rating_val = db.query(func.avg(Course.rating)).filter(Course.total_ratings > 0).scalar()
        avg_rating = round(avg_rating_val, 2) if avg_rating_val else 0.0
        
        print("\n" + "="*50)
        print("DATABASE SEEDING SUMMARY")
        print("="*50)
        print(f"Total Courses:          {total_courses}")
        print(f"Total Users:            {total_users}")
        print(f"Total Interactions:     {total_interactions}")
        print(f"Average Course Rating:  {avg_rating:.2f} / 5.0")
        print("\nCourse Categories Distribution:")
        for cat, count in sorted(categories_dist, key=lambda x: x[1], reverse=True):
            print(f"  - {cat:<15}: {count} courses")
        print("="*50 + "\n")
        print("Seeding completed successfully!")

    except Exception as e:
        db.rollback()
        raise e


def main():
    parser = argparse.ArgumentParser(description="Seed the database with sample data.")
    parser.add_argument("--reset", action="store_true", help="Delete and recreate the database before seeding.")
    parser.add_argument("--update-user", type=str, help="Create sample enrollments and roadmaps for the specified user email.")
    args = parser.parse_args()

    settings = get_settings()
    
    if args.reset:
        print("Resetting database...")
        # Dispose engine connections
        engine.dispose()
        
        # Determine database file if SQLite
        if settings.database_url.startswith("sqlite:///"):
            db_path = settings.database_url.replace("sqlite:///", "")
            if db_path.startswith("./"):
                db_path = db_path[2:]
            
            # Delete database file
            if os.path.exists(db_path):
                try:
                    os.remove(db_path)
                    print(f"Deleted SQLite database file: {db_path}")
                except Exception as e:
                    print(f"Warning: Could not delete database file: {e}")
            else:
                print(f"Database file {db_path} does not exist. Creating fresh.")
        else:
            print("Non-sqlite database detected. Dropping all tables via SQLAlchemy...")
            Base.metadata.drop_all(bind=engine)

        print("Creating tables...")
        Base.metadata.create_all(bind=engine)
        print("Tables created successfully.")
    else:
        Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        if args.update_user:
            seed_sample_data_for_user(db, args.update_user)
            return

        if not args.reset:
            user_count = db.query(User).count()
            course_count = db.query(Course).count()
            if user_count > 0 or course_count > 0:
                print(f"Database already contains data ({user_count} users, {course_count} courses). Skipping seeding.")
                print("Use '--reset' flag to delete existing data and reseed.")
                return
    except Exception as e:
        print(f"Error querying database (tables might not exist): {e}")
        print("Creating tables...")
        Base.metadata.create_all(bind=engine)
    finally:
        db.close()

    db = SessionLocal()
    try:
        seed_database(db)
    except Exception as e:
        print(f"\nError seeding database: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
