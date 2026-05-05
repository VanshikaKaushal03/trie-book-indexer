import os
import uuid
from datetime import datetime, timezone
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError
from dotenv import load_dotenv

load_dotenv()


class Database:
    """
    Manages the MongoDB connection and exposes typed data-access methods.

    Encapsulation: the MongoClient and raw collections are private (_client, _db,
    _projects). External code only interacts through the public API below.

    Collections:
        users    — { _id: uuid str, username: str, password: str (bcrypt) }
        projects — { _id: uuid str, user_id: str, name: str, created_at: datetime,
                     pages: list[{name, content}], index: list[{word, pages}],
                     stats: {total_words, total_pages, total_excluded} }
    """

    def __init__(self) -> None:
        self._uri: str = os.getenv("MONGO_URI", "mongodb://localhost:27017")
        self._client: MongoClient = MongoClient(self._uri)
        self._db = self._client.get_database("trie_indexer_db")

        # Named references to collections (still private — mutated only by this class)
        self._users = self._db.get_collection("users")
        self._projects = self._db.get_collection("projects")

        # Enforce (user_id, name) uniqueness per user at the DB level.
        # create_index is idempotent — safe to call on every startup.
        self._projects.create_index(
            [("user_id", 1), ("name", 1)],
            unique=True,
            name="unique_user_project_name",
        )

    # ------------------------------------------------------------------
    # User operations
    # ------------------------------------------------------------------

    def find_user_by_username(self, username: str) -> dict | None:
        """Finds a user document by username. Returns None if not found."""
        return self._users.find_one({"username": username})

    def find_user_by_id(self, user_id: str) -> dict | None:
        """Finds a user document by UUID string _id. Returns None if not found."""
        return self._users.find_one({"_id": user_id})

    def create_user(self, username: str, hashed_password: str) -> str:
        """
        Inserts a new user with a UUID primary key.
        Returns the generated user_id string.
        """
        user_id = str(uuid.uuid4())
        self._users.insert_one({
            "_id": user_id,
            "username": username,
            "password": hashed_password,
        })
        return user_id

    # ------------------------------------------------------------------
    # Project operations
    # ------------------------------------------------------------------

    def create_project(
        self,
        user_id: str,
        name: str,
        pages: list,
        index_data: list,
        stats: dict,
    ) -> str:
        """
        Persists a new project document and returns the generated project UUID.

        Args:
            user_id:    Owner's user UUID.
            name:       Sanitized display name for the project.
            pages:      List of {name, content} dicts (raw page data).
            index_data: List of {word, pages} dicts (computed trie output).
            stats:      Dict with total_words, total_pages, total_excluded.
        """
        project_id = str(uuid.uuid4())
        try:
            self._projects.insert_one({
                "_id": project_id,
                "user_id": user_id,
                "name": name,
                "created_at": datetime.now(timezone.utc),
                "pages": pages,
                "index": index_data,
                "stats": stats,
            })
        except DuplicateKeyError:
            raise ValueError(f"A project named '{name}' already exists for this account")
        return project_id

    def get_projects_for_user(self, user_id: str) -> list:
        """
        Returns a list of project summary documents for a user (newest first).
        The heavy `index` and `pages` fields are excluded to keep the payload small.
        """
        cursor = self._projects.find(
            {"user_id": user_id},
            {"index": 0, "pages": 0},   # projection: omit heavy blobs
        ).sort("created_at", -1)
        return list(cursor)

    def get_project_by_id(self, project_id: str, user_id: str) -> dict | None:
        """
        Returns the full project document (including index data) for a given
        project_id, scoped to the requesting user (prevents cross-user access).
        Returns None if not found or unauthorized.
        """
        return self._projects.find_one({"_id": project_id, "user_id": user_id})

    def update_project_name(self, project_id: str, user_id: str, new_name: str) -> bool:
        """
        Renames a project. Returns True if the document was found and updated.
        Raises ValueError if another project with the same name already exists for the user.
        """
        try:
            result = self._projects.update_one(
                {"_id": project_id, "user_id": user_id},
                {"$set": {"name": new_name}},
            )
            return result.matched_count > 0
        except DuplicateKeyError:
            raise ValueError(f"A project named '{new_name}' already exists for this account")

    def delete_project(self, project_id: str, user_id: str) -> bool:
        """Deletes a project owned by user_id. Returns True if deleted."""
        result = self._projects.delete_one({"_id": project_id, "user_id": user_id})
        return result.deleted_count > 0


# Singleton — imported across blueprints to share the same connection pool.
db = Database()
