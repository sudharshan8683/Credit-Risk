"""
CreditSense SQLite Database Engine & Data Access Layer
Stores all submitted loan assessments and provides search, sorting, and filtering.
"""

import sqlite3
import json
import os
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from ..config import settings

def get_db_connection() -> sqlite3.Connection:
    os.makedirs(os.path.dirname(settings.DB_PATH), exist_ok=True)
    conn = sqlite3.connect(settings.DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS applications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            applicant_name TEXT NOT NULL,
            age INTEGER NOT NULL,
            monthly_income REAL NOT NULL,
            loan_amount REAL NOT NULL,
            loan_purpose TEXT NOT NULL,
            credit_score INTEGER NOT NULL,
            risk_band TEXT NOT NULL,
            decision TEXT NOT NULL,
            probability_of_default REAL NOT NULL,
            dti REAL NOT NULL,
            input_data_json TEXT NOT NULL,
            result_data_json TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_decision ON applications(decision)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_risk_band ON applications(risk_band)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_credit_score ON applications(credit_score)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_created_at ON applications(created_at)")
    
    # Users table for underwriting officer authentication
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            full_name TEXT NOT NULL,
            role TEXT NOT NULL,
            salt TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username)")
    cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)")
    
    conn.commit()
    conn.close()

def save_application(
    applicant_name: str,
    age: int,
    monthly_income: float,
    loan_amount: float,
    loan_purpose: str,
    credit_score: int,
    risk_band: str,
    decision: str,
    probability_of_default: float,
    dti: float,
    input_data: dict,
    result_data: dict,
    created_at: Optional[str] = None
) -> int:
    conn = get_db_connection()
    cursor = conn.cursor()
    if created_at is None:
        created_at = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    
    cursor.execute("""
        INSERT INTO applications (
            applicant_name, age, monthly_income, loan_amount, loan_purpose,
            credit_score, risk_band, decision, probability_of_default, dti,
            input_data_json, result_data_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        applicant_name, age, monthly_income, loan_amount, loan_purpose,
        credit_score, risk_band, decision, probability_of_default, dti,
        json.dumps(input_data), json.dumps(result_data), created_at
    ))
    app_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return app_id

def get_applications(
    search: Optional[str] = None,
    decision: Optional[str] = None,
    risk_band: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    page: int = 1,
    page_size: int = 15
) -> Tuple[List[Dict[str, Any]], int]:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "SELECT id, applicant_name, age, monthly_income, loan_amount, loan_purpose, credit_score, risk_band, decision, probability_of_default, dti, created_at FROM applications WHERE 1=1"
    params = []
    
    if search:
        query += " AND (applicant_name LIKE ? OR loan_purpose LIKE ?)"
        pattern = f"%{search}%"
        params.extend([pattern, pattern])
        
    if decision and decision.lower() != "all":
        query += " AND decision = ?"
        params.append(decision)
        
    if risk_band and risk_band.lower() != "all":
        query += " AND risk_band = ?"
        params.append(risk_band)
        
    # Count total
    count_query = f"SELECT COUNT(*) FROM ({query})"
    cursor.execute(count_query, params)
    total = cursor.fetchone()[0]
    
    # Sorting
    allowed_sort_fields = {
        "created_at": "created_at",
        "credit_score": "credit_score",
        "monthly_income": "monthly_income",
        "loan_amount": "loan_amount",
        "applicant_name": "applicant_name",
        "probability_of_default": "probability_of_default"
    }
    col = allowed_sort_fields.get(sort_by, "created_at")
    direction = "ASC" if sort_order.lower() == "asc" else "DESC"
    query += f" ORDER BY {col} {direction}, id DESC"
    
    # Pagination
    offset = (page - 1) * page_size
    query += " LIMIT ? OFFSET ?"
    params.extend([page_size, offset])
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    
    apps = [dict(row) for row in rows]
    conn.close()
    return apps, total

def get_application_by_id(app_id: int) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM applications WHERE id = ?", (app_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    d["input_data"] = json.loads(d["input_data_json"])
    d["result_data"] = json.loads(d["result_data_json"])
    return d

def get_all_applications_for_stats() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM applications ORDER BY created_at ASC")
    rows = cursor.fetchall()
    conn.close()
    result = []
    for r in rows:
        d = dict(r)
        d["input_data"] = json.loads(d["input_data_json"])
        d["result_data"] = json.loads(d["result_data_json"])
        result.append(d)
    return result

# ==========================================
# User Authentication Data Access Layer
# ==========================================

def create_user(
    username: str,
    email: str,
    full_name: str,
    role: str,
    salt: str,
    password_hash: str
) -> int:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO users (username, email, full_name, role, salt, password_hash)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (username.strip().lower(), email.strip().lower(), full_name.strip(), role.strip(), salt, password_hash))
    user_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return user_id

def get_user_by_username_or_email(identifier: str) -> Optional[Dict[str, Any]]:
    clean_id = identifier.strip().lower()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, username, email, full_name, role, salt, password_hash, created_at
        FROM users
        WHERE username = ? OR email = ?
    """, (clean_id, clean_id))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def get_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, username, email, full_name, role, created_at
        FROM users
        WHERE id = ?
    """, (user_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def seed_default_users():
    """Seeds baseline institutional risk officer accounts if users table is empty."""
    from ..services.auth_utils import hash_password
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM users")
    count = cursor.fetchone()[0]
    conn.close()
    
    if count == 0:
        demo_users = [
            ("officer", "sarah.jenkins@creditsense.bank", "Sarah Jenkins", "Senior Credit Officer", "password123"),
            ("cro", "marcus.vance@creditsense.bank", "Marcus Vance", "Chief Risk Officer", "password123"),
            ("analyst", "pooja.iyer@creditsense.bank", "Pooja Iyer", "Credit Risk Analyst", "password123")
        ]
        for uname, email, fname, role, pwd in demo_users:
            salt, p_hash = hash_password(pwd)
            try:
                create_user(uname, email, fname, role, salt, p_hash)
            except Exception:
                pass

