import os
import jwt
import datetime
from functools import wraps
from flask import request, jsonify, g
from dotenv import load_dotenv

load_dotenv()


class AuthService:
    """
    Single-responsibility class that owns all JWT operations.

    Responsibilities:
    - Token generation (sign)
    - Token verification (decode + validate)
    - Flask route protection decorator (@require_auth)

    Usage:
        token = AuthService.generate_token(user_id, username)
        payload = AuthService.verify_token(token)

        @AuthService.require_auth
        def protected_view():
            user = g.user  # {"user_id": ..., "username": ...}
    """

    _secret: str = os.getenv("JWT_SECRET", "fallback-dev-secret-change-me")
    _expiry_days: int = int(os.getenv("JWT_EXPIRY_DAYS", "1"))

    @classmethod
    def generate_token(cls, user_id: str, username: str) -> str:
        """Encodes a JWT with user identity and expiry claim."""
        payload = {
            "user_id": user_id,
            "username": username,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(days=cls._expiry_days),
            "iat": datetime.datetime.utcnow(),
        }
        return jwt.encode(payload, cls._secret, algorithm="HS256")

    @classmethod
    def verify_token(cls, token: str) -> dict:
        """
        Decodes and validates a JWT token.
        Raises jwt.ExpiredSignatureError or jwt.InvalidTokenError on failure.
        """
        return jwt.decode(token, cls._secret, algorithms=["HS256"])

    @classmethod
    def require_auth(cls, f):
        """
        Flask route decorator.
        - Validates the Bearer token from the Authorization header.
        - On success: attaches decoded payload to Flask's `g.user`.
        - On failure: returns a 401 JSON response.
        """
        @wraps(f)
        def decorated(*args, **kwargs):
            auth_header = request.headers.get("Authorization", "")
            if not auth_header.startswith("Bearer "):
                return jsonify({
                    "status": "error",
                    "message": "Missing or malformed Authorization header"
                }), 401

            token = auth_header.split(" ", 1)[1]
            try:
                g.user = cls.verify_token(token)
            except jwt.ExpiredSignatureError:
                return jsonify({"status": "error", "message": "Token has expired"}), 401
            except jwt.InvalidTokenError:
                return jsonify({"status": "error", "message": "Invalid token"}), 401

            return f(*args, **kwargs)

        return decorated
