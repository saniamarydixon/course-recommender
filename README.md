# Course Recommender

A full-stack AI-based Online Course Recommender System that helps users discover personalized learning paths based on their interests, profile, and course catalog data.

## Tech Stack

### Backend
- **FastAPI** — REST API framework
- **PostgreSQL** — Primary database
- **SQLAlchemy** — ORM
- **JWT** — Authentication
- **Redis** — Optional caching layer
- **Scikit-learn** — ML recommendation engine (placeholder ready)

### Frontend
- **React** (Vite)
- **Axios** — HTTP client
- **React Router** — Client-side routing
- **Material UI** — Component library

## Project Structure

```
course-recommender/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application entry point
│   │   ├── config.py            # Pydantic settings
│   │   ├── database.py          # SQLAlchemy engine & session
│   │   ├── api/routes/          # API route handlers
│   │   ├── models/              # SQLAlchemy ORM models
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   ├── services/            # Business logic layer
│   │   ├── ml/                  # Recommendation engine
│   │   └── utils/               # Security, dependencies, Redis
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/               # Route pages
│   │   ├── services/            # API service layer
│   │   ├── context/             # React context (auth)
│   │   ├── hooks/               # Custom React hooks
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## Prerequisites

- Python 3.12+
- Node.js 20+
- PostgreSQL 16+ (or use Docker)
- Redis 7+ (optional)
- Docker & Docker Compose (optional)

## Quick Start with Docker

```bash
# Clone and enter the project
cd course-recommender

# Start all services (PostgreSQL, Redis, Backend, Frontend)
docker-compose up --build
```

| Service  | URL                          |
|----------|------------------------------|
| Frontend | http://localhost:5173        |
| Backend  | http://localhost:8000        |
| API Docs | http://localhost:8000/docs   |
| Database | localhost:5432               |

## Local Development

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Windows (CMD):
venv\Scripts\activate.bat
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file and configure
cp .env.example .env   # Linux/macOS
copy .env.example .env # Windows

# Start PostgreSQL (via Docker or local install)
docker-compose up db -d

# Run the API server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env   # Linux/macOS
copy .env.example .env # Windows

# Start development server
npm run dev
```

## API Endpoints

| Method | Endpoint                        | Description                    | Auth     |
|--------|---------------------------------|--------------------------------|----------|
| GET    | `/api/v1/health`                | Health check                   | Public   |
| GET    | `/api/v1/health/db`             | Database health check          | Public   |
| POST   | `/api/v1/auth/register`         | Register new user              | Public   |
| POST   | `/api/v1/auth/login`            | Login                          | Public   |
| POST   | `/api/v1/auth/refresh`          | Refresh JWT token              | Public   |
| GET    | `/api/v1/users/me`              | Get current user profile       | Required |
| PUT    | `/api/v1/users/me`              | Update current user profile    | Required |
| GET    | `/api/v1/courses`               | List courses                   | Public   |
| GET    | `/api/v1/courses/{id}`          | Get course by ID               | Public   |
| POST   | `/api/v1/courses`               | Create course                  | Admin    |
| POST   | `/api/v1/recommendations/generate`| Generate recommendations     | Required |
| GET    | `/api/v1/recommendations/history` | Recommendation history       | Required |

## Environment Variables

### Backend (`backend/.env`)

| Variable                    | Description                          | Default              |
|-----------------------------|--------------------------------------|----------------------|
| `DATABASE_URL`              | PostgreSQL connection string         | —                    |
| `SECRET_KEY`                | JWT signing secret                   | —                    |
| `ACCESS_TOKEN_EXPIRE_MINUTES`| Access token TTL                    | 30                   |
| `CORS_ORIGINS`              | Allowed frontend origins (comma-sep) | localhost:5173     |
| `REDIS_ENABLED`             | Enable Redis caching                 | false                |

### Frontend (`frontend/.env`)

| Variable             | Description     | Default                          |
|----------------------|-----------------|----------------------------------|
| `VITE_API_URL`       | Backend API URL | http://localhost:8000/api/v1     |


## ML Recommendation Engine

The recommendation engine lives in `backend/app/ml/recommender.py`. The current implementation uses rule-based scoring as a placeholder. To integrate Scikit-learn:

1. Collect user interaction data (views, enrollments, ratings)
2. Train collaborative filtering or content-based models
3. Serialize models to `backend/app/ml/models/`
4. Update `CourseRecommender` to load and serve predictions

## Production Notes

- Change `SECRET_KEY` to a cryptographically secure random value
- Set `DEBUG=false` and `ENVIRONMENT=production`
- Use Alembic for database migrations instead of `create_all`
- Configure HTTPS and a reverse proxy (Nginx/Traefik)
- Enable Redis for caching recommendation results
- Run `npm run build` and serve frontend static files via CDN or Nginx

## Deployment (Render & Vercel)

This project is configured for easy deployment of the backend to **Render.com** and the frontend to **Vercel**.

### Backend Deployment (Render)

1. **Database Setup**:
   - Create a new **PostgreSQL** database on Render.
   - Name it `courserec-db`.

2. **Web Service Setup**:
   - Create a new **Web Service** on Render connected to your Git repository.
   - Use the **Blueprint** mode (which will automatically detect `render.yaml` at the root) OR configure the service manually:
     - **Root Directory**: `backend`
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT`
   - Set the following **Environment Variables**:
     - `DATABASE_URL`: Set automatically when linking to your Render PostgreSQL database, or provide it manually.
     - `JWT_SECRET_KEY`: A cryptographically secure random string.
     - `GEMINI_API_KEY`: Your Gemini API key.
     - `ENVIRONMENT`: `production`
     - `FRONTEND_URL`: Your Vercel frontend URL (e.g., `https://your-app.vercel.app`).

3. **Database Initialization**:
   - Run the seeding script on Render (via the Render shell or as part of a post-deploy build command) to initialize and seed the production database:
     ```bash
     python init_production.py
     ```

### Frontend Deployment (Vercel)

1. **Project Setup**:
   - Import your repository into Vercel.
   - Choose the `frontend` folder as the root directory of the project.
   - Vercel will auto-detect Vite as the framework preset.

2. **Environment Variables**:
   - Set the following environment variable in the Vercel dashboard:
     - `VITE_API_URL`: `https://your-render-backend-url.onrender.com/api/v1` (replace with your live Render backend URL).

3. **Deploy**:
   - Click **Deploy**. Vercel will build and serve your React app, automatically routing traffic to the backend API. The `vercel.json` rewrites ensure React Router works correctly on reload.

## License

MIT

