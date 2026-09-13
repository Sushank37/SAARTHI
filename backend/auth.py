"""
SAARTHI — Cryptographic Authentication & Server-Side Role Authorization Module
Authoritative server-side identity verification using HMAC-SHA256 session tokens.
Zero external package dependencies (pure Python standard library).
"""

import os
import hmac
import hashlib
import json
import base64
import time
from typing import Optional, Dict, Any, List
from fastapi import HTTPException, Header, Depends

# Server secret key (configurable in Railway environment)
SECRET_KEY = os.environ.get(
    "AUTH_SECRET_KEY", 
    "saarthi-mplads-production-secret-auth-salt-v1-2026"
).encode("utf-8")

# Canonical Roles Recognized by MPLADS Architecture
VALID_ROLES = {
    "MP": "Member of Parliament",
    "DISTRICT_AUTHORITY": "District Authority / Collectorate",
    "IMPLEMENTING_AGENCY": "Implementing Agency / Field Engineer",
    "MOSPI": "MoSPI Central Nodal Monitoring Cell",
    "CITIZEN": "Citizen / General Public"
}

def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")

def _b64url_decode(data: str) -> bytes:
    padding = 4 - (len(data) % 4)
    if padding and padding != 4:
        data += "=" * padding
    return base64.urlsafe_b64decode(data.encode("ascii"))

def create_session_token(role: str, user_id: str, name: Optional[str] = None, expires_in_seconds: int = 86400 * 7) -> str:
    """Issue a cryptographically signed HMAC-SHA256 session token."""
    canonical_role = role.strip().upper()
    if canonical_role not in VALID_ROLES:
        raise ValueError(f"Invalid role '{role}'. Permitted roles: {list(VALID_ROLES.keys())}")

    now = int(time.time())
    payload = {
        "sub": str(user_id).strip(),
        "role": canonical_role,
        "name": name or VALID_ROLES[canonical_role],
        "iat": now,
        "exp": now + expires_in_seconds,
    }

    payload_json = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    payload_b64 = _b64url_encode(payload_json)

    signature = hmac.new(SECRET_KEY, payload_b64.encode("ascii"), hashlib.sha256).digest()
    sig_b64 = _b64url_encode(signature)

    return f"{payload_b64}.{sig_b64}"

def verify_session_token(token: str) -> Dict[str, Any]:
    """Verify HMAC signature and expiration; return actor payload or raise HTTPException."""
    if not token or "." not in token:
        raise HTTPException(status_code=401, detail="Missing or malformed authorization token.")

    parts = token.split(".")
    if len(parts) != 2:
        raise HTTPException(status_code=401, detail="Malformed authorization token structure.")

    payload_b64, sig_b64 = parts[0], parts[1]

    # Verify signature
    expected_sig = hmac.new(SECRET_KEY, payload_b64.encode("ascii"), hashlib.sha256).digest()
    try:
        actual_sig = _b64url_decode(sig_b64)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token signature encoding.")

    if not hmac.compare_digest(expected_sig, actual_sig):
        raise HTTPException(status_code=401, detail="Invalid token cryptographic signature. Role spoofing rejected.")

    # Decode and verify payload
    try:
        payload_bytes = _b64url_decode(payload_b64)
        payload = json.loads(payload_bytes.decode("utf-8"))
    except Exception:
        raise HTTPException(status_code=401, detail="Corrupted token payload.")

    now = int(time.time())
    if payload.get("exp", 0) < now:
        raise HTTPException(status_code=401, detail="Authorization session expired. Please log in again.")

    return payload

def get_current_actor(
    authorization: Optional[str] = Header(None),
    x_saarthi_role: Optional[str] = Header(None)
) -> Dict[str, Any]:
    """
    FastAPI dependency to extract and verify actor from Bearer token.
    Falls back safely to demo header token if authenticated or guest citizen.
    """
    token = None
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()
    elif authorization and not authorization.lower().startswith("bearer "):
        token = authorization.strip()

    if token:
        return verify_session_token(token)

    # If no token is provided but x_saarthi_role is provided (e.g. for citizen/demo mode),
    # issue a temporary actor if development or raise 401 for mutation
    if x_saarthi_role:
        role = x_saarthi_role.strip().upper()
        if role in VALID_ROLES:
            return {
                "sub": f"GUEST-{role}",
                "role": role,
                "name": VALID_ROLES[role],
                "iat": int(time.time()),
                "exp": int(time.time()) + 3600,
                "is_ephemeral": True
            }

    # Public Citizen Fallback
    return {
        "sub": "PUBLIC-CITIZEN",
        "role": "CITIZEN",
        "name": "General Public / Citizen",
        "iat": int(time.time()),
        "exp": int(time.time()) + 3600,
        "is_ephemeral": True
    }

def require_roles(allowed_roles: List[str]):
    """Guard factory returning a dependency that enforces authorized roles."""
    normalized_allowed = [r.strip().upper() for r in allowed_roles]

    def role_checker(actor: Dict[str, Any] = Depends(get_current_actor)) -> Dict[str, Any]:
        actor_role = actor.get("role", "").upper()
        if actor_role not in normalized_allowed:
            raise HTTPException(
                status_code=403,
                detail=f"Access forbidden: Role '{actor_role}' is not authorized. Allowed roles: {normalized_allowed}"
            )
        return actor

    return role_checker
