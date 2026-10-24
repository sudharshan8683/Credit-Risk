"""
CreditSense - Synthetic Credit Risk Dataset Generator
Generates 15,000 realistic loan applicant records based on Give Me Some Credit
and Basel II risk characteristics with realistic correlation structures.
"""

import os
import numpy as np
import pandas as pd

def generate_credit_dataset(n_samples: int = 15000, seed: int = 42) -> pd.DataFrame:
    np.random.seed(seed)
    
    # 1. Personal Demographics
    # Age: 21 to 75, mean around 42
    age = np.clip(np.random.normal(loc=43, scale=12, size=n_samples).astype(int), 21, 75)
    
    # Employment Status: 75% Employed, 15% Self-Employed, 5% Retired, 5% Unemployed
    emp_choices = ["Employed", "Self-Employed", "Retired", "Unemployed"]
    emp_probs = [0.74, 0.16, 0.06, 0.04]
    employment_status = np.random.choice(emp_choices, size=n_samples, p=emp_probs)
    
    # Employment Length (years): correlated with age
    max_emp_len = np.maximum(0, age - 20)
    emp_len_fraction = np.random.beta(a=2, b=4, size=n_samples)
    employment_length = np.round(max_emp_len * emp_len_fraction, 1)
    # Adjust for retired/unemployed
    employment_length = np.where(employment_status == "Unemployed", 0.0, employment_length)
    
    # Number of Dependents: 0 to 4
    num_dependents = np.random.choice([0, 1, 2, 3, 4], size=n_samples, p=[0.35, 0.28, 0.24, 0.10, 0.03])
    
    # 2. Financial Metrics (INR)
    # Monthly Income: log-normal, median ~₹72,000, range ₹18,000 to ₹450,000
    log_income = np.random.normal(loc=11.15, scale=0.55, size=n_samples)
    monthly_income = np.round(np.clip(np.exp(log_income), 18000, 450000), -2)
    
    # Monthly Expenses: typically 40% - 75% of income
    expense_ratio = np.random.beta(a=4, b=4, size=n_samples) * 0.45 + 0.35
    monthly_expenses = np.round(monthly_income * expense_ratio, -2)
    
    # Existing Debt Payments: typically 0% - 40% of income
    existing_debt_ratio = np.random.beta(a=1.8, b=4.5, size=n_samples) * 0.50
    existing_debt_payments = np.round(monthly_income * existing_debt_ratio, -2)
    
    # Savings Balance: log-normal, correlated with income and age
    savings_multiplier = np.random.lognormal(mean=1.2, sigma=0.9, size=n_samples)
    savings_balance = np.round(np.clip(monthly_income * savings_multiplier * (1 + (age - 21) * 0.02), 5000, 6000000), -3)
    
    # 3. Credit Bureau Metrics
    # Credit History Length (years): correlated with age
    max_hist = np.maximum(1, age - 18)
    credit_hist_fraction = np.random.beta(a=3, b=2, size=n_samples)
    credit_history_length = np.round(np.clip(max_hist * credit_hist_fraction, 0.5, 35.0), 1)
    
    # Number of Open Credit Lines: 1 to 20
    num_open_credit_lines = np.clip(np.random.poisson(lam=6, size=n_samples), 1, 22)
    
    # Credit Card Utilization (0.0 to 1.15)
    # Skewed towards lower utilization, with a risky tail > 70%
    credit_utilization = np.round(np.clip(np.random.beta(a=1.5, b=3.5, size=n_samples) * 1.10, 0.02, 1.15), 4)
    
    # Delinquencies (correlated with high utilization and high existing debt)
    risk_delinq_factor = (credit_utilization > 0.65).astype(float) * 1.5 + (existing_debt_ratio > 0.35).astype(float) * 1.2
    
    p_delinq_30 = np.clip(0.06 + 0.18 * risk_delinq_factor, 0.02, 0.65)
    past_delinquencies_30d = np.random.poisson(lam=p_delinq_30, size=n_samples)
    
    p_delinq_60 = np.clip(0.02 + 0.08 * (past_delinquencies_30d > 0).astype(float) * risk_delinq_factor, 0.01, 0.40)
    past_delinquencies_60d = np.random.poisson(lam=p_delinq_60, size=n_samples)
    
    p_delinq_90 = np.clip(0.01 + 0.05 * (past_delinquencies_60d > 0).astype(float) * risk_delinq_factor, 0.005, 0.25)
    past_delinquencies_90d = np.random.poisson(lam=p_delinq_90, size=n_samples)
    
    # 4. Requested Loan Details
    loan_purposes = [
        "debt_consolidation", "home_improvement", "business", 
        "auto", "education", "personal"
    ]
    loan_purpose = np.random.choice(loan_purposes, size=n_samples, p=[0.38, 0.22, 0.15, 0.12, 0.08, 0.05])
    
    # Loan Amount: ₹50,000 to ₹2,500,000, roughly 3x to 15x monthly income
    loan_multiplier = np.random.uniform(2.5, 12.0, size=n_samples)
    loan_amount = np.round(np.clip(monthly_income * loan_multiplier, 50000, 2500000), -3)
    
    # Loan Term: 12, 24, 36, 48, 60, 72, 84 months
    loan_terms = [12, 24, 36, 48, 60, 72, 84]
    loan_term = np.random.choice(loan_terms, size=n_samples, p=[0.08, 0.18, 0.32, 0.18, 0.14, 0.06, 0.04])
    
    # 5. Derived Features Calculation
    # Standard Amortization Formula for EMI at baseline interest rate of 11.0% annual
    annual_rate = 0.110
    monthly_rate = annual_rate / 12.0
    estimated_emi = np.round(
        loan_amount * (monthly_rate * (1 + monthly_rate) ** loan_term) / 
        ((1 + monthly_rate) ** loan_term - 1), 
        -1
    )
    
    # Debt Ratios
    dti = np.round(existing_debt_payments / monthly_income, 4)
    emi_to_income = np.round(estimated_emi / monthly_income, 4)
    total_dti = np.round((existing_debt_payments + estimated_emi) / monthly_income, 4)
    lti = np.round(loan_amount / (monthly_income * 12.0), 4)
    savings_to_loan = np.round(savings_balance / loan_amount, 4)
    disposable_income = np.maximum(0, monthly_income - monthly_expenses - existing_debt_payments - estimated_emi)
    
    # 6. Latent Default Propensity Function (Ground Truth Probability Model)
    # Calibrated to yield ~7.8% default rate (realistic consumer loan portfolio)
    log_odds = (
        -3.85
        + 3.40 * total_dti
        + 2.70 * (credit_utilization - 0.30)
        + 0.65 * past_delinquencies_30d
        + 1.10 * past_delinquencies_60d
        + 1.85 * past_delinquencies_90d
        + 0.85 * np.maximum(0, lti - 0.70)
        - 0.06 * np.minimum(credit_history_length, 25.0)
        - 0.45 * np.log1p(savings_to_loan)
        - 0.04 * np.minimum(employment_length, 20.0)
        - 0.015 * (age - 35)
        - 0.30 * np.log1p(disposable_income / 15000.0)
        + 1.30 * (employment_status == "Unemployed").astype(float)
        + 0.25 * (employment_status == "Self-Employed").astype(float)
        + np.random.normal(0, 0.35, size=n_samples) # Unobserved idiosyncratic noise
    )
    
    prob_default = 1.0 / (1.0 + np.exp(-log_odds))
    # Threshold for actual binary default in 2-year window
    default_label = (np.random.uniform(0, 1, size=n_samples) < prob_default).astype(int)
    
    df = pd.DataFrame({
        "age": age,
        "employment_status": employment_status,
        "employment_length": employment_length,
        "num_dependents": num_dependents,
        "monthly_income": monthly_income,
        "monthly_expenses": monthly_expenses,
        "existing_debt_payments": existing_debt_payments,
        "savings_balance": savings_balance,
        "credit_history_length": credit_history_length,
        "num_open_credit_lines": num_open_credit_lines,
        "past_delinquencies_30d": past_delinquencies_30d,
        "past_delinquencies_60d": past_delinquencies_60d,
        "past_delinquencies_90d": past_delinquencies_90d,
        "credit_utilization": credit_utilization,
        "loan_amount": loan_amount,
        "loan_term": loan_term,
        "loan_purpose": loan_purpose,
        # Derived features
        "estimated_emi": estimated_emi,
        "dti": dti,
        "emi_to_income": emi_to_income,
        "total_dti": total_dti,
        "lti": lti,
        "savings_to_loan": savings_to_loan,
        "disposable_income": disposable_income,
        # Ground truth
        "default": default_label,
        "true_pd": np.round(prob_default, 4)
    })
    
    return df

if __name__ == "__main__":
    out_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "credit_data.csv")
    print("Generating 15,000 credit records...")
    df = generate_credit_dataset(15000, seed=42)
    df.to_csv(out_path, index=False)
    print(f"Dataset generated successfully at: {out_path}")
    print(f"Shape: {df.shape}")
    print(f"Overall Default Rate: {df['default'].mean():.2%}")
    print("Default rate by age band:")
    df["age_band"] = pd.cut(df["age"], bins=[18, 25, 35, 50, 65, 100], labels=["<25", "25-34", "35-49", "50-64", "65+"])
    print(df.groupby("age_band", observed=False)["default"].mean().map("{:.2%}".format))
