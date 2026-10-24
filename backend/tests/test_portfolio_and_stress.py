"""
Test Suite: Portfolio Analytics, Stress Test Simulation, Ledger & PDF Export
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_portfolio_stats():
    res = client.get("/api/portfolio/stats")
    assert res.status_code == 200
    data = res.json()
    
    kpis = data["kpis"]
    assert kpis["total_applications"] >= 200
    assert 0.0 <= kpis["approval_rate"] <= 100.0
    assert 300 <= kpis["average_credit_score"] <= 850
    assert kpis["expected_default_rate"] > 0.0
    
    assert len(data["risk_band_distribution"]) == 5
    assert len(data["score_distribution"]) >= 5
    assert len(data["timeline"]) >= 1

def test_macroeconomic_stress_test():
    payload = {
        "income_shock_pct": -20.0,
        "interest_rate_rise_bps": 250.0,
        "unemployment_rise_pct": 5.0
    }
    res = client.post("/api/portfolio/stress-test", json=payload)
    assert res.status_code == 200
    data = res.json()
    
    assert data["stressed_default_rate"] > data["baseline_default_rate"]
    assert data["default_rate_delta"] > 0
    assert len(data["risk_migration"]) == 5
    assert "Systemic Risk Assessment" in data["systemic_risk_impact"]

def test_applications_list_and_filter():
    # 1. All
    res = client.get("/api/applications?page=1&page_size=10")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 200
    assert len(data["applications"]) == 10
    
    first_id = data["applications"][0]["id"]
    
    # 2. Filter by decision
    res_app = client.get("/api/applications?decision=Approve&page=1&page_size=10")
    assert res_app.status_code == 200
    for a in res_app.json()["applications"]:
        assert a["decision"] == "Approve"
        
    # 3. Single application drawer detail
    res_detail = client.get(f"/api/applications/{first_id}")
    assert res_detail.status_code == 200
    detail = res_detail.json()
    assert detail["id"] == first_id
    assert "top_5_shap_factors" in detail
    assert "derived_features" in detail
    assert "what_would_improve_this_score" in detail

def test_pdf_report_export():
    # Get first app
    res = client.get("/api/applications?page=1&page_size=1")
    first_id = res.json()["applications"][0]["id"]
    
    pdf_res = client.get(f"/api/applications/{first_id}/export-pdf")
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    # PDF magic bytes %PDF-
    assert pdf_res.content[:5] == b"%PDF-"
    assert len(pdf_res.content) > 1000 # Non-trivial PDF size

def test_model_metrics_and_fairness():
    # Metrics
    res_metrics = client.get("/api/model/metrics")
    assert res_metrics.status_code == 200
    metrics = res_metrics.json()
    assert len(metrics["model_comparison"]) == 2
    assert metrics["selected_model"] == "XGBoost Classifier"
    assert len(metrics["roc_curve"]) >= 5
    assert len(metrics["top_feature_importance"]) >= 5
    
    # Fairness
    res_fairness = client.get("/api/model/fairness")
    assert res_fairness.status_code == 200
    fairness = res_fairness.json()
    assert len(fairness["age_bands"]) == 5
    assert "human_decision_disclaimer" in fairness
