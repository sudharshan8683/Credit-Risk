"""
CreditSense Explainability Service
Computes exact SHAP values for an applicant using TreeExplainer,
extracts top 5 driving risk factors, and synthesizes plain-English explanations.
"""

import numpy as np
import pandas as pd
from typing import List, Dict, Any
from .scoring import get_explainer, get_feature_names
from ..models.schemas import ShapFactor, ApplicantInput, DerivedFeatures

FRIENDLY_FEATURE_NAMES = {
    "total_dti": "Total Debt-to-Income Ratio",
    "dti": "Existing Debt-to-Income",
    "credit_utilization": "Credit Card Utilization",
    "credit_history_length": "Credit History Length",
    "employment_length": "Employment Stability",
    "past_delinquencies_30d": "30-Day Delinquencies",
    "past_delinquencies_60d": "60-Day Delinquencies",
    "past_delinquencies_90d": "90-Day Delinquencies",
    "savings_to_loan": "Savings-to-Loan Ratio",
    "disposable_income": "Monthly Disposable Income",
    "emi_to_income": "Loan EMI Burden",
    "loan_amount": "Loan Amount",
    "num_open_credit_lines": "Active Credit Lines",
    "num_dependents": "Number of Dependents",
    "monthly_income": "Monthly Gross Income",
    "savings_balance": "Liquid Savings Reserve",
    "employment_status_Unemployed": "Unemployment Status",
    "employment_status_Self-Employed": "Self-Employment Status",
    "loan_purpose_debt_consolidation": "Debt Consolidation Purpose",
}

def generate_plain_english_sentence(
    feature: str, 
    direction: str, 
    value: Any, 
    applicant: ApplicantInput, 
    derived: DerivedFeatures
) -> str:
    """Creates banking underwriter plain-English explanation sentence."""
    raises = (direction == "raises_risk")
    
    if "total_dti" in feature:
        pct = derived.total_dti * 100.0
        if raises:
            return f"Total debt commitments take {pct:.1f}% of monthly income, well above the prudent threshold of 36%."
        else:
            return f"Healthy total debt-to-income ratio of {pct:.1f}% leaves ample headroom for unexpected financial shocks."
            
    elif "credit_utilization" in feature:
        util = applicant.credit_utilization
        if raises:
            return f"Credit card utilization is high at {util:.0f}%, signaling heavy reliance on revolving credit lines."
        else:
            return f"Disciplined credit utilization of {util:.0f}% demonstrates responsible balance management well below 30%."
            
    elif "past_delinquencies_90d" in feature:
        count = applicant.past_delinquencies_90d
        if raises:
            return f"Recorded {count} severe 90+ day past-due delinquency in the past 24 months, indicating past default distress."
        else:
            return "Impeccable zero record of severe 90-day delinquencies across all historical credit accounts."
            
    elif "past_delinquencies_30d" in feature:
        count = applicant.past_delinquencies_30d
        if raises:
            return f"Logged {count} late payment flag(s) of 30-59 days, reflecting occasional repayment friction."
        else:
            return "Consistent on-time payment track record without recent 30-day payment lapses."
            
    elif "past_delinquencies_60d" in feature:
        count = applicant.past_delinquencies_60d
        if raises:
            return f"Has {count} 60-89 day past-due delinquency, suggesting prolonged payment delays."
        else:
            return "Clean payment history free of 60-day delinquency marks."
            
    elif "credit_history_length" in feature:
        yrs = applicant.credit_history_length
        if raises:
            return f"Limited credit bureau track record of only {yrs:.1f} years provides a short performance observation window."
        else:
            return f"Seasoned credit bureau history of {yrs:.1f} years proves long-term repayment consistency across business cycles."
            
    elif "employment_length" in feature:
        yrs = applicant.employment_length
        if raises:
            return f"Short job tenure of {yrs:.1f} years indicates early career or recent employment transition."
        else:
            return f"Established career stability with {yrs:.1f} years of steady continuous employment tenure."
            
    elif "savings_to_loan" in feature or "savings_balance" in feature:
        ratio = derived.savings_to_loan * 100.0
        if raises:
            return f"Savings buffer covers only {ratio:.1f}% of requested loan amount, leaving limited liquidity cushion."
        else:
            return f"Strong liquid cash reserves cover {ratio:.1f}% of the requested loan principal as a defensive buffer."
            
    elif "emi_to_income" in feature:
        pct = derived.emi_to_income * 100.0
        if raises:
            return f"Proposed monthly EMI would consume {pct:.1f}% of income, creating high fixed monthly obligation."
        else:
            return f"Manageable EMI of {pct:.1f}% of income fits comfortably within monthly cash flow."
            
    elif "disposable_income" in feature:
        amt = derived.disposable_income
        if raises:
            return f"Narrow uncommitted disposable cash buffer of ₹{amt:,.0f} per month creates vulnerability to inflation."
        else:
            return f"Comfortable post-obligation disposable income buffer of ₹{amt:,.0f} per month supports repayment resilience."
            
    elif "employment_status" in feature:
        status = applicant.employment_status
        if raises:
            return f"Employment status '{status}' carries higher income volatility risk in consumer lending models."
        else:
            return f"Salaried employment provides predictable, steady payroll inflows."
            
    elif "monthly_income" in feature:
        if raises:
            return f"Monthly gross income of ₹{applicant.monthly_income:,.0f} restricts overall borrowing headroom."
        else:
            return f"Solid gross monthly income of ₹{applicant.monthly_income:,.0f} provides strong debt service capacity."
            
    # Generic fallback
    friendly = FRIENDLY_FEATURE_NAMES.get(feature, feature.replace("_", " ").title())
    if raises:
        return f"{friendly} factor exhibits negative deviation from prime underwriting benchmarks."
    else:
        return f"{friendly} supports creditworthiness and strengthens credit profile stability."

def compute_shap_explanations(
    X_trans: np.ndarray, 
    applicant: ApplicantInput, 
    derived: DerivedFeatures
) -> List[ShapFactor]:
    """Computes SHAP factors and formats top 5 contributors."""
    feature_names_dict = get_feature_names()
    explainer = get_explainer()
    
    all_feature_names = feature_names_dict["transformed_feature_names"]
    
    # Compute SHAP values using TreeExplainer
    # explainer.shap_values returns raw log-odds impact
    raw_shap = explainer.shap_values(X_trans)
    
    # In binary classification, check shape
    if isinstance(raw_shap, list):
        shap_vals = raw_shap[1][0] # Positive class (Default)
    elif len(raw_shap.shape) == 2:
        shap_vals = raw_shap[0]
    else:
        shap_vals = raw_shap
        
    factors = []
    for name, val in zip(all_feature_names, shap_vals):
        val_float = float(val)
        direction = "raises_risk" if val_float > 0 else "lowers_risk"
        mag = abs(val_float)
        
        # Determine human value
        display_val = getattr(applicant, name, None)
        if display_val is None:
            display_val = getattr(derived, name, None)
        if display_val is None:
            display_val = "Active" if "employment_status" in name or "loan_purpose" in name else "N/A"
            
        sentence = generate_plain_english_sentence(name, direction, display_val, applicant, derived)
        friendly_name = FRIENDLY_FEATURE_NAMES.get(name, name.replace("_", " ").title())
        
        factors.append({
            "feature": name,
            "name": friendly_name,
            "value": str(display_val),
            "direction": direction,
            "magnitude": round(mag, 4),
            "sentence": sentence
        })
        
    # Sort by magnitude descending
    factors.sort(key=lambda x: x["magnitude"], reverse=True)
    top_5 = factors[:5]
    
    # Calculate percentage impact among top 5
    total_top_mag = sum(f["magnitude"] for f in top_5) or 1.0
    
    result = []
    for f in top_5:
        score_pct = round((f["magnitude"] / total_top_mag) * 100.0, 1)
        result.append(ShapFactor(
            feature=f["feature"],
            name=f["name"],
            value=f["value"],
            direction=f["direction"],
            magnitude=f["magnitude"],
            impact_score=score_pct,
            sentence=f["sentence"]
        ))
        
    return result
