"""
CreditSense Scoring Engine
Handles feature extraction, derived ratio computations, model inference,
calibrated probability of default, FICO-scale credit score mapping,
underwriting decisions, loan limits, and improvement suggestions.
"""

import os
import joblib
import numpy as np
import pandas as pd
from typing import Tuple, List, Dict, Any
from ..config import settings
from ..models.schemas import ApplicantInput, DerivedFeatures, AssessmentResponse

# Global artifact singletons
_CALIBRATED_MODEL = None
_BASE_MODEL = None
_PREPROCESSOR = None
_EXPLAINER = None
_FEATURE_NAMES = None

def load_artifacts():
    global _CALIBRATED_MODEL, _BASE_MODEL, _PREPROCESSOR, _EXPLAINER, _FEATURE_NAMES
    if _CALIBRATED_MODEL is None:
        art_dir = settings.ARTIFACTS_DIR
        _CALIBRATED_MODEL = joblib.load(os.path.join(art_dir, "calibrated_xgb_model.joblib"))
        _BASE_MODEL = joblib.load(os.path.join(art_dir, "base_xgb_model.joblib"))
        _PREPROCESSOR = joblib.load(os.path.join(art_dir, "preprocessor.joblib"))
        _EXPLAINER = joblib.load(os.path.join(art_dir, "shap_explainer.joblib"))
        
        with open(os.path.join(art_dir, "feature_names.json"), "r") as f:
            import json
            _FEATURE_NAMES = json.load(f)

def get_calibrated_model():
    load_artifacts()
    return _CALIBRATED_MODEL

def get_preprocessor():
    load_artifacts()
    return _PREPROCESSOR

def get_explainer():
    load_artifacts()
    return _EXPLAINER

def get_feature_names():
    load_artifacts()
    return _FEATURE_NAMES

def calculate_derived_features(applicant: ApplicantInput) -> DerivedFeatures:
    """Computes automated derived ratios from raw inputs."""
    # Monthly interest rate for base loan amortization (10.5% annual rate)
    annual_rate = settings.BENCHMARK_INTEREST_RATE / 100.0
    monthly_rate = annual_rate / 12.0
    n = applicant.loan_term
    p = applicant.loan_amount
    
    # Standard Amortization formula
    if monthly_rate > 0 and n > 0:
        factor = (1.0 + monthly_rate) ** n
        estimated_emi = p * (monthly_rate * factor) / (factor - 1.0)
    else:
        estimated_emi = p / max(1, n)
        
    estimated_emi = round(estimated_emi, 2)
    
    # Financial Ratios
    dti = round(applicant.existing_debt_payments / applicant.monthly_income, 4)
    emi_to_income = round(estimated_emi / applicant.monthly_income, 4)
    total_dti = round((applicant.existing_debt_payments + estimated_emi) / applicant.monthly_income, 4)
    lti = round(applicant.loan_amount / (applicant.monthly_income * 12.0), 4)
    savings_to_loan = round(applicant.savings_balance / max(1.0, applicant.loan_amount), 4)
    disposable_income = max(
        0.0, 
        round(applicant.monthly_income - applicant.monthly_expenses - applicant.existing_debt_payments - estimated_emi, 2)
    )
    
    return DerivedFeatures(
        estimated_emi=estimated_emi,
        dti=dti,
        emi_to_income=emi_to_income,
        total_dti=total_dti,
        lti=lti,
        savings_to_loan=savings_to_loan,
        disposable_income=disposable_income
    )

def pd_to_credit_score(pd: float) -> int:
    """
    Documented Scaling Formula:
    Maps Probability of Default (PD in [0, 1]) to Credit Score on a 300-850 scale.
    Formula: Score = round(850 - 550 * (PD ** 0.60))
    - Continuous, smooth, and strictly monotonic (higher PD strictly gives lower score).
    - PD = 0.01 -> ~815 (Excellent)
    - PD = 0.04 -> ~770 (Excellent)
    - PD = 0.08 -> ~729 (Good)
    - PD = 0.14 -> ~680 (Good)
    - PD = 0.25 -> ~611 (Fair)
    - PD = 0.45 -> ~510 (Poor)
    - PD >= 0.85 -> ~350 (Very Poor)
    """
    clamped_pd = min(max(pd, 0.001), 0.999)
    raw_score = 850.0 - 550.0 * (clamped_pd ** 0.60)
    return int(round(np.clip(raw_score, 300, 850)))

def get_risk_band(score: int) -> str:
    if score >= 750:
        return "Excellent"
    elif score >= 670:
        return "Good"
    elif score >= 580:
        return "Fair"
    elif score >= 500:
        return "Poor"
    else:
        return "Very Poor"

def determine_decision(score: int, pd: float, total_dti: float) -> str:
    """Configurable rule thresholds combining score, PD, and debt ceiling."""
    if score >= settings.APPROVE_MIN_SCORE and pd <= settings.APPROVE_MAX_PD and total_dti <= 0.50:
        return "Approve"
    elif score >= settings.MANUAL_REVIEW_MIN_SCORE and pd <= settings.MANUAL_REVIEW_MAX_PD and total_dti <= 0.65:
        return "Manual Review"
    else:
        return "Reject"

def calculate_max_loan(applicant: ApplicantInput, risk_band: str) -> float:
    """Computes recommended maximum loan amount based on income and risk tier."""
    dti_caps = {
        "Excellent": 0.48,
        "Good": 0.42,
        "Fair": 0.34,
        "Poor": 0.22,
        "Very Poor": 0.00
    }
    cap = dti_caps.get(risk_band, 0.30)
    monthly_capacity = max(0.0, (applicant.monthly_income * cap) - applicant.existing_debt_payments)
    
    # Amortize capacity backwards to principal
    monthly_rate = (settings.BENCHMARK_INTEREST_RATE / 100.0) / 12.0
    n = applicant.loan_term
    if monthly_rate > 0 and n > 0 and monthly_capacity > 0:
        factor = (1.0 + monthly_rate) ** n
        max_principal = monthly_capacity * (factor - 1.0) / (monthly_rate * factor)
    else:
        max_principal = 0.0
        
    return round(np.clip(max_principal, 0.0, 5000000.0), -3)

def get_interest_rate_range(risk_band: str) -> str:
    ranges = {
        "Excellent": "8.50% - 9.99%",
        "Good": "10.00% - 12.25%",
        "Fair": "12.50% - 15.75%",
        "Poor": "16.00% - 20.50%",
        "Very Poor": "Risk Exceeds Standard Underwriting"
    }
    return ranges.get(risk_band, "12.00% - 15.00%")

def generate_improvement_suggestions(
    applicant: ApplicantInput, 
    derived: DerivedFeatures, 
    pd: float
) -> List[str]:
    """Generates 2-3 concrete, actionable recommendations."""
    suggestions = []
    
    # 1. Utilization
    if applicant.credit_utilization > 30.0:
        points = int(round((applicant.credit_utilization - 30.0) * 0.75))
        suggestions.append(
            f"Reduce revolving credit card utilization from {applicant.credit_utilization:.0f}% to under 30%. "
            f"Lowering outstanding card balances will reduce revolving exposure and can raise credit score by ~{max(15, points)} points."
        )
        
    # 2. DTI Ratio
    if derived.total_dti > 0.40:
        target_payment = round(applicant.monthly_income * 0.36)
        reduction = round(applicant.existing_debt_payments - target_payment)
        suggestions.append(
            f"Lower debt-to-income ratio from {derived.total_dti*100:.1f}% towards the safe benchmark of 36%. "
            f"Paying off ₹{max(5000, reduction):,.0f} in existing monthly debt commitments significantly improves repayment capacity."
        )
        
    # 3. Delinquency
    total_delinq = (
        applicant.past_delinquencies_30d + 
        applicant.past_delinquencies_60d + 
        applicant.past_delinquencies_90d
    )
    if total_delinq > 0:
        suggestions.append(
            "Maintain an uninterrupted on-time payment track record across all open accounts for 6 consecutive months. "
            "Recent delinquency flags decay rapidly in predictive weight as consecutive on-time payments are logged."
        )
        
    # 4. Savings buffer
    expense_buffer_months = applicant.savings_balance / max(1.0, applicant.monthly_expenses)
    if expense_buffer_months < 3.0:
        target_savings = round(applicant.monthly_expenses * 3.0)
        suggestions.append(
            f"Increase emergency savings from ₹{applicant.savings_balance:,.0f} to ₹{target_savings:,.0f} (at least 3 months of expenses). "
            "A healthy liquidity reserve provides downside insulation against income disruptions."
        )
        
    # 5. Loan tenure or amount adjustment
    if derived.lti > 0.75 and len(suggestions) < 3:
        suggested_tenure = min(84, applicant.loan_term + 12)
        suggestions.append(
            f"Consider extending the loan tenure from {applicant.loan_term} to {suggested_tenure} months. "
            "This spreads repayment obligations, reducing the monthly EMI burden by ~12-18%."
        )
        
    # Fallback if borrower is already pristine
    if len(suggestions) < 2:
        suggestions.append(
            "Maintain current low utilization and diverse active credit lines to preserve your excellent credit score standing."
        )
        
    return suggestions[:3]

def run_scoring(applicant: ApplicantInput) -> Tuple[float, int, str, str, float, str, DerivedFeatures, List[str], Any]:
    """Runs full scoring pipeline on an applicant."""
    load_artifacts()
    
    # 1. Derived features
    derived = calculate_derived_features(applicant)
    
    # 2. Prepare DataFrame for model
    # Convert credit_utilization from 0-100 to 0.0-1.0 float scale for model
    util_scaled = applicant.credit_utilization / 100.0
    
    input_row = {
        "employment_length": applicant.employment_length,
        "num_dependents": applicant.num_dependents,
        "monthly_income": applicant.monthly_income,
        "monthly_expenses": applicant.monthly_expenses,
        "existing_debt_payments": applicant.existing_debt_payments,
        "savings_balance": applicant.savings_balance,
        "credit_history_length": applicant.credit_history_length,
        "num_open_credit_lines": applicant.num_open_credit_lines,
        "past_delinquencies_30d": applicant.past_delinquencies_30d,
        "past_delinquencies_60d": applicant.past_delinquencies_60d,
        "past_delinquencies_90d": applicant.past_delinquencies_90d,
        "credit_utilization": util_scaled,
        "loan_amount": applicant.loan_amount,
        "loan_term": applicant.loan_term,
        "estimated_emi": derived.estimated_emi,
        "dti": derived.dti,
        "emi_to_income": derived.emi_to_income,
        "total_dti": derived.total_dti,
        "lti": derived.lti,
        "savings_to_loan": derived.savings_to_loan,
        "disposable_income": derived.disposable_income,
        "employment_status": applicant.employment_status,
        "loan_purpose": applicant.loan_purpose,
    }
    
    df_raw = pd.DataFrame([input_row])
    
    # 3. Transform features
    X_trans = _PREPROCESSOR.transform(df_raw)
    
    # 4. Predict calibrated PD
    # We use calibrated model
    pd_pred = float(_CALIBRATED_MODEL.predict_proba(X_trans)[0, 1])
    
    # 5. Calculate Score and Underwriting metrics
    score = pd_to_credit_score(pd_pred)
    risk_band = get_risk_band(score)
    decision = determine_decision(score, pd_pred, derived.total_dti)
    max_loan = calculate_max_loan(applicant, risk_band)
    rate_range = get_interest_rate_range(risk_band)
    suggestions = generate_improvement_suggestions(applicant, derived, pd_pred)
    
    return (
        round(pd_pred, 4),
        score,
        risk_band,
        decision,
        max_loan,
        rate_range,
        derived,
        suggestions,
        X_trans
    )
