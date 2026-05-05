import bleach
from flask import Blueprint, jsonify, request, g
from services.auth import AuthService
from db.db import db

projects_bp = Blueprint("projects", __name__, url_prefix="/api/projects")


def _serialize_project(doc: dict) -> dict:
    """
    Converts a MongoDB project document to a JSON-serialisable dict.
    Handles the datetime -> ISO string conversion in one place (DRY).
    """
    return {
        "id": str(doc["_id"]),
        "name": doc.get("name", "Untitled Project"),
        "created_at": doc["created_at"].isoformat() if doc.get("created_at") else None,
        "stats": doc.get("stats", {}),
    }


def _serialize_full_project(doc: dict) -> dict:
    """Extends the summary with the full index data for the detail view."""
    base = _serialize_project(doc)
    base["index"] = doc.get("index", [])
    return base


_MAX_NAME_LEN = 100


def _sanitize_name(raw: str) -> str:
    """Strips HTML and enforces max length on a project name."""
    return bleach.clean(raw or "", tags=[], strip=True).strip()[:_MAX_NAME_LEN]


# --------------------------------------------------------------------------
# GET /api/projects
# --------------------------------------------------------------------------
@projects_bp.route("", methods=["GET"])
@AuthService.require_auth
def list_projects():
    """Returns a list of project summaries for the authenticated user."""
    try:
        user_id = g.user["user_id"]
        projects = db.get_projects_for_user(user_id)
        return jsonify({
            "status": "success",
            "projects": [_serialize_project(p) for p in projects],
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# --------------------------------------------------------------------------
# GET /api/projects/<project_id>
# --------------------------------------------------------------------------
@projects_bp.route("/<project_id>", methods=["GET"])
@AuthService.require_auth
def get_project(project_id: str):
    """Returns the full project document (including index) for a given ID."""
    try:
        user_id = g.user["user_id"]
        project = db.get_project_by_id(project_id, user_id)

        if not project:
            return jsonify({"status": "error", "message": "Project not found"}), 404

        return jsonify({
            "status": "success",
            "project": _serialize_full_project(project),
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# --------------------------------------------------------------------------
# PATCH /api/projects/<project_id>   — rename
# --------------------------------------------------------------------------
@projects_bp.route("/<project_id>", methods=["PATCH"])
@AuthService.require_auth
def rename_project(project_id: str):
    """Renames a project. Enforces uniqueness of (user, name)."""
    try:
        user_id = g.user["user_id"]
        raw_name = (request.json or {}).get("name", "")
        new_name = _sanitize_name(raw_name)

        if not new_name:
            return jsonify({"status": "error", "message": "Project name cannot be empty"}), 400

        found = db.update_project_name(project_id, user_id, new_name)
        if not found:
            return jsonify({"status": "error", "message": "Project not found"}), 404

        return jsonify({"status": "success", "name": new_name})
    except ValueError as e:
        return jsonify({"status": "error", "message": str(e)}), 409
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# --------------------------------------------------------------------------
# DELETE /api/projects/<project_id>
# --------------------------------------------------------------------------
@projects_bp.route("/<project_id>", methods=["DELETE"])
@AuthService.require_auth
def delete_project(project_id: str):
    """Permanently deletes a project owned by the authenticated user."""
    try:
        user_id = g.user["user_id"]
        deleted = db.delete_project(project_id, user_id)
        if not deleted:
            return jsonify({"status": "error", "message": "Project not found"}), 404
        return jsonify({"status": "success", "message": "Project deleted"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
