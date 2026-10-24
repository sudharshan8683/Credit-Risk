"""
Test Suite: CreditSense Scoring Engine & Preset Applicants
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.scoring import (
    calculate_derived_features, pd_to_credit_score, get_risk_band
)
from backend.app.models.schemas import ApplicantInput

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_presets_availability():
    response = client.get("/api/assess/presets")
    assert response.status_code == 200
    presets = response.json()
    assert len(presets) == 3
    preset_ids = [p["id"] for p in presets]
    assert "safe" in preset_ids
    assert "borderline" in preset_ids
    assert "risky" in preset_ids

def test_safe_preset_assessment():
    response = client.get("/api/assess/presets")
    presets = {p["id"]: p["data"] for p in response.json()}
    safe_data = presets["safe"]
    
    res = client.post("/api/assess", json=safe_data)
    assert res.status_code == 200
    data = res.json()
    
    assert data["credit_score"] >= 720
    assert data["decision"] == "Approve"
    assert data["risk_band"] in ["Excellent", "Good"]
    assert data["probability_of_default"] < 0.12
    assert len(data["top_5_shap_factors"]) == 5
    assert len(data["what_would_improve_this_score"]) >= 1

def test_risky_preset_assessment():
    response = client.get("/api/assess/presets")
    presets = {p["id"]: p["data"] for p in response.json()}
    risky_data = presets["risky"]
    
    res = client.post("/api/assess", json=risky_data)
    assert res.status_code == 200
    data = res.json()
    
    assert data["credit_score"] < 580
    assert data["decision"] == "Reject"
    assert data["risk_band"] in ["Poor", "Very Poor"]
    assert data["probability_of_default"] >= 0.25
    assert len(data["top_5_shap_factors"]) == 5

def test_borderline_preset_assessment():
    response = client.get("/api/assess/presets")
    presets = {p["id"]: p["data"] for p in response.json()}
    borderline_data = presets["borderline"]
    
    res = client.post("/api/assess", json=borderline_data)
    assert res.status_code == 200
    data = res.json()
    
    assert 550 <= data["credit_score"] <= 720
    assert data["decision"] in ["Manual Review", "Approve"]
    assert data["probability_of_default"] > 0.05
    assert len(data["top_5_shap_factors"]) == 5
    assert len(data["what_would_improve_this_score"]) >= 2

def test_derived_features_calculation():
    inp = ApplicantInput(
        applicant_name="Test User",
        age=35,
        employment_status="Employed",
        employment_length=5.0,
        num_dependents=1,
        monthly_income=100000.0,
        monthly_expenses=40000.0,
        existing_debt_payments=20000.0,
        savings_balance=300000.0,
        credit_history_length=8.0,
        num_open_credit_lines=5,
        past_delinquencies_30d=0,
        past_delinquencies_60d=0,
        past_delinquencies_90d=0,
        credit_utilization=25.0,
        loan_amount=500000.0,
        loan_term=36,
        loan_purpose="debt_consolidation"
    )
    derived = calculate_derived_features(inp)
    assert derived.dti == 0.20
    assert derived.estimated_emi > 15000.0 # ~16250 at 10.5%
    assert derived.total_dti > 0.35
    assert derived.lti == round(500000.0 / (100000.0 * 12.0), 4)
    assert derived.savings_to_loan == 0.60
    assert derived.disposable_income > 0

def test_scoring_scaling_formula():
    # Strict bounds
    assert pd_to_credit_score(0.001) >= 830
    assert pd_to_credit_score(0.01) >= 800
    assert pd_to_credit_score(0.05) >= 740
    assert pd_to_credit_score(0.15) >= 650
    assert pd_to_credit_score(0.35) <= 580
    assert pd_to_credit_score(0.70) <= 450
    assert pd_to_credit_score(0.99) >= 300
