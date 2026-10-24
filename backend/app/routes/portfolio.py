"""
CreditSense Portfolio Analytics & Macroeconomic Stress Testing Routes
"""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from collections import defaultdict
from ..models.schemas import (
    PortfolioStatsResponse, PortfolioKpis, StressTestRequest, StressTestResponse, RiskMigrationTier
)
from ..models.database import get_all_applications_for_stats
from ..services.scoring import (
    get_calibrated_model, get_preprocessor, pd_to_credit_score, get_risk_band
)

router = APIRouter(prefix="/api/portfolio", tags=["Portfolio"])

@router.get("/stats", response_model=PortfolioStatsResponse)
def get_portfolio_stats():
    """Returns high-level portfolio KPIs, risk distributions, and historical timeline."""
    apps = get_all_applications_for_stats()
    
    if not apps:
        # Return sensible empty defaults
        return PortfolioStatsResponse(
            kpis=PortfolioKpis(
                total_applications=0,
                approval_rate=0.0,
                average_credit_score=0,
                expected_default_rate=0.0
            ),
            risk_band_distribution=[],
            score_distribution=[],
            timeline=[]
        )
        
    total_apps = len(apps)
    approvals = sum(1 for a in apps if a["decision"] == "Approve")
    app_rate = round((approvals / total_apps) * 100.0, 1)
    
    scores = [a["credit_score"] for a in apps]
    avg_score = int(round(np.mean(scores)))
    
    pds = [a["probability_of_default"] for a in apps]
    avg_pd = round(float(np.mean(pds)) * 100.0, 2)
    
    # 1. Risk Band Distribution
    risk_counts = defaultdict(int)
    for a in apps:
        risk_counts[a["risk_band"]] += 1
        
    order = ["Excellent", "Good", "Fair", "Poor", "Very Poor"]
    band_colors = {
        "Excellent": "#FFFFFF",
        "Good": "#D4D4D8",
        "Fair": "#A1A1AA",
        "Poor": "#71717A",
        "Very Poor": "#3F3F46"
    }
    
    risk_band_dist = [
        {
            "name": band,
            "count": risk_counts[band],
            "percentage": round((risk_counts[band] / total_apps) * 100.0, 1),
            "color": band_colors.get(band, "#64748B")
        }
        for band in order
    ]
    
    # 2. Score Distribution (Buckets of 50 points from 300 to 850)
    score_buckets = [
        {"range": "300-499", "min": 300, "max": 499, "count": 0},
        {"range": "500-579", "min": 500, "max": 579, "count": 0},
        {"range": "580-649", "min": 580, "max": 649, "count": 0},
        {"range": "650-699", "min": 650, "max": 699, "count": 0},
        {"range": "700-749", "min": 700, "max": 749, "count": 0},
        {"range": "750-799", "min": 750, "max": 799, "count": 0},
        {"range": "800-850", "min": 800, "max": 850, "count": 0},
    ]
    for s in scores:
        for b in score_buckets:
            if b["min"] <= s <= b["max"]:
                b["count"] += 1
                break
                
    # 3. Monthly Timeline (Approvals vs Rejections vs Manual Review)
    time_map = defaultdict(lambda: {"approved": 0, "rejected": 0, "manual_review": 0, "total": 0})
    for a in apps:
        date_str = str(a.get("created_at", ""))[:7] # YYYY-MM
        if not date_str or len(date_str) < 7:
            date_str = "Recent"
        dec = a["decision"]
        time_map[date_str]["total"] += 1
        if dec == "Approve":
            time_map[date_str]["approved"] += 1
        elif dec == "Reject":
            time_map[date_str]["rejected"] += 1
        else:
            time_map[date_str]["manual_review"] += 1
            
    timeline = []
    for month in sorted(time_map.keys()):
        stats = time_map[month]
        timeline.append({
            "period": month,
            "approved": stats["approved"],
            "rejected": stats["rejected"],
            "manual_review": stats["manual_review"],
            "total": stats["total"],
            "approval_rate": round((stats["approved"] / stats["total"]) * 100.0, 1) if stats["total"] else 0.0
        })
        
    return PortfolioStatsResponse(
        kpis=PortfolioKpis(
            total_applications=total_apps,
            approval_rate=app_rate,
            average_credit_score=avg_score,
            expected_default_rate=avg_pd
        ),
        risk_band_distribution=risk_band_dist,
        score_distribution=score_buckets,
        timeline=timeline
    )

@router.post("/stress-test", response_model=StressTestResponse)
def run_macro_stress_test(req: StressTestRequest):
    """
    Simulates macroeconomic stress on the active loan portfolio:
    - Income Shock (-30% to 0%)
    - Interest Rate Rise (0 to +500 bps / +5.0%)
    - Unemployment Rise (0% to +10%)
    Calculates before/after default rates, migration between risk bands,
    and produces a plain-English systemic risk assessment.
    """
    apps = get_all_applications_for_stats()
    if not apps:
        raise HTTPException(status_code=400, detail="Portfolio database is empty. Seed or submit applications first.")
        
    calibrated_model = get_calibrated_model()
    preprocessor = get_preprocessor()
    
    # Baseline stats
    baseline_pds = [a["probability_of_default"] for a in apps]
    baseline_default_rate = float(np.mean(baseline_pds))
    
    before_tiers = defaultdict(int)
    for a in apps:
        before_tiers[a["risk_band"]] += 1
        
    # Stress parameters
    income_multiplier = 1.0 + (req.income_shock_pct / 100.0) # e.g. 0.80 for -20%
    rate_rise_annual = req.interest_rate_rise_bps / 10000.0 # e.g. 0.02 for +200 bps
    unemployment_prob = req.unemployment_rise_pct / 100.0
    
    np.random.seed(101) # Stable simulation per request
    
    stressed_pds = []
    after_tiers = defaultdict(int)
    
    for a in apps:
        inp = a["input_data"]
        
        # 1. Apply Income Shock
        stressed_income = max(10000.0, inp["monthly_income"] * income_multiplier)
        
        # 2. Apply Interest Rate Rise to EMI and debt commitments
        current_rate = 0.105 + rate_rise_annual
        monthly_rate = current_rate / 12.0
        n = inp["loan_term"]
        p = inp["loan_amount"]
        if monthly_rate > 0 and n > 0:
            factor = (1.0 + monthly_rate) ** n
            stressed_emi = p * (monthly_rate * factor) / (factor - 1.0)
        else:
            stressed_emi = p / max(1, n)
            
        # Existing debt increases slightly if floating rate
        stressed_existing_debt = inp["existing_debt_payments"] * (1.0 + rate_rise_annual * 0.8)
        
        # 3. Unemployment shock: randomly switch a fraction of employed to Unemployed
        is_shocked_unemployed = (
            inp.get("employment_status") in ["Employed", "Self-Employed"] 
            and np.random.uniform(0, 1) < unemployment_prob
        )
        stressed_emp_status = "Unemployed" if is_shocked_unemployed else inp["employment_status"]
        if is_shocked_unemployed:
            stressed_income = max(5000.0, stressed_income * 0.35) # Job loss drops income severely
            
        # Re-derive ratios
        stressed_total_dti = (stressed_existing_debt + stressed_emi) / stressed_income
        stressed_emi_to_income = stressed_emi / stressed_income
        stressed_dti = stressed_existing_debt / stressed_income
        stressed_lti = p / (stressed_income * 12.0)
        stressed_disposable = max(0.0, stressed_income - inp["monthly_expenses"] - stressed_existing_debt - stressed_emi)
        stressed_savings_to_loan = inp["savings_balance"] / max(1.0, p)
        
        # Build stressed feature vector
        stressed_row = {
            "employment_length": inp["employment_length"] if not is_shocked_unemployed else 0.0,
            "num_dependents": inp["num_dependents"],
            "monthly_income": stressed_income,
            "monthly_expenses": inp["monthly_expenses"],
            "existing_debt_payments": stressed_existing_debt,
            "savings_balance": inp["savings_balance"],
            "credit_history_length": inp["credit_history_length"],
            "num_open_credit_lines": inp["num_open_credit_lines"],
            "past_delinquencies_30d": inp["past_delinquencies_30d"],
            "past_delinquencies_60d": inp["past_delinquencies_60d"],
            "past_delinquencies_90d": inp["past_delinquencies_90d"],
            "credit_utilization": inp["credit_utilization"] / 100.0,
            "loan_amount": p,
            "loan_term": n,
            "estimated_emi": stressed_emi,
            "dti": stressed_dti,
            "emi_to_income": stressed_emi_to_income,
            "total_dti": stressed_total_dti,
            "lti": stressed_lti,
            "savings_to_loan": stressed_savings_to_loan,
            "disposable_income": stressed_disposable,
            "employment_status": stressed_emp_status,
            "loan_purpose": inp["loan_purpose"],
        }
        
        df_stressed = preprocessor.transform(pd.DataFrame([stressed_row]))
        new_pd = float(calibrated_model.predict_proba(df_stressed)[0, 1])
        stressed_pds.append(new_pd)
        
        new_score = pd_to_credit_score(new_pd)
        new_band = get_risk_band(new_score)
        after_tiers[new_band] += 1
        
    stressed_default_rate = float(np.mean(stressed_pds))
    default_delta = stressed_default_rate - baseline_default_rate
    
    order = ["Excellent", "Good", "Fair", "Poor", "Very Poor"]
    migration = []
    total_degraded = 0
    for tier in order:
        b_cnt = before_tiers[tier]
        a_cnt = after_tiers[tier]
        diff = a_cnt - b_cnt
        if tier in ["Fair", "Poor", "Very Poor"] and diff > 0:
            total_degraded += diff
        migration.append(RiskMigrationTier(
            tier=tier,
            before_count=b_cnt,
            after_count=a_cnt,
            delta=diff
        ))
        
    # Generate Plain-English Systemic Impact Narrative
    income_txt = f"{abs(req.income_shock_pct):.0f}% household income contraction" if req.income_shock_pct < 0 else "stable income"
    rate_txt = f"+{req.interest_rate_rise_bps/100:.2f}% policy rate hike" if req.interest_rate_rise_bps > 0 else "flat interest rates"
    unemp_txt = f"+{req.unemployment_rise_pct:.1f}% surge in unemployment" if req.unemployment_rise_pct > 0 else "normal employment"
    
    if default_delta >= 0.05 or total_degraded >= 30:
        severity = "Severe Capital Strain"
        action = "Recommended action: Tighten origination DTI ceilings from 45% to 35%, enforce mandatory liquid asset verification, and build a counter-cyclical capital buffer."
    elif default_delta >= 0.02 or total_degraded >= 15:
        severity = "Moderate Portfolio Vulnerability"
        action = "Recommended action: Increase loss provisioning by 18-25% and mandate manual review for borderline applicants in cyclically sensitive industries."
    else:
        severity = "Manageable Systemic Risk"
        action = "Recommended action: Current credit quality and loss reserves are resilient to this stress scenario."
        
    narrative = (
        f"Under simulated conditions of a {income_txt}, {rate_txt}, and {unemp_txt}, "
        f"portfolio expected default rate climbs from {baseline_default_rate*100:.2f}% to {stressed_default_rate*100:.2f}% "
        f"(+{default_delta*100:.2f} percentage points). Approximately {total_degraded} loans migrate into lower credit quality tiers. "
        f"Systemic Risk Assessment: {severity}. {action}"
    )
    
    return StressTestResponse(
        baseline_default_rate=round(baseline_default_rate * 100.0, 2),
        stressed_default_rate=round(stressed_default_rate * 100.0, 2),
        default_rate_delta=round(default_delta * 100.0, 2),
        total_loans_evaluated=len(apps),
        risk_migration=migration,
        systemic_risk_impact=narrative
    )
