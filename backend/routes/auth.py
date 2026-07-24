from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from werkzeug.security import check_password_hash
from models import db, Admin

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data or not data.get("username") or not data.get("password"):
        return jsonify({"error": "Username and password required"}), 400

    admin = Admin.query.filter_by(username=data["username"]).first()
    if not admin or not check_password_hash(admin.password_hash, data["password"]):
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_access_token(identity=str(admin.id))
    return jsonify({"access_token": token, "admin": admin.to_dict()}), 200


@auth_bp.route("/verify", methods=["GET"])
def verify():
    from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
    try:
        verify_jwt_in_request()
        admin_id = get_jwt_identity()
        admin = db.session.get(Admin, int(admin_id))
        if not admin:
            return jsonify({"error": "Admin not found"}), 404
        return jsonify({"admin": admin.to_dict()}), 200
    except Exception:
        return jsonify({"error": "Invalid or expired token"}), 401
