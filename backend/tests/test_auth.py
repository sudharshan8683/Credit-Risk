"""
Unit & Integration Tests for CreditSense Authentication & User Management
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_demo_accounts_endpoint():
    res = client.get("/api/auth/demo-accounts")
    assert res.status_code == 200
    accounts = res.json()
    assert len(accounts) >= 3
    usernames = [a["username"] for a in accounts]
    assert "officer" in usernames
    assert "cro" in usernames
    assert "analyst" in usernames

def test_login_demo_officer_success():
    res = client.post("/api/auth/login", json={
        "username_or_email": "officer",
        "password": "password123"
    })
    assert res.status_code == 200
    data = res.json()
    assert "token" in data
    assert data["user"]["username"] == "officer"
    assert data["user"]["full_name"] == "Sarah Jenkins"
    assert "Senior Credit Officer" in data["user"]["role"]

def test_login_invalid_password():
    res = client.post("/api/auth/login", json={
        "username_or_email": "officer",
        "password": "wrongpassword"
    })
    assert res.status_code == 401

def test_login_nonexistent_user():
    res = client.post("/api/auth/login", json={
        "username_or_email": "nonexistent_officer_99",
        "password": "password123"
    })
    assert res.status_code == 401

def test_get_current_user_profile():
    # Login first
    login_res = client.post("/api/auth/login", json={
        "username_or_email": "cro",
        "password": "password123"
    })
    token = login_res.json()["token"]
    
    # Fetch profile
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    profile = me_res.json()
    assert profile["username"] == "cro"
    assert profile["full_name"] == "Marcus Vance"
    assert profile["role"] == "Chief Risk Officer"

def test_register_new_user_flow():
    import uuid
    unique_suffix = uuid.uuid4().hex[:6]
    username = f"analyst_{unique_suffix}"
    email = f"analyst_{unique_suffix}@creditsense.bank"
    
    res = client.post("/api/auth/register", json={
        "username": username,
        "email": email,
        "password": "SecurePassword123!",
        "full_name": "Test Underwriting Analyst",
        "role": "Credit Risk Analyst"
    })
    assert res.status_code == 201
    data = res.json()
    assert "token" in data
    assert data["user"]["username"] == username
    assert data["user"]["email"] == email
    
    # Verify the new user can log in with those credentials
    login_res = client.post("/api/auth/login", json={
        "username_or_email": username,
        "password": "SecurePassword123!"
    })
    assert login_res.status_code == 200
    assert login_res.json()["user"]["username"] == username
