"""
Seed script — populates the database with sample data for ABC Realty.
Run: python seed.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app import create_app
from models import db, Property, Admin, SaleRecord
from werkzeug.security import generate_password_hash
from datetime import datetime, timezone, timedelta
import random

app = create_app()

SAMPLE_PROPERTIES = [
    {
        "title": "Sunset Ridge Manor",
        "listing_type": "sale",
        "property_type": "Single Family",
        "status": "published",
        "price": 875000,
        "bedrooms": 4,
        "bathrooms": 3.5,
        "sqft": 3200,
        "lot_size": "0.35 acres",
        "year_built": 2019,
        "garage": 2,
        "address": "4821 Ridgeview Terrace",
        "city": "Austin",
        "state": "TX",
        "zip_code": "78731",
        "country": "USA",
        "latitude": 30.3460,
        "longitude": -97.7739,
        "description": "Welcome to Sunset Ridge Manor — a stunning contemporary home nestled in the heart of Austin's most sought-after neighborhood. This meticulously maintained 4-bedroom masterpiece features soaring 10-foot ceilings, an open-concept living area flooded with natural light, and a chef's kitchen equipped with top-of-the-line appliances. The expansive primary suite boasts a spa-inspired ensuite and a walk-in closet you have to see to believe. Step outside to your private oasis featuring a resort-style pool, outdoor kitchen, and beautifully landscaped backyard perfect for entertaining.",
        "highlights": [
            "Resort-style pool & outdoor kitchen",
            "Chef's kitchen with Thermador appliances",
            "Primary suite with spa bath",
            "3-car garage with EV charging",
            "Smart home technology throughout",
            "Award-winning Eanes ISD schools"
        ],
        "basic_info": {
            "HOA": "$250/month",
            "Parking": "2-car attached garage",
            "Heating": "Central HVAC",
            "Cooling": "Central Air",
            "Laundry": "In-unit",
            "Basement": "None",
            "Pool": "Yes - Private",
            "Pet Policy": "N/A"
        },
        "contact_name": "Sarah Mitchell",
        "contact_phone": "(512) 555-0182",
        "contact_email": "sarah@abcrealty.com",
        "photos": [
            "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200",
            "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200",
            "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200",
            "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200",
            "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200",
            "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200",
        ],
    },
    {
        "title": "Lakefront Haven",
        "listing_type": "sale",
        "property_type": "Single Family",
        "status": "published",
        "price": 1250000,
        "bedrooms": 5,
        "bathrooms": 4,
        "sqft": 4100,
        "lot_size": "0.8 acres",
        "year_built": 2021,
        "garage": 3,
        "address": "1203 Lakeview Drive",
        "city": "San Antonio",
        "state": "TX",
        "zip_code": "78248",
        "country": "USA",
        "latitude": 29.5901,
        "longitude": -98.4938,
        "description": "Experience lakefront luxury living at its finest. This architectural masterpiece sits on nearly an acre of pristine waterfront property, offering breathtaking panoramic lake views from virtually every room. The open floor plan seamlessly connects the living spaces to an expansive covered terrace, making it the ultimate entertainer's paradise. The gourmet kitchen features custom cabinetry, quartz countertops, and a massive center island. The primary suite is a true retreat with private balcony lake views, a soaking tub, and dual vanities.",
        "highlights": [
            "Direct lake frontage with private dock",
            "Panoramic water views from all levels",
            "Gourmet kitchen with butler's pantry",
            "Covered outdoor living with fireplace",
            "Home theater & game room",
            "Whole-home generator"
        ],
        "basic_info": {
            "HOA": "$400/month",
            "Parking": "3-car attached garage",
            "Heating": "Dual-zone HVAC",
            "Cooling": "Dual-zone Central Air",
            "Laundry": "In-unit",
            "Waterfront": "Yes - Lake access",
            "Pool": "Yes - Private",
            "Pet Policy": "N/A"
        },
        "contact_name": "James Rodriguez",
        "contact_phone": "(210) 555-0247",
        "contact_email": "james@abcrealty.com",
        "photos": [
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200",
            "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=1200",
            "https://images.unsplash.com/photo-1575517111839-3a3843ee7f5d?w=1200",
            "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1200",
            "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200",
            "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200",
        ],
    },
    {
        "title": "The Willow Estate",
        "listing_type": "sale",
        "property_type": "Single Family",
        "status": "published",
        "price": 625000,
        "bedrooms": 4,
        "bathrooms": 3,
        "sqft": 2850,
        "lot_size": "0.25 acres",
        "year_built": 2017,
        "garage": 2,
        "address": "7734 Willow Creek Blvd",
        "city": "Dallas",
        "state": "TX",
        "zip_code": "75205",
        "country": "USA",
        "latitude": 32.8505,
        "longitude": -96.7891,
        "description": "The Willow Estate is a stunning example of classic Texas elegance meets modern design. Located in one of Dallas's most prestigious neighborhoods, this home features a grand two-story entry, formal dining room, and a spectacular family room with floor-to-ceiling windows overlooking the lush backyard. The gourmet kitchen has been recently updated with custom cabinetry and professional-grade appliances. The first-floor primary suite is a sanctuary of its own with a lavish bath and custom walk-in closet system.",
        "highlights": [
            "Highland Park ISD schools",
            "Renovated gourmet kitchen (2023)",
            "First-floor primary suite",
            "Heated spa & outdoor fireplace",
            "New roof (2022)",
            "Walking distance to parks"
        ],
        "basic_info": {
            "HOA": "$150/month",
            "Parking": "2-car garage",
            "Heating": "Central HVAC",
            "Cooling": "Central Air",
            "Laundry": "In-unit",
            "Pool": "No",
            "Spa": "Yes"
        },
        "contact_name": "Sarah Mitchell",
        "contact_phone": "(512) 555-0182",
        "contact_email": "sarah@abcrealty.com",
        "photos": [
            "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200",
            "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200",
            "https://images.unsplash.com/photo-1556912998-c57cc6b63cd7?w=1200",
            "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=1200",
        ],
    },
    {
        "title": "Cedar Bluff Residence",
        "listing_type": "sale",
        "property_type": "Single Family",
        "status": "closed",
        "price": 490000,
        "bedrooms": 3,
        "bathrooms": 2.5,
        "sqft": 2100,
        "lot_size": "0.18 acres",
        "year_built": 2015,
        "garage": 2,
        "address": "3301 Cedar Bluff Court",
        "city": "Houston",
        "state": "TX",
        "zip_code": "77024",
        "country": "USA",
        "latitude": 29.7604,
        "longitude": -95.3698,
        "description": "A beautifully maintained single-family home in the heart of Houston's Memorial area. Cedar Bluff Residence offers the perfect blend of comfort and style with its spacious open floor plan, updated kitchen, and inviting outdoor living space. This home is ideal for families seeking top-rated schools, convenient access to major employment centers, and the vibrant Houston lifestyle.",
        "highlights": [
            "Memorial ISD schools",
            "Updated kitchen & bathrooms",
            "Covered patio",
            "Mature tree-lined street",
            "Near Energy Corridor"
        ],
        "basic_info": {
            "HOA": "$120/month",
            "Parking": "2-car garage",
            "Heating": "Central HVAC",
            "Cooling": "Central Air",
            "Laundry": "In-unit"
        },
        "contact_name": "James Rodriguez",
        "contact_phone": "(210) 555-0247",
        "contact_email": "james@abcrealty.com",
        "photos": [
            "https://images.unsplash.com/photo-1549517045-bc93de075e53?w=1200",
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200",
            "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1200",
        ],
    },
    {
        "title": "Highland Park Villa",
        "listing_type": "sale",
        "property_type": "Single Family",
        "status": "yet_to_publish",
        "price": 750000,
        "bedrooms": 4,
        "bathrooms": 3,
        "sqft": 2900,
        "lot_size": "0.22 acres",
        "year_built": 2020,
        "garage": 2,
        "address": "518 Highland Park Drive",
        "city": "Plano",
        "state": "TX",
        "zip_code": "75075",
        "country": "USA",
        "latitude": 33.0198,
        "longitude": -96.6989,
        "description": "Coming soon — Highland Park Villa is a meticulously designed modern residence in one of Plano's most coveted communities. This 4-bedroom home features clean architectural lines, premium finishes throughout, and a seamless indoor-outdoor living experience. Contact us to get early access information.",
        "highlights": [
            "Coming soon — exclusive pre-listing",
            "Modern architectural design",
            "Open-concept main living",
            "Premium finishes throughout",
            "Plano ISD schools"
        ],
        "basic_info": {
            "HOA": "$200/month",
            "Parking": "2-car garage"
        },
        "contact_name": "Sarah Mitchell",
        "contact_phone": "(512) 555-0182",
        "contact_email": "sarah@abcrealty.com",
        "photos": [
            "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1200",
            "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=1200",
        ],
    },
    {
        "title": "Downtown Loft 42",
        "listing_type": "lease",
        "property_type": "Condo",
        "status": "published",
        "price": 2800,
        "price_period": "/mo",
        "bedrooms": 2,
        "bathrooms": 2,
        "sqft": 1100,
        "lot_size": "",
        "year_built": 2018,
        "garage": 1,
        "address": "42 Congress Avenue, Unit 1502",
        "city": "Austin",
        "state": "TX",
        "zip_code": "78701",
        "country": "USA",
        "latitude": 30.2672,
        "longitude": -97.7431,
        "description": "Live in the heart of Downtown Austin in this stunning 15th-floor loft with sweeping city skyline views. Downtown Loft 42 is a sophisticated urban retreat featuring polished concrete floors, floor-to-ceiling windows, and an open layout designed for modern living. The building offers world-class amenities including a rooftop pool, fitness center, co-working lounge, and 24/7 concierge. Walking distance to the best restaurants, entertainment, and employers on 6th Street and Congress Avenue.",
        "highlights": [
            "15th floor panoramic city views",
            "Floor-to-ceiling windows",
            "Rooftop pool & sky lounge",
            "24/7 concierge & secure entry",
            "Walk Score: 98 — Walker's Paradise",
            "Included: water, trash, internet"
        ],
        "basic_info": {
            "Lease Term": "12 months (flexible)",
            "Pets": "Cats allowed, no dogs",
            "Parking": "1 assigned garage spot",
            "Utilities": "Water & trash included",
            "Laundry": "In-unit",
            "Cooling": "Central Air",
            "Building Amenities": "Rooftop pool, gym, co-working"
        },
        "contact_name": "Emily Chen",
        "contact_phone": "(512) 555-0391",
        "contact_email": "emily@abcrealty.com",
        "photos": [
            "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200",
            "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200",
            "https://images.unsplash.com/photo-1588854337221-4cf9fa96059c?w=1200",
            "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1200",
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200",
        ],
    },
    {
        "title": "The Greenway Apartment",
        "listing_type": "lease",
        "property_type": "Apartment",
        "status": "published",
        "price": 1950,
        "price_period": "/mo",
        "bedrooms": 1,
        "bathrooms": 1,
        "sqft": 780,
        "lot_size": "",
        "year_built": 2020,
        "garage": 1,
        "address": "8800 Broadway Street, Unit 305",
        "city": "San Antonio",
        "state": "TX",
        "zip_code": "78217",
        "country": "USA",
        "latitude": 29.5270,
        "longitude": -98.4351,
        "description": "The Greenway Apartment offers the perfect blend of contemporary design and neighborhood charm in one of San Antonio's most vibrant corridors. This 1-bedroom unit features a modern kitchen with quartz counters and stainless appliances, hardwood-style flooring, and a private balcony overlooking the lush greenway park. The community offers a resort-style pool, dog park, and a state-of-the-art fitness center.",
        "highlights": [
            "Private balcony with greenway views",
            "Modern kitchen with quartz counters",
            "Resort-style pool & dog park",
            "In-unit washer/dryer",
            "Pet-friendly community",
            "Near The Pearl & River Walk"
        ],
        "basic_info": {
            "Lease Term": "12 months",
            "Pets": "Dogs & cats allowed (deposit req.)",
            "Parking": "1 assigned spot",
            "Utilities": "Tenant pays all",
            "Laundry": "In-unit",
            "Cooling": "Central Air"
        },
        "contact_name": "Emily Chen",
        "contact_phone": "(512) 555-0391",
        "contact_email": "emily@abcrealty.com",
        "photos": [
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200",
            "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200",
            "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=1200",
            "https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=1200",
        ],
    },
    {
        "title": "Riverstone Commercial Plaza",
        "listing_type": "lease",
        "property_type": "Commercial",
        "status": "published",
        "price": 5500,
        "price_period": "/mo",
        "bedrooms": 0,
        "bathrooms": 2,
        "sqft": 2400,
        "lot_size": "0.12 acres",
        "year_built": 2016,
        "garage": 0,
        "address": "1100 Riverstone Way, Suite 200",
        "city": "Austin",
        "state": "TX",
        "zip_code": "78704",
        "country": "USA",
        "latitude": 30.2460,
        "longitude": -97.7640,
        "description": "Premium Class-A office space in the heart of South Austin's thriving business district. This 2,400 square foot suite is move-in ready with high-end finishes, an open office floor plan with multiple private offices, a large conference room, and a fully equipped break room. Building features include covered parking, 24/7 key card access, fiber optic internet, and on-site property management. Ideal for tech companies, professional services, or creative agencies.",
        "highlights": [
            "Class-A office finishes",
            "Private offices + conference room",
            "High-speed fiber optic internet",
            "24/7 secure key card access",
            "On-site property management",
            "Convenient South Austin location"
        ],
        "basic_info": {
            "Lease Term": "1-3 years",
            "NNN Expenses": "$8.50/sqft/yr",
            "Parking": "4 covered spots included",
            "Utilities": "Electric & gas by tenant",
            "Internet": "Fiber optic available"
        },
        "contact_name": "James Rodriguez",
        "contact_phone": "(210) 555-0247",
        "contact_email": "james@abcrealty.com",
        "photos": [
            "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200",
            "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200",
            "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1200",
        ],
    },
]

SALE_RECORDS_DATA = [
    # Last 12 months of sales
    {"property_title": "Meadow View Estate", "sale_price": 485000, "months_ago": 1, "city": "Austin", "state": "TX", "property_type": "Single Family"},
    {"property_title": "Oak Canyon Residence", "sale_price": 620000, "months_ago": 1, "city": "Austin", "state": "TX", "property_type": "Single Family"},
    {"property_title": "Sapphire Cove Townhome", "sale_price": 340000, "months_ago": 2, "city": "San Antonio", "state": "TX", "property_type": "Townhouse"},
    {"property_title": "The Summit Condo", "sale_price": 295000, "months_ago": 2, "city": "Dallas", "state": "TX", "property_type": "Condo"},
    {"property_title": "Pinecrest Manor", "sale_price": 710000, "months_ago": 3, "city": "Houston", "state": "TX", "property_type": "Single Family"},
    {"property_title": "Riverside Cottage", "sale_price": 380000, "months_ago": 3, "city": "Austin", "state": "TX", "property_type": "Single Family"},
    {"property_title": "Urban Flats Unit 8", "sale_price": 260000, "months_ago": 4, "city": "Dallas", "state": "TX", "property_type": "Condo"},
    {"property_title": "Creekside Haven", "sale_price": 535000, "months_ago": 4, "city": "San Antonio", "state": "TX", "property_type": "Single Family"},
    {"property_title": "Elmwood Terrace", "sale_price": 450000, "months_ago": 5, "city": "Plano", "state": "TX", "property_type": "Single Family"},
    {"property_title": "Heritage Park Home", "sale_price": 590000, "months_ago": 5, "city": "Austin", "state": "TX", "property_type": "Single Family"},
    {"property_title": "The Oaks at Westview", "sale_price": 825000, "months_ago": 6, "city": "Houston", "state": "TX", "property_type": "Single Family"},
    {"property_title": "Magnolia Square Condo", "sale_price": 310000, "months_ago": 6, "city": "San Antonio", "state": "TX", "property_type": "Condo"},
    {"property_title": "Blue Ridge Bungalow", "sale_price": 395000, "months_ago": 7, "city": "Austin", "state": "TX", "property_type": "Single Family"},
    {"property_title": "Versailles Villa", "sale_price": 980000, "months_ago": 7, "city": "Dallas", "state": "TX", "property_type": "Single Family"},
    {"property_title": "Stone Gate Estate", "sale_price": 1100000, "months_ago": 8, "city": "Austin", "state": "TX", "property_type": "Single Family"},
    {"property_title": "Harbor View Unit 12", "sale_price": 275000, "months_ago": 8, "city": "Houston", "state": "TX", "property_type": "Condo"},
    {"property_title": "Cedar Bluff Residence", "sale_price": 490000, "months_ago": 4, "city": "Houston", "state": "TX", "property_type": "Single Family"},
    {"property_title": "Foxwood Pines", "sale_price": 650000, "months_ago": 9, "city": "Plano", "state": "TX", "property_type": "Single Family"},
    {"property_title": "The Meridian Loft", "sale_price": 320000, "months_ago": 9, "city": "Austin", "state": "TX", "property_type": "Condo"},
    {"property_title": "Lakewood Cottage", "sale_price": 420000, "months_ago": 10, "city": "San Antonio", "state": "TX", "property_type": "Single Family"},
    {"property_title": "Northgate Townhome", "sale_price": 355000, "months_ago": 10, "city": "Dallas", "state": "TX", "property_type": "Townhouse"},
    {"property_title": "Crystal Falls Manor", "sale_price": 890000, "months_ago": 11, "city": "Austin", "state": "TX", "property_type": "Single Family"},
    {"property_title": "Woodland Park Bungalow", "sale_price": 410000, "months_ago": 11, "city": "Houston", "state": "TX", "property_type": "Single Family"},
    {"property_title": "The Grand Terrace", "sale_price": 745000, "months_ago": 12, "city": "Austin", "state": "TX", "property_type": "Single Family"},
]


def seed():
    with app.app_context():
        # Drop and recreate tables
        db.drop_all()
        db.create_all()

        # Create admin user
        admin = Admin(
            username="admin",
            password_hash=generate_password_hash("admin123"),
        )
        db.session.add(admin)

        # Create properties
        from slugify import slugify
        for i, data in enumerate(SAMPLE_PROPERTIES):
            slug = slugify(data["title"])
            prop = Property(
                title=data["title"],
                slug=slug,
                listing_type=data["listing_type"],
                property_type=data["property_type"],
                status=data["status"],
                price=data["price"],
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
                latitude=data.get("latitude"),
                longitude=data.get("longitude"),
                description=data.get("description", ""),
                contact_name=data.get("contact_name", ""),
                contact_phone=data.get("contact_phone", ""),
                contact_email=data.get("contact_email", ""),
            )
            prop.highlights = data.get("highlights", [])
            prop.basic_info = data.get("basic_info", {})
            prop.photos = data.get("photos", [])
            prop.documents = []

            if data["status"] in ("published", "under_contract", "closed"):
                prop.published_at = datetime.now(timezone.utc) - timedelta(days=random.randint(5, 90))

            db.session.add(prop)

        # Create sale records
        now = datetime.now(timezone.utc)
        for record_data in SALE_RECORDS_DATA:
            months_ago = record_data["months_ago"]
            sale_date = now - timedelta(days=months_ago * 30 + random.randint(-5, 5))
            record = SaleRecord(
                property_title=record_data["property_title"],
                sale_price=record_data["sale_price"],
                sale_date=sale_date,
                city=record_data["city"],
                state=record_data["state"],
                property_type=record_data["property_type"],
            )
            db.session.add(record)

        db.session.commit()
        print("✅ Database seeded successfully!")
        print(f"   → {len(SAMPLE_PROPERTIES)} properties created")
        print(f"   → {len(SALE_RECORDS_DATA)} sale records created")
        print(f"   → Admin: username=admin, password=admin123")


if __name__ == "__main__":
    seed()
