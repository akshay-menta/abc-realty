# ABC Realty

ABC Realty is a Flask and React real estate portal for browsing sale and lease properties, managing listings in an admin portal, and collecting inquiries from visitors.

## What it includes

- Public home, sale, lease, contact, and property detail pages
- Admin login, dashboard, and property management screens
- Property search by name, city, area, ZIP, price, and type
- Inquiry storage in the `inquiries` table
- AI chatbot powered by Groq
- OpenStreetMap and Leaflet for free maps
- Supabase Postgres support for deployment

## Setup

Read [SETUP.md](SETUP.md) for the current setup steps.

Before running locally, copy [backend/.env.example](backend/.env.example) to [backend/.env](backend/.env) and fill in your values.


## Run locally

Backend:

```bash
cd /projectpath/backend
source venv/bin/activate
python app.py
```

Frontend:

```bash
cd /projectpath/frontend
npm run dev
```

## Inquiry flow

- The contact form submits directly to the `inquiries` table.
- Property detail inquiries also go into the `inquiries` table with the related property id.

## Database

The backend reads `SQLALCHEMY_DATABASE_URI` from `backend/.env`.
- If it points to Supabase, the app uses Supabase Postgres.
- If it is not set, the app falls back to local SQLite.
