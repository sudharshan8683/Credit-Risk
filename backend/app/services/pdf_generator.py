"""
CreditSense PDF Report Generator
Generates clean, institutional-grade Credit Assessment Reports via ReportLab.
"""

import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

def generate_assessment_pdf(assessment_data: dict) -> io.BytesIO:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    brand_navy = colors.HexColor("#0F172A")
    slate_600 = colors.HexColor("#475569")
    accent_blue = colors.HexColor("#2563EB")
    light_bg = colors.HexColor("#F8FAFC")
    border_color = colors.HexColor("#E2E8F0")
    
    # Decision colors
    decision = assessment_data.get("decision", "Manual Review")
    if decision == "Approve":
        dec_color = colors.HexColor("#16A34A")
        dec_bg = colors.HexColor("#DCFCE7")
    elif decision == "Reject":
        dec_color = colors.HexColor("#DC2626")
        dec_bg = colors.HexColor("#FEE2E2")
    else:
        dec_color = colors.HexColor("#D97706")
        dec_bg = colors.HexColor("#FEF3C7")
        
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=brand_navy
    )
    
    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=slate_600
    )
    
    section_heading = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=brand_navy,
        spaceAfter=6
    )
    
    normal_text = ParagraphStyle(
        "NormalText",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=slate_600
    )
    
    bold_text = ParagraphStyle(
        "BoldText",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=13,
        textColor=brand_navy
    )
    
    elements = []
    
    # 1. Header with branding
    header_data = [
        [
            Paragraph("<b>CreditSense</b> | AI Risk Assessment Platform", title_style),
            Paragraph(f"<b>Generated:</b> {datetime.now().strftime('%d %b %Y, %H:%M')}<br/><b>Ref:</b> CS-{assessment_data.get('id', 'NEW')}", subtitle_style)
        ]
    ]
    header_table = Table(header_data, colWidths=[4.2 * inch, 3.0 * inch])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
    ]))
    elements.append(header_table)
    elements.append(HRFlowable(width="100%", thickness=1.5, color=border_color, spaceAfter=14))
    
    # 2. Executive Decision & Score Banner
    score = assessment_data.get("credit_score", 700)
    risk_band = assessment_data.get("risk_band", "Good")
    pd_val = assessment_data.get("probability_of_default", 0.05) * 100
    applicant = assessment_data.get("applicant", {})
    applicant_name = assessment_data.get("applicant_name", applicant.get("applicant_name", "Applicant"))
    
    kpi_data = [
        [
            Paragraph(f"<b>APPLICANT</b><br/><font size='13' color='#0F172A'><b>{applicant_name}</b></font><br/>Age: {applicant.get('age', 'N/A')} | {applicant.get('employment_status', 'Employed')}", normal_text),
            Paragraph(f"<b>CREDIT SCORE</b><br/><font size='18' color='#2563EB'><b>{score}</b></font><font size='10' color='#64748B'> / 850</font><br/>Band: <b>{risk_band}</b>", normal_text),
            Paragraph(f"<b>DEFAULT PROBABILITY</b><br/><font size='16' color='#0F172A'><b>{pd_val:.2f}%</b></font><br/>1-Yr Cumulative Risk", normal_text),
            Paragraph(f"<b>DECISION</b><br/><font size='14' color='{dec_color.hexval()}'><b>{decision.upper()}</b></font><br/>Max: ₹{assessment_data.get('recommended_max_loan_amount', 0):,.0f}", normal_text),
        ]
    ]
    kpi_table = Table(kpi_data, colWidths=[2.2 * inch, 1.8 * inch, 1.8 * inch, 1.8 * inch])
    kpi_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), light_bg),
        ('BOX', (0, 0), (-1, -1), 1, border_color),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, border_color),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(kpi_table)
    elements.append(Spacer(1, 14))
    
    # 3. Financial & Debt Ratios Table
    elements.append(Paragraph("Financial Profile & Underwriting Ratios", section_heading))
    derived = assessment_data.get("derived_features", {})
    
    ratios_data = [
        [
            Paragraph("<b>Monthly Gross Income:</b>", normal_text),
            Paragraph(f"₹{applicant.get('monthly_income', 0):,.0f}", bold_text),
            Paragraph("<b>Requested Loan Amount:</b>", normal_text),
            Paragraph(f"₹{applicant.get('loan_amount', 0):,.0f}", bold_text),
        ],
        [
            Paragraph("<b>Existing Monthly Debt:</b>", normal_text),
            Paragraph(f"₹{applicant.get('existing_debt_payments', 0):,.0f}", bold_text),
            Paragraph("<b>Estimated Monthly EMI:</b>", normal_text),
            Paragraph(f"₹{derived.get('estimated_emi', 0):,.0f}", bold_text),
        ],
        [
            Paragraph("<b>Total Debt-to-Income (DTI):</b>", normal_text),
            Paragraph(f"{derived.get('total_dti', 0)*100:.1f}%", bold_text),
            Paragraph("<b>Loan-to-Income (LTI):</b>", normal_text),
            Paragraph(f"{derived.get('lti', 0):.2f}x", bold_text),
        ],
        [
            Paragraph("<b>Credit Utilization:</b>", normal_text),
            Paragraph(f"{applicant.get('credit_utilization', 0):.1f}%", bold_text),
            Paragraph("<b>Savings / Liquid Reserve:</b>", normal_text),
            Paragraph(f"₹{applicant.get('savings_balance', 0):,.0f}", bold_text),
        ],
        [
            Paragraph("<b>Past Delinquencies (30/60/90d):</b>", normal_text),
            Paragraph(f"{applicant.get('past_delinquencies_30d', 0)} / {applicant.get('past_delinquencies_60d', 0)} / {applicant.get('past_delinquencies_90d', 0)}", bold_text),
            Paragraph("<b>Suggested Interest Rate:</b>", normal_text),
            Paragraph(assessment_data.get("suggested_interest_rate_range", "N/A"), bold_text),
        ]
    ]
    ratios_table = Table(ratios_data, colWidths=[2.1 * inch, 1.7 * inch, 2.1 * inch, 1.7 * inch])
    ratios_table.setStyle(TableStyle([
        ('LINEBELOW', (0, 0), (-1, -1), 0.5, border_color),
        ('PADDING', (0, 0), (-1, -1), 5),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(ratios_table)
    elements.append(Spacer(1, 14))
    
    # 4. Top SHAP Risk Factors
    elements.append(Paragraph("Machine Learning Explainability (Top SHAP Drivers)", section_heading))
    shap_factors = assessment_data.get("top_5_shap_factors", [])
    
    shap_rows = [
        [
            Paragraph("<b>Risk Driver</b>", bold_text),
            Paragraph("<b>Impact Direction</b>", bold_text),
            Paragraph("<b>Plain-English Banking Explanation</b>", bold_text)
        ]
    ]
    
    for sf in shap_factors:
        is_raise = (sf.get("direction") == "raises_risk")
        dir_label = "Increases Risk" if is_raise else "Lowers Risk"
        dir_color = "#DC2626" if is_raise else "#16A34A"
        dir_para = Paragraph(f"<font color='{dir_color}'><b>{dir_label}</b></font>", normal_text)
        
        name_para = Paragraph(f"<b>{sf.get('name', '')}</b><br/><font size='8' color='#64748B'>Weight: {sf.get('impact_score', 0)}%</font>", normal_text)
        sentence_para = Paragraph(sf.get("sentence", ""), normal_text)
        
        shap_rows.append([name_para, dir_para, sentence_para])
        
    shap_table = Table(shap_rows, colWidths=[1.8 * inch, 1.4 * inch, 4.4 * inch])
    shap_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), light_bg),
        ('LINEBELOW', (0, 0), (-1, -1), 0.5, border_color),
        ('PADDING', (0, 0), (-1, -1), 5),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    elements.append(shap_table)
    elements.append(Spacer(1, 14))
    
    # 5. Improvement Recommendations
    suggestions = assessment_data.get("what_would_improve_this_score", [])
    if suggestions:
        elements.append(Paragraph("Prescriptive Score Improvement Roadmap", section_heading))
        for idx, sug in enumerate(suggestions, 1):
            elements.append(Paragraph(f"<b>{idx}.</b> {sug}", normal_text))
            elements.append(Spacer(1, 4))
            
    elements.append(Spacer(1, 10))
    
    # 6. Compliance & Sign-off Footer
    elements.append(HRFlowable(width="100%", thickness=0.8, color=border_color, spaceAfter=8))
    compliance_text = (
        "<b>Responsible AI & Fair Lending Disclosure:</b> This credit assessment was produced by an automated "
        "machine learning model calibrated for risk decision support. Protected demographic classes (race, gender, religion, "
        "marital status) are strictly excluded from predictive features. This report provides decision intelligence "
        "and does not substitute for licensed human credit underwriter verification."
    )
    elements.append(Paragraph(compliance_text, ParagraphStyle("Compliance", parent=normal_text, fontSize=7.5, leading=10)))
    elements.append(Spacer(1, 12))
    
    signoff_data = [
        [
            Paragraph("<b>Underwriting Officer:</b> ___________________________", normal_text),
            Paragraph("<b>Risk Committee Approval:</b> ___________________________", normal_text),
            Paragraph("<b>Date Signed:</b> _______________", normal_text)
        ]
    ]
    signoff_table = Table(signoff_data, colWidths=[2.6 * inch, 2.8 * inch, 2.2 * inch])
    elements.append(signoff_table)
    
    # Build Document
    doc.build(elements)
    buffer.seek(0)
    return buffer
