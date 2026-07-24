from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone
import json

db = SQLAlchemy()


class Property(db.Model):
    __tablename__ = "properties"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    slug = db.Column(db.String(255), unique=True, nullable=False)

    # Type & Status
    listing_type = db.Column(db.String(10), nullable=False)  # "sale" | "lease"
    property_type = db.Column(db.String(50), nullable=False, default="Single Family")
    status = db.Column(db.String(30), nullable=False, default="yet_to_publish")
    # Status values: yet_to_publish | published | under_contract | closed

    # Pricing
    price = db.Column(db.Float, nullable=False)
    price_period = db.Column(db.String(20), default="")  # "/mo" for lease

    # Property specs
    bedrooms = db.Column(db.Integer, default=0)
    bathrooms = db.Column(db.Float, default=0)
    sqft = db.Column(db.Integer, default=0)
    lot_size = db.Column(db.String(50), default="")
    year_built = db.Column(db.Integer, default=0)
    garage = db.Column(db.Integer, default=0)

    # Location
    address = db.Column(db.String(255), default="")
    city = db.Column(db.String(100), default="")
    state = db.Column(db.String(50), default="")
    zip_code = db.Column(db.String(20), default="")
    country = db.Column(db.String(50), default="USA")
    latitude = db.Column(db.Float, default=None)
    longitude = db.Column(db.Float, default=None)

    # Content
    description = db.Column(db.Text, default="")
    _highlights = db.Column("highlights", db.Text, default="[]")
    _basic_info = db.Column("basic_info", db.Text, default="{}")

    # Contact for this property
    contact_name = db.Column(db.String(100), default="")
    contact_phone = db.Column(db.String(30), default="")
    contact_email = db.Column(db.String(100), default="")

    # Files (stored as JSON arrays of paths)
    _photos = db.Column("photos", db.Text, default="[]")
    _documents = db.Column("documents", db.Text, default="[]")

    # Timestamps
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))
    published_at = db.Column(db.DateTime, default=None)

    # JSON property accessors
    @property
    def highlights(self):
        return json.loads(self._highlights or "[]")

    @highlights.setter
    def highlights(self, value):
        self._highlights = json.dumps(value)

    @property
    def basic_info(self):
        return json.loads(self._basic_info or "{}")

    @basic_info.setter
    def basic_info(self, value):
        self._basic_info = json.dumps(value)

    @property
    def photos(self):
        return json.loads(self._photos or "[]")

    @photos.setter
    def photos(self, value):
        self._photos = json.dumps(value)

    @property
    def documents(self):
        return json.loads(self._documents or "[]")

    @documents.setter
    def documents(self, value):
        self._documents = json.dumps(value)

    @property
    def public_status(self):
        """User-facing status: open or closed."""
        return "closed" if self.status == "closed" else "open"

    def to_dict(self, full=False):
        base = {
            "id": self.id,
            "title": self.title,
            "slug": self.slug,
            "listing_type": self.listing_type,
            "property_type": self.property_type,
            "status": self.status,
            "public_status": self.public_status,
            "price": self.price,
            "price_period": self.price_period,
            "bedrooms": self.bedrooms,
            "bathrooms": self.bathrooms,
            "sqft": self.sqft,
            "lot_size": self.lot_size,
            "year_built": self.year_built,
            "garage": self.garage,
            "address": self.address,
            "city": self.city,
            "state": self.state,
            "zip_code": self.zip_code,
            "country": self.country,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "photos": self.photos,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "published_at": self.published_at.isoformat() if self.published_at else None,
        }
        if full:
            base.update({
                "description": self.description,
                "highlights": self.highlights,
                "basic_info": self.basic_info,
                "contact_name": self.contact_name,
                "contact_phone": self.contact_phone,
                "contact_email": self.contact_email,
                "documents": self.documents,
                "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            })
        return base


class Admin(db.Model):
    __tablename__ = "admins"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {"id": self.id, "username": self.username}


class Inquiry(db.Model):
    __tablename__ = "inquiries"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(30), default="")
    message = db.Column(db.Text, nullable=False)
    property_id = db.Column(db.Integer, db.ForeignKey("properties.id"), nullable=True)
    property_title = db.Column(db.String(255), default="")
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "message": self.message,
            "property_id": self.property_id,
            "property_title": self.property_title,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class SaleRecord(db.Model):
    __tablename__ = "sale_records"

    id = db.Column(db.Integer, primary_key=True)
    property_id = db.Column(db.Integer, db.ForeignKey("properties.id"), nullable=True)
    property_title = db.Column(db.String(255), default="")
    sale_price = db.Column(db.Float, nullable=False)
    sale_date = db.Column(db.DateTime, nullable=False)
    city = db.Column(db.String(100), default="")
    state = db.Column(db.String(50), default="")
    property_type = db.Column(db.String(50), default="")

    def to_dict(self):
        return {
            "id": self.id,
            "property_id": self.property_id,
            "property_title": self.property_title,
            "sale_price": self.sale_price,
            "sale_date": self.sale_date.isoformat() if self.sale_date else None,
            "city": self.city,
            "state": self.state,
            "property_type": self.property_type,
        }
