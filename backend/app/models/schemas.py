"""
CreditSense - Pydantic Schemas
Defines request and response validation models for the scoring engine,
presets, stress testing, applications list, and model insights.
"""

from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field, field_validator
from datetime import datetime

class ApplicantInput(BaseModel):
    applicant_name: str = Field(default="Applicant", description="Applicant Full Name")
    
    # Personal
    age: int = Field(..., ge=18, le=95, description="Applicant Age in years")
    employment_status: Literal["Employed", "Self-Employed", "Retired", "Unemployed"] = Field(
        ..., description="Current employment status"
    )
    employment_length: float = Field(..., ge=0.0, le=55.0, description="Employment duration in years")
    num_dependents: int = Field(..., ge=0, le=10, description="Number of financial dependents")
    
    # Financial
    monthly_income: float = Field(..., gt=0, description="Monthly gross income in INR")
    monthly_expenses: float = Field(..., ge=0, description="Monthly recurring living expenses in INR")
    existing_debt_payments: float = Field(..., ge=0, description="Total existing monthly debt/EMI payments in INR")
    savings_balance: float = Field(..., ge=0, description="Total liquid savings and deposits balance in INR")
    
    # Credit Bureau
    credit_history_length: float = Field(..., ge=0.0, le=60.0, description="Credit history length in years")
    num_open_credit_lines: int = Field(..., ge=0, le=40, description="Number of currently active credit accounts")
    past_delinquencies_30d: int = Field(..., ge=0, le=20, description="Number of 30-59 day delinquencies in last 2 years")
    past_delinquencies_60d: int = Field(..., ge=0, le=15, description="Number of 60-89 day delinquencies in last 2 years")
    past_delinquencies_90d: int = Field(..., ge=0, le=15, description="Number of 90+ day delinquencies in last 2 years")
    credit_utilization: float = Field(
        ..., ge=0.0, le=100.0, description="Revolving credit card utilization percentage (0-100)"
    )
    
    # Loan Requested
    loan_amount: float = Field(..., gt=0, description="Requested principal loan amount in INR")
    loan_term: int = Field(..., ge=6, le=120, description="Requested repayment tenure in months")
    loan_purpose: Literal[
        "debt_consolidation", "home_improvement", "business", 
        "auto", "education", "personal"
    ] = Field(..., description="Purpose of loan")

    @field_validator("monthly_expenses")
    @classmethod
    def validate_expenses(cls, v, info):
        # Monthly expenses shouldn't exceed 2x income for reasonable inputs, but allowed
        return v

class DerivedFeatures(BaseModel):
    estimated_emi: float
    dti: float
    emi_to_income: float
    total_dti: float
    lti: float
    savings_to_loan: float
    disposable_income: float

class ShapFactor(BaseModel):
    feature: str
    name: str
    value: Any
    direction: Literal["raises_risk", "lowers_risk"]
    magnitude: float
    impact_score: float # Percentage weight out of 100% of top factors
    sentence: str

class AssessmentResponse(BaseModel):
    id: Optional[int] = None
    applicant_name: str
    probability_of_default: float
    credit_score: int
    risk_band: Literal["Excellent", "Good", "Fair", "Poor", "Very Poor"]
    decision: Literal["Approve", "Manual Review", "Reject"]
    recommended_max_loan_amount: float
    suggested_interest_rate_range: str
    derived_features: DerivedFeatures
    top_5_shap_factors: List[ShapFactor]
    what_would_improve_this_score: List[str]
    applicant: ApplicantInput
    created_at: str

class PresetApplicant(BaseModel):
    id: str
    name: str
    tagline: str
    data: ApplicantInput

# Portfolio Stress Test
class StressTestRequest(BaseModel):
    income_shock_pct: float = Field(..., ge=-30.0, le=0.0, description="Income shock percentage (-30% to 0%)")
    interest_rate_rise_bps: float = Field(..., ge=0.0, le=500.0, description="Interest rate increase in bps (0 to +5%)")
    unemployment_rise_pct: float = Field(..., ge=0.0, le=10.0, description="Unemployment rate increase (0% to +10%)")

class RiskMigrationTier(BaseModel):
    tier: str
    before_count: int
    after_count: int
    delta: int

class StressTestResponse(BaseModel):
    baseline_default_rate: float
    stressed_default_rate: float
    default_rate_delta: float
    total_loans_evaluated: int
    risk_migration: List[RiskMigrationTier]
    systemic_risk_impact: str

# Portfolio Overview
class PortfolioKpis(BaseModel):
    total_applications: int
    approval_rate: float
    average_credit_score: int
    expected_default_rate: float

class PortfolioStatsResponse(BaseModel):
    kpis: PortfolioKpis
    risk_band_distribution: List[Dict[str, Any]]
    score_distribution: List[Dict[str, Any]]
    timeline: List[Dict[str, Any]]

# Applications Table
class ApplicationSummary(BaseModel):
    id: int
    applicant_name: str
    age: int
    monthly_income: float
    loan_amount: float
    loan_purpose: str
    credit_score: int
    risk_band: str
    decision: str
    probability_of_default: float
    dti: float
    created_at: str

class ApplicationsListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    applications: List[ApplicationSummary]

# User Authentication Schemas
class UserRegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=30)
    email: str = Field(..., min_length=5, max_length=100)
    password: str = Field(..., min_length=6, max_length=128)
    full_name: str = Field(..., min_length=2, max_length=100)
    role: str = Field(default="Senior Underwriter", max_length=50)

class UserLoginRequest(BaseModel):
    username_or_email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=1)

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    role: str
    created_at: Optional[str] = None

class AuthResponse(BaseModel):
    token: str
    user: UserResponse
    message: str = "Authentication successful"

class DemoAccount(BaseModel):
    username: str
    email: str
    full_name: str
    role: str
    password: str
