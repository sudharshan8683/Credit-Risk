"""
CreditSense Backend Configuration
"""

import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "CreditSense AI Risk Assessment"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Paths
    BASE_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    DB_PATH: str = os.path.join(BASE_DIR, "creditsense.db")
    ML_DIR: str = os.path.join(BASE_DIR, "ml")
    ARTIFACTS_DIR: str = os.path.join(ML_DIR, "artifacts")
    
    # Underwriting Thresholds (Configurable)
    # Decision Boundaries based on Credit Score (300-850 scale) and PD (Probability of Default)
    APPROVE_MIN_SCORE: int = 670
    APPROVE_MAX_PD: float = 0.14
    
    MANUAL_REVIEW_MIN_SCORE: int = 580
    MANUAL_REVIEW_MAX_PD: float = 0.32
    
    # Risk Bands
    # Excellent: 750-850 (PD < 4%)
    # Good:      670-749 (4% <= PD < 14%)
    # Fair:      580-669 (14% <= PD < 32%)
    # Poor:      500-579 (32% <= PD < 55%)
    # Very Poor: 300-499 (PD >= 55%)
    
    # Base Interest Rate Benchmark (Annual %)
    BENCHMARK_INTEREST_RATE: float = 10.5
    
    # Authentication Security
    JWT_SECRET: str = "creditsense-super-secret-risk-auth-key-2026-secure"
    TOKEN_EXPIRE_HOURS: int = 72
    
    class Config:
        env_file = ".env"

settings = Settings()
