"""
CreditSense Backend Application Entrypoint
FastAPI application with CORS, route mounts, lifecycle hooks, and health check.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .config import settings
from .models.database import init_db, seed_default_users
from .services.scoring import load_artifacts
from .routes import assess, portfolio, applications, model_insights, auth

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schema
    init_db()
    # Seed institutional demo accounts
    seed_default_users()
    # Pre-warm ML models & SHAP explainer
    load_artifacts()
    yield

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="AI Credit Risk Assessment & Macro Stress Testing Platform",
    lifespan=lifespan
)

# CORS Middleware (supports local React + Vite frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routes
app.include_router(auth.router)
app.include_router(assess.router)
app.include_router(portfolio.router)
app.include_router(applications.router)
app.include_router(model_insights.router)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.VERSION
    }

@app.get("/")
def root():
    return {
        "message": "CreditSense API is running. Access API documentation at /docs",
        "health": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=port, reload=True)
