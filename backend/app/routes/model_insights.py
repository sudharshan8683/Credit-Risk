"""
CreditSense Model Governance, Performance Metrics & Fairness Disparity Routes
"""

import os
import json
from fastapi import APIRouter, HTTPException
from ..config import settings

router = APIRouter(prefix="/api/model", tags=["Model Governance"])

@router.get("/metrics")
def get_model_metrics():
    """Returns trained model metrics, ROC curve coordinates, feature importance, and comparison."""
    metrics_path = os.path.join(settings.ARTIFACTS_DIR, "metrics.json")
    if not os.path.exists(metrics_path):
        raise HTTPException(status_code=404, detail="Model metrics artifact not found. Please train models first.")
        
    with open(metrics_path, "r") as f:
        data = json.load(f)
        
    # Add plain language summary of how the model works
    data["how_the_model_works"] = {
        "title": "Dual-Stage Calibrated Gradient Boosting Architecture",
        "description": (
            "CreditSense utilizes an ensemble of regularized decision trees trained via Extreme Gradient Boosting (XGBoost) "
            "paired with post-hoc sigmoid probability calibration. In Stage 1, the model extracts non-linear financial interactions "
            "(such as sudden credit utilization spikes in the presence of existing high fixed debt). In Stage 2, predicted logits "
            "are mapped to empirically observed default frequencies using an isotonic/sigmoid calibration layer, ensuring the model's "
            "probability scores represent true probability of default (PD). Exact Shapley Additive Explanations (TreeSHAP) decompose "
            "the logit output into exact, individual feature contributions for complete regulatory auditability."
        ),
        "key_pillars": [
            {"title": "Zero Black-Box Scoring", "detail": "Every decision provides exact SHAP local factor attributions with direction and magnitude."},
            {"title": "Probability Calibration", "detail": "Raw tree outputs are calibrated via isotonic cross-validation to minimize Brier loss."},
            {"title": "ECOA Non-Discrimination", "detail": "Protected demographic characteristics are strictly isolated from feature vectors."}
        ]
    }
    return data

@router.get("/fairness")
def get_fairness_audit():
    """Returns demographic parity evaluation across age bands and four-fifths rule compliance."""
    fairness_path = os.path.join(settings.ARTIFACTS_DIR, "fairness.json")
    if not os.path.exists(fairness_path):
        raise HTTPException(status_code=404, detail="Fairness audit artifact not found. Please run training pipeline.")
        
    with open(fairness_path, "r") as f:
        data = json.load(f)
        
    return data
