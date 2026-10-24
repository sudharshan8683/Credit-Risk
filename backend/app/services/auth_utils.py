"""
CreditSense Authentication & Cryptographic Utilities
Provides PBKDF2 password hashing, verification, and HMAC signed session tokens.
"""

import hashlib
import hmac
import secrets
import time
from typing import Tuple, Optional
from ..config import settings

def hash_password(password: str) -> Tuple[str, str]:
    """Generates a secure salt and computes PBKDF2-HMAC-SHA256 password hash."""
    salt = secrets.token_hex(16)
    pwd_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100_000
    ).hex()
    return salt, pwd_hash

def verify_password(password: str, salt: str, expected_hash: str) -> bool:
    """Verifies a plain-text password against stored salt and expected PBKDF2 hash."""
    computed_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100_000
    ).hex()
    return secrets.compare_digest(computed_hash, expected_hash)

def create_access_token(user_id: int, username: str, expires_in_hours: Optional[int] = None) -> str:
    """
    Issues an HMAC-SHA256 signed bearer token:
    Format: <user_id>.<expires_timestamp>.<random_nonce>.<signature>
    """
    if expires_in_hours is None:
        expires_in_hours = settings.TOKEN_EXPIRE_HOURS
        
    expires_at = int(time.time()) + (expires_in_hours * 3600)
    nonce = secrets.token_hex(8)
    payload = f"{user_id}.{expires_at}.{nonce}"
    
    signature = hmac.new(
        settings.JWT_SECRET.encode("utf-8"),
        payload.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()
    
    return f"{payload}.{signature}"

def verify_access_token(token: str) -> Optional[int]:
    """
    Validates token signature and expiration timestamp.
    Returns user_id if valid, or None if expired or forged.
    """
    try:
        parts = token.strip().split(".")
        if len(parts) != 4:
            return None
            
        user_id_str, expires_str, nonce, signature = parts
        payload = f"{user_id_str}.{expires_str}.{nonce}"
        
        expected_sig = hmac.new(
            settings.JWT_SECRET.encode("utf-8"),
            payload.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()
        
        if not secrets.compare_digest(signature, expected_sig):
            return None
            
        expires_at = int(expires_str)
        if time.time() > expires_at:
            return None # Expired
            
        return int(user_id_str)
    except Exception:
        return None
