import os
import bleach
from flask import Blueprint, request, jsonify, g
from services.auth import AuthService
from db.db import db
from services.trie import BookTrie

indexer_bp = Blueprint("indexer", __name__, url_prefix="/api/indexer")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

_MAX_PROJECT_NAME_LEN = 100


def _sanitize_project_name(raw: str) -> str:
    """
    Strips all HTML tags and attributes from the project name using bleach,
    then trims whitespace and enforces a maximum length.
    Falls back to a timestamp-based default if the result is empty.
    """
    from datetime import datetime, timezone
    cleaned = bleach.clean(raw or "", tags=[], strip=True).strip()
    cleaned = cleaned[:_MAX_PROJECT_NAME_LEN]
    if not cleaned:
        cleaned = f"Project · {datetime.now(timezone.utc).strftime('%b %d, %Y %H:%M')} UTC"
    return cleaned


# --------------------------------------------------------------------------
# POST /api/indexer/suggest-exclusions  (JWT-protected)
# --------------------------------------------------------------------------
@indexer_bp.route("/suggest-exclusions", methods=["POST"])
@AuthService.require_auth
def suggest_exclusions():
    """Calculates TF-IDF scores for uploaded files and returns suggested words."""
    try:
        req_data = request.json or {}
        files = req_data.get("files", [])
        contents = [f["content"] for f in files]
        suggestions = BookTrie.calculate_tfidf(contents)
        return jsonify({"status": "success", "suggestions": suggestions})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# --------------------------------------------------------------------------
# POST /api/indexer/process  (JWT-protected)
# --------------------------------------------------------------------------
@indexer_bp.route("/process", methods=["POST"])
@AuthService.require_auth
def process_data():
    """
    Builds the trie index from the provided pages and exclusion list,
    persists the result as a new Project document in MongoDB,
    and returns the project_id alongside the computed index.
    """
    try:
        req_data = request.json or {}
        files: list = req_data.get("files", [])          # [{name, content}]
        exclude_words: list = req_data.get("exclude_words", [])  # [str]
        raw_project_name: str = req_data.get("project_name", "")

        project_name = _sanitize_project_name(raw_project_name)

        trie = BookTrie()
        for word in exclude_words:
            trie.add_exclude_word(word)

        for i, file_obj in enumerate(files):
            trie.process_page_text(file_obj["content"], i + 1)

        index_data = trie.get_alphabetical_index()

        stats = {
            "total_words": len(index_data),
            "total_pages": len(files),
            "total_excluded": len(exclude_words),
        }

        # Persist the project under the authenticated user
        user_id = g.user["user_id"]
        try:
            project_id = db.create_project(
                user_id=user_id,
                name=project_name,
                pages=files,
                index_data=index_data,
                stats=stats,
            )
        except ValueError as e:
            return jsonify({"status": "error", "message": str(e)}), 409

        return jsonify({
            "status": "success",
            "project_id": project_id,
            "project_name": project_name,
            "index": index_data,
            "stats": stats,
        })

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
