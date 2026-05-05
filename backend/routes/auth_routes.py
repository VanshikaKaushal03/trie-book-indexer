from flask import Blueprint, request, jsonify
from flask_bcrypt import Bcrypt
from services.auth import AuthService
from db.db import db

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

# Bcrypt instance is created here and reused — the app will init it properly
# via app.extensions after register_blueprint, so we just need a reference.
_bcrypt: Bcrypt | None = None


def init_bcrypt(bcrypt_instance: Bcrypt) -> None:
    """Called by the app factory to inject the shared Bcrypt instance."""
    global _bcrypt
    _bcrypt = bcrypt_instance


# --------------------------------------------------------------------------
# POST /api/auth/signup
# --------------------------------------------------------------------------
@auth_bp.route("/signup", methods=["POST"])
def signup():
    """Registers a new user with a bcrypt-hashed password."""
    try:
        data = request.json or {}
        username = (data.get("username") or "").strip()
        password = data.get("password") or ""

        if not username or not password:
            return jsonify({"status": "error", "message": "Username and password are required"}), 400

        if len(username) > 50:
            return jsonify({"status": "error", "message": "Username must be 50 characters or fewer"}), 400

        if db.find_user_by_username(username):
            return jsonify({"status": "error", "message": "Username already exists"}), 409

        hashed_pw = _bcrypt.generate_password_hash(password).decode("utf-8")
        db.create_user(username, hashed_pw)

        return jsonify({"status": "success", "message": "Account created. Please log in."})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# --------------------------------------------------------------------------
# POST /api/auth/login
# --------------------------------------------------------------------------
@auth_bp.route("/login", methods=["POST"])
def login():
    """Authenticates a user and returns a signed JWT."""
    try:
        data = request.json or {}
        username = (data.get("username") or "").strip()
        password = data.get("password") or ""

        user = db.find_user_by_username(username)
        if not user or not _bcrypt.check_password_hash(user["password"], password):
            return jsonify({"status": "error", "message": "Invalid username or password"}), 401

        token = AuthService.generate_token(str(user["_id"]), user["username"])

        return jsonify({
            "status": "success",
            "token": token,
            "user": {
                "id": str(user["_id"]),
                "username": user["username"],
            },
        })

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
