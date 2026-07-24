from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from models import Property, SaleRecord, Inquiry
from datetime import datetime, timezone, timedelta
from sqlalchemy import func

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_stats():
    """Overall property stats for admin dashboard."""
    total = Property.query.count()
    for_sale = Property.query.filter_by(listing_type="sale").count()
    for_lease = Property.query.filter_by(listing_type="lease").count()
    published = Property.query.filter_by(status="published").count()
    under_contract = Property.query.filter_by(status="under_contract").count()
    closed = Property.query.filter_by(status="closed").count()
    yet_to_publish = Property.query.filter_by(status="yet_to_publish").count()
    total_inquiries = Inquiry.query.count()

    return jsonify({
        "total_properties": total,
        "for_sale": for_sale,
        "for_lease": for_lease,
        "published": published,
        "under_contract": under_contract,
        "closed": closed,
        "yet_to_publish": yet_to_publish,
        "total_inquiries": total_inquiries,
    }), 200


@dashboard_bp.route("/sales", methods=["GET"])
@jwt_required()
def get_sales():
    """Last year's sales analytics."""
    one_year_ago = datetime.now(timezone.utc) - timedelta(days=365)

    records = SaleRecord.query.filter(
        SaleRecord.sale_date >= one_year_ago
    ).order_by(SaleRecord.sale_date.asc()).all()

    total_volume = sum(r.sale_price for r in records)
    total_count = len(records)

    # Group by month
    monthly = {}
    for r in records:
        key = r.sale_date.strftime("%Y-%m") if r.sale_date else "Unknown"
        if key not in monthly:
            monthly[key] = {"month": key, "count": 0, "volume": 0}
        monthly[key]["count"] += 1
        monthly[key]["volume"] += r.sale_price

    # Group by city
    city_sales = {}
    for r in records:
        city = r.city or "Unknown"
        if city not in city_sales:
            city_sales[city] = {"city": city, "count": 0, "volume": 0}
        city_sales[city]["count"] += 1
        city_sales[city]["volume"] += r.sale_price

    # Group by property type
    type_sales = {}
    for r in records:
        ptype = r.property_type or "Other"
        if ptype not in type_sales:
            type_sales[ptype] = {"type": ptype, "count": 0, "volume": 0}
        type_sales[ptype]["count"] += 1
        type_sales[ptype]["volume"] += r.sale_price

    # Recent closed properties from properties table
    recent_closed = Property.query.filter_by(status="closed").order_by(
        Property.updated_at.desc()
    ).limit(5).all()

    return jsonify({
        "total_volume": total_volume,
        "total_count": total_count,
        "monthly": sorted(monthly.values(), key=lambda x: x["month"]),
        "by_city": sorted(city_sales.values(), key=lambda x: x["volume"], reverse=True),
        "by_type": sorted(type_sales.values(), key=lambda x: x["volume"], reverse=True),
        "recent_closed": [p.to_dict() for p in recent_closed],
        "records": [r.to_dict() for r in records],
    }), 200


@dashboard_bp.route("/inquiries", methods=["GET"])
@jwt_required()
def get_inquiries():
    """All inquiries for admin."""
    from models import Inquiry
    inquiries = Inquiry.query.order_by(Inquiry.created_at.desc()).limit(50).all()
    return jsonify([i.to_dict() for i in inquiries]), 200
