import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import json
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def evaluate_presets():
    presets = client.get("/api/assess/presets").json()
    print("=" * 60)
    print("PRESET APPLICANT EVALUATION RESULTS")
    print("=" * 60)
    for p in presets:
        res = client.post("/api/assess?auto_save=false", json=p["data"]).json()
        print(f"\nProfile: {p['name']}")
        print(f"Tagline: {p['tagline']}")
        print(f"Credit Score: {res['credit_score']} / 850")
        print(f"Risk Band:    {res['risk_band']}")
        print(f"Decision:     {res['decision']}")
        print(f"PD (1-Yr):    {res['probability_of_default']*100:.2f}%")
        print(f"Max Loan:     INR {res['recommended_max_loan_amount']:,.0f}")
        print(f"Rate Range:   {res['suggested_interest_rate_range']}")
        print("Top SHAP Factor Drivers:")
        for sf in res["top_5_shap_factors"][:3]:
            dir_str = "(+) Raises Risk" if sf["direction"] == "raises_risk" else "(-) Lowers Risk"
            # Replace unicode rupee sign in sentence if any
            clean_sentence = sf['sentence'].replace("\u20b9", "INR ")
            print(f"  * {sf['name']} [{dir_str} - {sf['impact_score']}%]: {clean_sentence}")
        print("Improvement Suggestions:")
        for s in res["what_would_improve_this_score"]:
            clean_sug = s.replace("\u20b9", "INR ")
            print(f"  -> {clean_sug}")

if __name__ == "__main__":
    evaluate_presets()
