from flask import Flask
from flask_cors import CORS
from flask_bcrypt import Bcrypt

from routes.auth_routes import auth_bp, init_bcrypt
from routes.projects_routes import projects_bp
from routes.indexer_routes import indexer_bp


def create_app() -> Flask:
    """
    Application factory pattern.
    - Creates the Flask app
    - Configures extensions (CORS, Bcrypt)
    - Registers all Blueprints
    """
    app = Flask(__name__)
    CORS(app)

    bcrypt = Bcrypt(app)

    # Inject the shared Bcrypt instance into the auth blueprint
    # (avoids circular imports and keeps Bcrypt as a single instance)
    init_bcrypt(bcrypt)

    # Register all route blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(projects_bp)
    app.register_blueprint(indexer_bp)

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True, port=5000)
