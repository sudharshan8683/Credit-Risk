# CreditSense — AI Credit Risk Assessment & Macro Stress Testing Platform

CreditSense is an institutional-grade, AI-driven credit risk assessment and portfolio stress-testing platform. It combines calibrated machine learning models (Logistic Regression and XGBoost) with SHAP (SHapley Additive exPlanations) to deliver transparent, compliant, and defensible underwriting decisions in real time.

---

## Key Features

- **Automated Underwriting & Scoring**: Evaluates creditworthiness on a 300–850 credit score scale, computes calibrated Probability of Default (PD), assigns risk tiers (Excellent to Very Poor), and recommends loan pricing/limits.
- **Explainable AI (SHAP)**: Provides granular factor-by-factor explainability for every score, detailing which financial attributes positively or negatively influenced the decision.
- **Portfolio Macro Stress Testing**: Simulates portfolio performance under macroeconomic shock scenarios (e.g., Baseline, Mild Recession, Severe Stagflation, Rate Hike) with dynamic default rate and capital loss projections.
- **Application Ledger & Case Review**: Searchable, filterable ledger of credit applications with detailed slide-out inspector drawers and status workflow management.
- **Institutional PDF Credit Memo Export**: Instant single-click generation of audit-ready credit appraisal memos using ReportLab.
- **Model Governance & Fairness Analytics**: Compare benchmark models, inspect AUC-ROC, Precision-Recall, and Brier calibration curves, and evaluate demographic fairness metrics.
- **Secure Authentication**: Role-based access control (RBAC) supporting Underwriters, Risk Analysts, and Chief Risk Officers.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Recharts, Framer Motion, Lucide Icons |
| **Backend** | Python 3.10+, FastAPI, Pydantic v2, Uvicorn, SQLite |
| **Machine Learning** | Scikit-Learn, XGBoost, SHAP, CalibratedClassifierCV, Joblib, NumPy, Pandas |
| **Document Generation** | ReportLab (PDF credit reports) |

---

## Project Structure

```text
Creditsense/
├── backend/
│   ├── app/
│   │   ├── models/          # Database models, schemas, and SQLite connection
│   │   ├── routes/          # FastAPI routes (assess, portfolio, auth, applications, etc.)
│   │   ├── services/        # Scoring engine, SHAP explainer, PDF generator, auth helpers
│   │   ├── config.py        # Application settings and risk thresholds
│   │   └── main.py          # FastAPI application entrypoint
│   ├── ml/
│   │   ├── artifacts/       # Saved model pipelines and scalers
│   │   ├── generate_dataset.py # Synthetic credit dataset generator
│   │   └── train.py         # Model training & calibration pipeline
│   ├── requirements.txt     # Python backend dependencies
│   ├── seed_db.py           # Database seeder (200+ historical applications)
│   └── tests/               # Backend test suite (pytest)
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components (ScoreGauge, Sidebar, Header, Drawer)
│   │   ├── pages/           # Dashboard, New Assessment, Ledger, Model Insights, Auth
│   │   ├── lib/             # API clients, TypeScript definitions, utility helpers
│   │   ├── App.tsx          # Main application router
│   │   └── main.tsx         # React root
│   ├── package.json         # Node.js dependencies and scripts
│   └── vite.config.ts       # Vite configuration with API proxy
└── README.md
```

---

## Getting Started

### Prerequisites

- **Python**: Version 3.10 or higher
- **Node.js**: Version 18.0 or higher (npm 9+)

---

### 1. Backend Setup

1. Open your terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Activate the virtual environment:
   - **Windows (PowerShell)**:
     ```powershell
     .\venv\Scripts\activate
     ```
   - **Windows (Command Prompt)**:
     ```cmd
     .\venv\Scripts\activate.bat
     ```
   - **macOS / Linux**:
     ```bash
     source venv/bin/activate
     ```
   *(If you need to create a fresh virtual environment: `python -m venv venv` followed by `pip install -r requirements.txt`)*

3. Start the FastAPI backend server:
   ```bash
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

4. Verify backend health:
   - **Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
   - **Health Endpoint**: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

---

### 2. Frontend Setup

1. Open a second terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```

3. Launch the Vite development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```text
   http://localhost:5173
   ```

---

## Database Management & Seeding

The application ships with a pre-populated SQLite database (`creditsense.db`) containing realistic credit assessments spanning diverse borrower profiles.

To reset or re-populate the database with fresh test data at any time:
```powershell
cd backend
python seed_db.py
```

---

## Running Automated Tests

Run the backend test suite covering the scoring engine, stress testing, and API endpoints:
```powershell
cd backend
pytest
```

---

## Underwriting Decision Matrix

CreditSense uses calibrated risk thresholds to categorize loan applicants:

| Credit Score Range | Risk Tier | Default Probability (PD) | System Recommendation |
| :--- | :--- | :--- | :--- |
| **750 – 850** | Excellent | `< 4.0%` | Auto-Approve (Preferred Rate) |
| **670 – 749** | Good | `4.0% – 14.0%` | Auto-Approve (Standard Rate) |
| **580 – 669** | Fair | `14.0% – 32.0%` | Manual Underwriter Review |
| **500 – 579** | Poor | `32.0% – 55.0%` | High Risk / Conditional Review |
| **300 – 499** | Very Poor | `>= 55.0%` | Decline |

---

## License

Internal proprietary software developed for credit risk analysis, portfolio monitoring, and regulatory stress testing.
