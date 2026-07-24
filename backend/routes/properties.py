import os
import uuid
import requests
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, current_app, send_from_directory
from flask_jwt_extended import jwt_required
from werkzeug.utils import secure_filename
from slugify import slugify
from models import db, Property, Inquiry


def geocode_address(address, city, state, zip_code):
    query = f"{address}, {city}, {state} {zip_code}"
    try:
        url = "https://nominatim.openstreetmap.org/search"
        params = {"q": query, "format": "json", "limit": 1}
        headers = {"User-Agent": "ABCRealtyApp/1.0"}
        response = requests.get(url, params=params, headers=headers, timeout=5)
        if response.status_code == 200:
            data = response.json()
            if data:
                return float(data[0]["lat"]), float(data[0]["lon"])
    except Exception:
        pass
    return None, None


properties_bp = Blueprint("properties", __name__)


def allowed_file(filename, allowed_set):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in allowed_set


def unique_filename(filename):
    ext = filename.rsplit(".", 1)[1].lower() if "." in filename else ""
    return f"{uuid.uuid4().hex}.{ext}"


# ─── Public endpoints ──────────────────────────────────────────────────────────

@properties_bp.route("", methods=["GET"])
def list_properties():
    query = Property.query

    # Filter by listing_type
    listing_type = request.args.get("listing_type")
    if listing_type:
        query = query.filter_by(listing_type=listing_type)

    # Filter by status
    # Public UI uses open/closed; admin uses yet_to_publish,published,closed
    status = request.args.get("status")
    if status:
        requested = []
        for raw in status.split(","):
            s = raw.strip().lower()
            if s in ("open", "available", "active"):
                requested.extend(["published", "under_contract"])
            elif s == "closed":
                requested.append("closed")
            elif s:
                requested.append(s)
        # de-dupe while preserving order
        statuses = list(dict.fromkeys(requested))
        query = query.filter(Property.status.in_(statuses))
    else:
        # Public default: Open + Closed (hide drafts)
        query = query.filter(Property.status.in_(["published", "closed", "under_contract"]))

    # Location filters
    # Search by property name or area (title, city, address)
    q = request.args.get("q")
    if q:
        from sqlalchemy import or_
        query = query.filter(
            or_(
                Property.title.ilike(f"%{q}%"),
                Property.city.ilike(f"%{q}%"),
                Property.address.ilike(f"%{q}%"),
                Property.zip_code.ilike(f"%{q}%"),
            )
        )

    city = request.args.get("city")
    if city:
        query = query.filter(Property.city.ilike(f"%{city}%"))

    state = request.args.get("state")
    if state:
        query = query.filter(Property.state.ilike(f"%{state}%"))

    zip_code = request.args.get("zip_code")
    if zip_code:
        query = query.filter(Property.zip_code.ilike(f"%{zip_code}%"))

    country = request.args.get("country")
    if country:
        query = query.filter(Property.country.ilike(f"%{country}%"))

    # Property type
    property_type = request.args.get("property_type")
    if property_type:
        query = query.filter(Property.property_type.ilike(f"%{property_type}%"))

    # Price range
    price_min = request.args.get("price_min", type=float)
    if price_min is not None:
        query = query.filter(Property.price >= price_min)

    price_max = request.args.get("price_max", type=float)
    if price_max is not None:
        query = query.filter(Property.price <= price_max)

    # Bedrooms / bathrooms
    bedrooms_min = request.args.get("bedrooms_min", type=int)
    if bedrooms_min is not None:
        query = query.filter(Property.bedrooms >= bedrooms_min)

    bathrooms_min = request.args.get("bathrooms_min", type=float)
    if bathrooms_min is not None:
        query = query.filter(Property.bathrooms >= bathrooms_min)

    # Sorting
    sort = request.args.get("sort", "newest")
    if sort == "price_asc":
        query = query.order_by(Property.price.asc())
    elif sort == "price_desc":
        query = query.order_by(Property.price.desc())
    else:
        query = query.order_by(Property.created_at.desc())

    # Pagination
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 12, type=int)
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        "properties": [p.to_dict() for p in paginated.items],
        "total": paginated.total,
        "pages": paginated.pages,
        "current_page": page,
        "per_page": per_page,
    }), 200


@properties_bp.route("/<string:slug>", methods=["GET"])
def get_property(slug):
    # Admin edit uses numeric id; public pages use slug
    if slug.isdigit():
        prop = db.session.get(Property, int(slug))
    else:
        prop = Property.query.filter_by(slug=slug).first()
    if not prop:
        return jsonify({"error": "Property not found"}), 404
    return jsonify(prop.to_dict(full=True)), 200


# ─── Admin endpoints ───────────────────────────────────────────────────────────

@properties_bp.route("", methods=["POST"])
@jwt_required()
def create_property():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    # Generate unique slug
    base_slug = slugify(data.get("title", "property"))
    slug = base_slug
    counter = 1
    while Property.query.filter_by(slug=slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1

    # Auto-geocode if missing
    lat = data.get("latitude")
    lon = data.get("longitude")
    if not lat or not lon:
        geo_lat, geo_lon = geocode_address(data.get("address", ""), data.get("city", ""), data.get("state", ""), data.get("zip_code", ""))
        lat = geo_lat or lat
        lon = geo_lon or lon

    prop = Property(
        title=data.get("title", "New Property"),
        slug=slug,
        listing_type=data.get("listing_type", "sale"),
        property_type=data.get("property_type", "Single Family"),
        status=data.get("status", "yet_to_publish"),
        price=data.get("price", 0),
        price_period=data.get("price_period", ""),
        bedrooms=data.get("bedrooms", 0),
        bathrooms=data.get("bathrooms", 0),
        sqft=data.get("sqft", 0),
        lot_size=data.get("lot_size", ""),
        year_built=data.get("year_built", 0),
        garage=data.get("garage", 0),
        address=data.get("address", ""),
        city=data.get("city", ""),
        state=data.get("state", ""),
        zip_code=data.get("zip_code", ""),
        country=data.get("country", "USA"),
        latitude=lat,
        longitude=lon,
        description=data.get("description", ""),
        contact_name=data.get("contact_name", ""),
        contact_phone=data.get("contact_phone", ""),
        contact_email=data.get("contact_email", ""),
    )
    prop.highlights = data.get("highlights", [])
    prop.basic_info = data.get("basic_info", {})
    prop.photos = data.get("photos", [])
    prop.documents = data.get("documents", [])

    if prop.status == "published":
        prop.published_at = datetime.now(timezone.utc)

    db.session.add(prop)
    db.session.commit()
    return jsonify(prop.to_dict(full=True)), 201


@properties_bp.route("/<int:prop_id>", methods=["PUT"])
@jwt_required()
def update_property(prop_id):
    prop = db.session.get(Property, prop_id)
    if not prop:
        return jsonify({"error": "Property not found"}), 404

    data = request.get_json()
    fields = [
        "title", "listing_type", "property_type", "price", "price_period",
        "bedrooms", "bathrooms", "sqft", "lot_size", "year_built", "garage",
        "address", "city", "state", "zip_code", "country", "latitude", "longitude",
        "description", "contact_name", "contact_phone", "contact_email",
    ]
    for field in fields:
        if field in data:
            setattr(prop, field, data[field])

    # Auto-geocode on update if address changed and coordinates are missing or explicitly not sent
    if "latitude" not in data or not data["latitude"]:
        geo_lat, geo_lon = geocode_address(prop.address, prop.city, prop.state, prop.zip_code)
        if geo_lat and geo_lon:
            prop.latitude = geo_lat
            prop.longitude = geo_lon

    if "highlights" in data:
        prop.highlights = data["highlights"]
    if "basic_info" in data:
        prop.basic_info = data["basic_info"]
    # Photos are managed only via /photos endpoints — never wipe them here
    if "documents" in data:
        prop.documents = data["documents"]

    prop.updated_at = datetime.now(timezone.utc)
    db.session.commit()
    return jsonify(prop.to_dict(full=True)), 200


@properties_bp.route("/<int:prop_id>/status", methods=["PATCH"])
@jwt_required()
def update_status(prop_id):
    prop = db.session.get(Property, prop_id)
    if not prop:
        return jsonify({"error": "Property not found"}), 404

    data = request.get_json()
    new_status = data.get("status")
    valid_statuses = ["yet_to_publish", "published", "closed"]
    if new_status not in valid_statuses:
        return jsonify({"error": f"Invalid status. Must be one of: {valid_statuses}"}), 400

    old_status = prop.status
    prop.status = new_status
    prop.updated_at = datetime.now(timezone.utc)

    if new_status == "published" and old_status != "published":
        prop.published_at = datetime.now(timezone.utc)

    db.session.commit()
    return jsonify(prop.to_dict(full=True)), 200


@properties_bp.route("/<int:prop_id>", methods=["DELETE"])
@jwt_required()
def delete_property(prop_id):
    prop = db.session.get(Property, prop_id)
    if not prop:
        return jsonify({"error": "Property not found"}), 404
    db.session.delete(prop)
    db.session.commit()
    return jsonify({"message": "Property deleted"}), 200


# ─── File upload endpoints ─────────────────────────────────────────────────────

@properties_bp.route("/<int:prop_id>/photos", methods=["POST"])
@jwt_required()
def upload_photos(prop_id):
    prop = db.session.get(Property, prop_id)
    if not prop:
        return jsonify({"error": "Property not found"}), 404

    files = request.files.getlist("photos")
    if not files:
        return jsonify({"error": "No photos provided. Use form field name 'photos'."}), 400

    allowed = current_app.config.get(
        "ALLOWED_IMAGE_EXTENSIONS", {"png", "jpg", "jpeg", "webp", "gif"}
    )
    upload_folder = current_app.config["UPLOAD_FOLDER"]
    os.makedirs(os.path.join(upload_folder, "photos"), exist_ok=True)

    # MIME → extension fallback when filename has no/odd extension (e.g. iPhone)
    mime_ext = {
        "image/jpeg": "jpg",
        "image/jpg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/gif": "gif",
        "image/heic": "heic",
        "image/heif": "heif",
    }

    saved_new = []
    rejected = []
    for file in files:
        if not file or not file.filename:
            rejected.append("empty filename")
            continue

        original = secure_filename(file.filename) or "photo"
        ext = original.rsplit(".", 1)[-1].lower() if "." in original else ""
        if ext not in allowed:
            # try content-type
            ext = mime_ext.get((file.mimetype or "").lower(), "")
        if ext in {"heic", "heif"}:
            rejected.append(f"{file.filename} (HEIC not supported — export as JPG/PNG)")
            continue
        if ext not in allowed:
            rejected.append(file.filename)
            continue

        filename = f"{uuid.uuid4().hex}.{ext}"
        file_path = os.path.join(upload_folder, "photos", filename)
        file.save(file_path)
        if not os.path.isfile(file_path) or os.path.getsize(file_path) == 0:
            rejected.append(file.filename)
            continue
        saved_new.append(f"/uploads/photos/{filename}")

    if not saved_new:
        return jsonify({
            "error": "No valid images were saved. Use JPG, PNG, WEBP, or GIF.",
            "rejected": rejected,
        }), 400

    # New uploads become the cover (placed first), then keep existing
    prop.photos = saved_new + list(prop.photos or [])
    prop.updated_at = datetime.now(timezone.utc)
    db.session.commit()
    return jsonify({"photos": prop.photos, "uploaded": len(saved_new)}), 200


@properties_bp.route("/<int:prop_id>/photos", methods=["PUT"])
@jwt_required()
def replace_photos(prop_id):
    """Replace the full photo list (used after removals / reorder)."""
    prop = db.session.get(Property, prop_id)
    if not prop:
        return jsonify({"error": "Property not found"}), 404
    data = request.get_json() or {}
    if "photos" not in data or not isinstance(data["photos"], list):
        return jsonify({"error": "photos array is required"}), 400
    prop.photos = data["photos"]
    prop.updated_at = datetime.now(timezone.utc)
    db.session.commit()
    return jsonify({"photos": prop.photos}), 200


@properties_bp.route("/<int:prop_id>/documents", methods=["POST"])
@jwt_required()
def upload_documents(prop_id):
    prop = db.session.get(Property, prop_id)
    if not prop:
        return jsonify({"error": "Property not found"}), 404

    if "documents" not in request.files:
        return jsonify({"error": "No documents provided"}), 400

    files = request.files.getlist("documents")
    allowed = current_app.config.get("ALLOWED_DOC_EXTENSIONS", {"pdf", "doc", "docx"})
    upload_folder = current_app.config["UPLOAD_FOLDER"]
    os.makedirs(os.path.join(upload_folder, "documents"), exist_ok=True)

    saved_paths = list(prop.documents)
    for file in files:
        if file and allowed_file(file.filename, allowed):
            filename = unique_filename(secure_filename(file.filename))
            file_path = os.path.join(upload_folder, "documents", filename)
            file.save(file_path)
            saved_paths.append({"name": file.filename, "path": f"/uploads/documents/{filename}"})

    prop.documents = saved_paths
    prop.updated_at = datetime.now(timezone.utc)
    db.session.commit()
    return jsonify({"documents": prop.documents}), 200


# ─── Inquiry endpoint ──────────────────────────────────────────────────────────

@properties_bp.route("/<int:prop_id>/inquire", methods=["POST"])
def inquire(prop_id):
    data = request.get_json()
    if not data or not data.get("name") or not data.get("email") or not data.get("message"):
        return jsonify({"error": "Name, email, and message are required"}), 400

    prop = db.session.get(Property, prop_id)
    if not prop:
        return jsonify({"error": "Property not found"}), 404

    inquiry = Inquiry(
        name=data["name"],
        email=data["email"],
        phone=data.get("phone", ""),
        message=data["message"],
        property_id=prop_id,
        property_title=prop.title,
    )
    db.session.add(inquiry)
    db.session.commit()
    return jsonify({"message": "Inquiry submitted successfully!"}), 201


@properties_bp.route("/inquiries", methods=["POST"])
def create_inquiry():
    data = request.get_json()
    if not data or not data.get("name") or not data.get("email") or not data.get("message"):
        return jsonify({"error": "Name, email, and message are required"}), 400

    inquiry = Inquiry(
        name=data["name"],
        email=data["email"],
        phone=data.get("phone", ""),
        message=data["message"],
        property_id=data.get("property_id"),
        property_title=data.get("property_title", ""),
    )
    db.session.add(inquiry)
    db.session.commit()
    return jsonify({"message": "Inquiry submitted successfully!"}), 201


@properties_bp.route("/inquiries", methods=["GET"])
@jwt_required()
def list_inquiries():
    inquiries = Inquiry.query.order_by(Inquiry.created_at.desc()).all()
    return jsonify([i.to_dict() for i in inquiries]), 200
