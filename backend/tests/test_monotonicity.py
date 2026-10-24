"""
Test Suite: Scoring Engine Monotonicity Invariance
Verifies that degrading risk factors (higher debt, higher delinquencies, higher utilization)
never produces a higher credit score, and strengthening factors (income, savings) never lowers it.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

BASE_APPLICANT = {
    "applicant_name": "Monotonicity Test Candidate",
    "age": 36,
    "employment_status": "Employed",
    "employment_length": 6.0,
    "num_dependents": 1,
    "monthly_income": 80000.0,
    "monthly_expenses": 35000.0,
    "existing_debt_payments": 16000.0,
    "savings_balance": 250000.0,
    "credit_history_length": 8.0,
    "num_open_credit_lines": 6,
    "past_delinquencies_30d": 0,
    "past_delinquencies_60d": 0,
    "past_delinquencies_90d": 0,
    "credit_utilization": 22.0,
    "loan_amount": 400000.0,
    "loan_term": 36,
    "loan_purpose": "home_improvement"
}

def test_monotonicity_delinquencies():
    """Increasing past 30-day delinquencies must not produce a better score."""
    scores = []
    for d30 in [0, 1, 2, 4]:
        payload = dict(BASE_APPLICANT)
        payload["past_delinquencies_30d"] = d30
        res = client.post("/api/assess?auto_save=false", json=payload)
        assert res.status_code == 200
        score = res.json()["credit_score"]
        scores.append(score)
        
    print(f"Delinquency monotonicity scores: {scores}")
    for i in range(len(scores) - 1):
        assert scores[i] >= scores[i+1], f"Score increased when delinquencies worsened! {scores}"

def test_monotonicity_credit_utilization():
    """Increasing revolving credit utilization must not produce a better score."""
    scores = []
    for util in [10.0, 30.0, 60.0, 92.0]:
        payload = dict(BASE_APPLICANT)
        payload["credit_utilization"] = util
        res = client.post("/api/assess?auto_save=false", json=payload)
        assert res.status_code == 200
        score = res.json()["credit_score"]
        scores.append(score)
        
    print(f"Utilization monotonicity scores: {scores}")
    for i in range(len(scores) - 1):
        assert scores[i] >= scores[i+1], f"Score increased when utilization rose! {scores}"

def test_monotonicity_debt_payments():
    """Increasing existing debt payments (higher DTI) must not produce a better score."""
    scores = []
    for debt in [5000.0, 15000.0, 30000.0, 48000.0]:
        payload = dict(BASE_APPLICANT)
        payload["existing_debt_payments"] = debt
        res = client.post("/api/assess?auto_save=false", json=payload)
        assert res.status_code == 200
        score = res.json()["credit_score"]
        scores.append(score)
        
    print(f"DTI monotonicity scores: {scores}")
    for i in range(len(scores) - 1):
        assert scores[i] >= scores[i+1], f"Score increased when debt payments increased! {scores}"

def test_monotonicity_monthly_income():
    """Increasing monthly income must not produce a worse score."""
    scores = []
    for inc in [35000.0, 65000.0, 120000.0, 250000.0]:
        payload = dict(BASE_APPLICANT)
        payload["monthly_income"] = inc
        res = client.post("/api/assess?auto_save=false", json=payload)
        assert res.status_code == 200
        score = res.json()["credit_score"]
        scores.append(score)
        
    print(f"Income monotonicity scores: {scores}")
    for i in range(len(scores) - 1):
        assert scores[i] <= scores[i+1], f"Score degraded when income increased! {scores}"

def test_monotonicity_savings_balance():
    """Increasing liquid savings buffer must not produce a worse score."""
    scores = []
    for sav in [10000.0, 100000.0, 500000.0, 1500000.0]:
        payload = dict(BASE_APPLICANT)
        payload["savings_balance"] = sav
        res = client.post("/api/assess?auto_save=false", json=payload)
        assert res.status_code == 200
        score = res.json()["credit_score"]
        scores.append(score)
        
    print(f"Savings monotonicity scores: {scores}")
    for i in range(len(scores) - 1):
        assert scores[i] <= scores[i+1], f"Score degraded when savings increased! {scores}"
