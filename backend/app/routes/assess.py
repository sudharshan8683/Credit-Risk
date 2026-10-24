"""
CreditSense Scoring and Presets Routes
"""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from datetime import datetime
from ..models.schemas import ApplicantInput, AssessmentResponse, PresetApplicant
from ..services.scoring import run_scoring
from ..services.explainability import compute_shap_explanations
from ..models.database import save_application

router = APIRouter(prefix="/api/assess", tags=["Assessment"])

PRESETS: Dict[str, Dict[str, Any]] = {
    "safe": {
        "id": "safe",
        "name": "Priya Sharma (Prime / Safe)",
        "tagline": "Senior Software Architect, low DTI, 0 delinquencies, high savings buffer",
        "data": {
            "applicant_name": "Priya Sharma",
            "age": 38,
            "employment_status": "Employed",
            "employment_length": 11.0,
            "num_dependents": 1,
            "monthly_income": 185000.0,
            "monthly_expenses": 55000.0,
            "existing_debt_payments": 18000.0,
            "savings_balance": 1450000.0,
            "credit_history_length": 14.0,
            "num_open_credit_lines": 8,
            "past_delinquencies_30d": 0,
            "past_delinquencies_60d": 0,
            "past_delinquencies_90d": 0,
            "credit_utilization": 14.5,
            "loan_amount": 650000.0,
            "loan_term": 36,
            "loan_purpose": "home_improvement"
        }
    },
    "borderline": {
        "id": "borderline",
        "name": "Rajesh Verma (Borderline / Manual Review)",
        "tagline": "Self-employed contractor, moderate DTI, 1 past 30d delay, moderate utilization",
        "data": {
            "applicant_name": "Rajesh Verma",
            "age": 34,
            "employment_status": "Self-Employed",
            "employment_length": 4.5,
            "num_dependents": 2,
            "monthly_income": 72000.0,
            "monthly_expenses": 38000.0,
            "existing_debt_payments": 22000.0,
            "savings_balance": 85000.0,
            "credit_history_length": 5.5,
            "num_open_credit_lines": 5,
            "past_delinquencies_30d": 1,
            "past_delinquencies_60d": 0,
            "past_delinquencies_90d": 0,
            "credit_utilization": 54.0,
            "loan_amount": 350000.0,
            "loan_term": 48,
            "loan_purpose": "debt_consolidation"
        }
    },
    "risky": {
        "id": "risky",
        "name": "Amit Patel (Subprime / Risky)",
        "tagline": "High revolving card utilization (88%), multiple past delinquencies, high DTI",
        "data": {
            "applicant_name": "Amit Patel",
            "age": 27,
            "employment_status": "Employed",
            "employment_length": 1.5,
            "num_dependents": 0,
            "monthly_income": 36000.0,
            "monthly_expenses": 24000.0,
            "existing_debt_payments": 17000.0,
            "savings_balance": 12000.0,
            "credit_history_length": 2.0,
            "num_open_credit_lines": 6,
            "past_delinquencies_30d": 3,
            "past_delinquencies_60d": 1,
            "past_delinquencies_90d": 1,
            "credit_utilization": 88.5,
            "loan_amount": 250000.0,
            "loan_term": 24,
            "loan_purpose": "personal"
        }
    }
}

@router.get("/presets", response_model=List[PresetApplicant])
def get_presets():
    """Returns the three standardized sample applicants: Safe, Borderline, Risky."""
    result = []
    for k, v in PRESETS.items():
        result.append(PresetApplicant(
            id=v["id"],
            name=v["name"],
            tagline=v["tagline"],
            data=ApplicantInput(**v["data"])
        ))
    return result

@router.post("", response_model=AssessmentResponse)
def assess_applicant(applicant: ApplicantInput, auto_save: bool = True):
    """
    Evaluates credit risk for an applicant in real-time.
    Computes calibrated Probability of Default, Credit Score (300-850),
    Risk Band, Underwriting Decision, SHAP explanations, and Actionable Suggestions.
    """
    try:
        (
            pd_val,
            score,
            risk_band,
            decision,
            max_loan,
            rate_range,
            derived,
            suggestions,
            X_trans
        ) = run_scoring(applicant)
        
        # Explainability via TreeSHAP
        shap_factors = compute_shap_explanations(X_trans, applicant, derived)
        
        now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        
        response_dict = {
            "applicant_name": applicant.applicant_name,
            "probability_of_default": pd_val,
            "credit_score": score,
            "risk_band": risk_band,
            "decision": decision,
            "recommended_max_loan_amount": max_loan,
            "suggested_interest_rate_range": rate_range,
            "derived_features": derived.model_dump(),
            "top_5_shap_factors": [sf.model_dump() for sf in shap_factors],
            "what_would_improve_this_score": suggestions,
            "applicant": applicant.model_dump(),
            "created_at": now_str
        }
        
        app_id = None
        if auto_save:
            app_id = save_application(
                applicant_name=applicant.applicant_name,
                age=applicant.age,
                monthly_income=applicant.monthly_income,
                loan_amount=applicant.loan_amount,
                loan_purpose=applicant.loan_purpose,
                credit_score=score,
                risk_band=risk_band,
                decision=decision,
                probability_of_default=pd_val,
                dti=derived.total_dti,
                input_data=applicant.model_dump(),
                result_data=response_dict,
                created_at=now_str
            )
            response_dict["id"] = app_id
            
        return AssessmentResponse(**response_dict)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Assessment scoring failed: {str(e)}")
