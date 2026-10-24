"""
CreditSense Applications Historical Ledger & PDF Export Routes
"""

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response
from typing import Optional
from ..models.schemas import ApplicationsListResponse, ApplicationSummary, AssessmentResponse
from ..models.database import get_applications, get_application_by_id
from ..services.pdf_generator import generate_assessment_pdf

router = APIRouter(prefix="/api/applications", tags=["Applications"])

@router.get("", response_model=ApplicationsListResponse)
def list_applications(
    search: Optional[str] = Query(None, description="Search applicant name or loan purpose"),
    decision: Optional[str] = Query("all", description="Filter by decision: Approve, Manual Review, Reject, or all"),
    risk_band: Optional[str] = Query("all", description="Filter by risk band: Excellent, Good, Fair, Poor, Very Poor, or all"),
    sort_by: str = Query("created_at", description="Sort field: created_at, credit_score, monthly_income, loan_amount, applicant_name"),
    sort_order: str = Query("desc", description="Sort order: asc or desc"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(15, ge=1, le=100, description="Items per page")
):
    """Retrieves paginated, searchable, and filtered historical loan assessments."""
    apps, total = get_applications(
        search=search,
        decision=decision,
        risk_band=risk_band,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size
    )
    
    summaries = [
        ApplicationSummary(
            id=a["id"],
            applicant_name=a["applicant_name"],
            age=a["age"],
            monthly_income=a["monthly_income"],
            loan_amount=a["loan_amount"],
            loan_purpose=a["loan_purpose"],
            credit_score=a["credit_score"],
            risk_band=a["risk_band"],
            decision=a["decision"],
            probability_of_default=a["probability_of_default"],
            dti=round(a["dti"], 4),
            created_at=str(a["created_at"])
        )
        for a in apps
    ]
    
    return ApplicationsListResponse(
        total=total,
        page=page,
        page_size=page_size,
        applications=summaries
    )

@router.get("/{app_id}")
def get_single_application(app_id: int):
    """Fetches full assessment details including SHAP factors, inputs, and derived features for drawer view."""
    app = get_application_by_id(app_id)
    if not app:
        raise HTTPException(status_code=404, detail=f"Application with ID {app_id} not found.")
        
    res = app["result_data"]
    res["id"] = app["id"]
    return res

@router.get("/{app_id}/export-pdf")
def export_application_pdf(app_id: int):
    """Generates and streams a high-resolution PDF credit assessment report for the loan officer."""
    app = get_application_by_id(app_id)
    if not app:
        raise HTTPException(status_code=404, detail=f"Application with ID {app_id} not found.")
        
    assessment_data = app["result_data"]
    assessment_data["id"] = app["id"]
    
    pdf_buffer = generate_assessment_pdf(assessment_data)
    
    filename = f"CreditSense_Assessment_CS{app_id}_{assessment_data.get('applicant_name', 'Applicant').replace(' ', '_')}.pdf"
    
    return Response(
        content=pdf_buffer.getvalue(),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )
