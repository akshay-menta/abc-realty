import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from models import db
from config import Config


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Ensure upload folder exists
    os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(os.path.join(Config.UPLOAD_FOLDER, "photos"), exist_ok=True)
    os.makedirs(os.path.join(Config.UPLOAD_FOLDER, "documents"), exist_ok=True)

    # Extensions
    db.init_app(app)
    JWTManager(app)
    CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173", "http://localhost:3000", "http://localhost:5174"]}})

    # Register blueprints
    from routes.auth import auth_bp
    from routes.properties import properties_bp
    from routes.chatbot import chatbot_bp
    from routes.dashboard import dashboard_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(properties_bp, url_prefix="/api/properties")
    app.register_blueprint(chatbot_bp, url_prefix="/api/chat")
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")

    # Serve uploaded files
    @app.route("/uploads/<path:filename>")
    def uploaded_file(filename):
        return send_from_directory(Config.UPLOAD_FOLDER, filename)

    # Health check
    @app.route("/api/health")
    def health():
        return {"status": "ok", "company": Config.COMPANY_NAME}, 200

    with app.app_context():
        db.create_all()
        # Legacy cleanup: under_contract → published (public shows Open/Closed only)
        try:
            from models import Property
            legacy = Property.query.filter_by(status="under_contract").all()
            for prop in legacy:
                prop.status = "published"
            if legacy:
                db.session.commit()
        except Exception:
            db.session.rollback()

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5001)
