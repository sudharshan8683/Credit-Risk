"""
CreditSense Database Seeder
Seeds SQLite database with 220 realistic past assessments spanning the last 6 months
so the dashboard and application ledger are fully populated on first launch.
"""

import os
import sys
import random
from datetime import datetime, timedelta
import numpy as np

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.models.database import init_db, save_application, get_db_connection
from backend.app.models.schemas import ApplicantInput
from backend.app.services.scoring import run_scoring
from backend.app.services.explainability import compute_shap_explanations

FIRST_NAMES = [
    "Aarav", "Priya", "Rahul", "Ananya", "Rohan", "Sneha", "Aditya", "Neha",
    "Vikram", "Pooja", "Arjun", "Kavita", "Siddharth", "Meera", "Karan", "Divya",
    "Manish", "Ritu", "Gaurav", "Sunita", "Amit", "Swati", "Nikhil", "Shreya",
    "Sanjay", "Anjali", "Harsh", "Deepika", "Varun", "Tanvi", "Akash", "Preeti"
]

LAST_NAMES = [
    "Sharma", "Verma", "Patel", "Singh", "Gupta", "Kumar", "Mehta", "Reddy",
    "Nair", "Iyer", "Chopra", "Joshi", "Bose", "Rao", "Malhotra", "Kapoor",
    "Mukherjee", "Das", "Menon", "Saxena", "Deshmukh", "Kulkarni", "Agarwal"
]

PURPOSES = ["debt_consolidation", "home_improvement", "business", "auto", "education", "personal"]
PURPOSE_WEIGHTS = [0.35, 0.25, 0.15, 0.12, 0.08, 0.05]

def generate_applicant(idx: int, profile: str) -> ApplicantInput:
    name = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
    purpose = random.choices(PURPOSES, weights=PURPOSE_WEIGHTS)[0]
    
    if profile == "excellent":
        age = random.randint(32, 62)
        emp_len = round(random.uniform(5.0, 20.0), 1)
        income = round(random.uniform(120000, 350000), -3)
        expenses = round(income * random.uniform(0.35, 0.50), -2)
        debt = round(income * random.uniform(0.05, 0.18), -2)
        savings = round(income * random.uniform(5.0, 15.0), -3)
        history = round(random.uniform(8.0, 25.0), 1)
        lines = random.randint(6, 15)
        d30, d60, d90 = 0, 0, 0
        util = round(random.uniform(5.0, 25.0), 1)
        loan_amt = round(random.uniform(300000, 1500000), -4)
        term = random.choice([24, 36, 48, 60])
        status = "Employed"
        dependents = random.randint(0, 2)
        
    elif profile == "good":
        age = random.randint(26, 55)
        emp_len = round(random.uniform(3.0, 12.0), 1)
        income = round(random.uniform(70000, 160000), -3)
        expenses = round(income * random.uniform(0.40, 0.60), -2)
        debt = round(income * random.uniform(0.15, 0.28), -2)
        savings = round(income * random.uniform(2.0, 6.0), -3)
        history = round(random.uniform(4.0, 14.0), 1)
        lines = random.randint(4, 10)
        d30 = 1 if random.random() < 0.25 else 0
        d60, d90 = 0, 0
        util = round(random.uniform(25.0, 48.0), 1)
        loan_amt = round(random.uniform(200000, 800000), -4)
        term = random.choice([24, 36, 48])
        status = random.choice(["Employed", "Employed", "Self-Employed"])
        dependents = random.randint(0, 3)
        
    elif profile == "fair":
        age = random.randint(24, 50)
        emp_len = round(random.uniform(1.5, 7.0), 1)
        income = round(random.uniform(45000, 95000), -3)
        expenses = round(income * random.uniform(0.50, 0.70), -2)
        debt = round(income * random.uniform(0.25, 0.42), -2)
        savings = round(income * random.uniform(0.5, 2.5), -3)
        history = round(random.uniform(2.5, 8.0), 1)
        lines = random.randint(3, 8)
        d30 = random.choice([0, 1, 2])
        d60 = 1 if random.random() < 0.20 else 0
        d90 = 0
        util = round(random.uniform(45.0, 72.0), 1)
        loan_amt = round(random.uniform(150000, 500000), -4)
        term = random.choice([24, 36, 48, 60])
        status = random.choice(["Employed", "Self-Employed"])
        dependents = random.randint(1, 3)
        
    else: # poor / very poor
        age = random.randint(21, 45)
        emp_len = round(random.uniform(0.5, 4.0), 1)
        income = round(random.uniform(25000, 60000), -3)
        expenses = round(income * random.uniform(0.60, 0.85), -2)
        debt = round(income * random.uniform(0.35, 0.55), -2)
        savings = round(income * random.uniform(0.1, 0.8), -3)
        history = round(random.uniform(1.0, 4.0), 1)
        lines = random.randint(2, 6)
        d30 = random.randint(1, 4)
        d60 = random.randint(0, 2)
        d90 = 1 if random.random() < 0.45 else 0
        util = round(random.uniform(70.0, 98.0), 1)
        loan_amt = round(random.uniform(100000, 400000), -4)
        term = random.choice([12, 24, 36])
        status = random.choice(["Employed", "Unemployed", "Self-Employed"])
        dependents = random.randint(0, 2)
        
    return ApplicantInput(
        applicant_name=name,
        age=age,
        employment_status=status,
        employment_length=emp_len,
        num_dependents=dependents,
        monthly_income=income,
        monthly_expenses=expenses,
        existing_debt_payments=debt,
        savings_balance=savings,
        credit_history_length=history,
        num_open_credit_lines=lines,
        past_delinquencies_30d=d30,
        past_delinquencies_60d=d60,
        past_delinquencies_90d=d90,
        credit_utilization=util,
        loan_amount=loan_amt,
        loan_term=term,
        loan_purpose=purpose
    )

def seed_database(num_records: int = 220):
    print(f"Initializing database and seeding {num_records} applications...")
    init_db()
    
    # Check existing count
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM applications")
    existing = c.fetchone()[0]
    conn.close()
    
    if existing >= num_records:
        print(f"Database already contains {existing} applications. Skipping seed.")
        return
        
    to_create = num_records - existing
    profiles = random.choices(["excellent", "good", "fair", "poor"], weights=[0.35, 0.35, 0.18, 0.12], k=to_create)
    
    start_date = datetime.now() - timedelta(days=180)
    
    for i in range(to_create):
        prof = profiles[i]
        applicant = generate_applicant(i, prof)
        
        # Run scoring
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
        
        shap_factors = compute_shap_explanations(X_trans, applicant, derived)
        
        # Spread dates over past 180 days with slight clustering toward recent weeks
        days_offset = int(np.random.beta(a=3, b=1.5) * 180)
        rec_date = start_date + timedelta(days=days_offset, hours=random.randint(8, 18), minutes=random.randint(0, 59))
        created_str = rec_date.strftime("%Y-%m-%d %H:%M:%S")
        
        result_dict = {
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
            "created_at": created_str
        }
        
        save_application(
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
            result_data=result_dict,
            created_at=created_str
        )
        
        if (i + 1) % 50 == 0 or (i + 1) == to_create:
            print(f"  Progress: {i + 1}/{to_create} seeded...")
            
    print("Database seeding completed successfully!")

if __name__ == "__main__":
    seed_database(220)
