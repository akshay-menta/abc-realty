# ABC Realty — Setup Guide

Follow these steps in order to run the app locally or connect it to Supabase.

## 1. Configure Groq for the AI chatbot

Groq is the only required AI provider for this project.

1. Create a free API key at https://console.groq.com/keys
2. Copy `backend/.env.example` to `backend/.env`
3. Set these values in `backend/.env`:

```env
LLM_PROVIDER=groq
GROQ_API_KEY=your_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```


## 2. Configure the backend environment

Keep the rest of `backend/.env` minimal:

```env
JWT_SECRET_KEY=change-this-in-production
SQLALCHEMY_DATABASE_URI=sqlite:///realestate.db
```
If you want to connect to Supabase, replace `SQLALCHEMY_DATABASE_URI` with your Postgres URL.

### Our Supabase URL
SQLALCHEMY_DATABASE_URI="postgresql://postgres:July%402k20262k2026@db.liepzgefxvvephnjzuuu.supabase.co:5432/postgres"


## 3. Install dependencies

### Backend

```bash
cd /projectpath/backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Frontend

```bash
cd /projectpath/frontend
npm install
```

## 4. Seed the database

This creates sample properties, admin login data, and sample inquiries/sales records.

```bash
cd /projectpath/backend
source venv/bin/activate
python seed.py
```

Default admin credentials:

```text
username: admin
password: admin123
```

## 5. Start the app

You only need two terminals:

### Terminal 1 — Backend

```bash
cd /projectpath/backend
source venv/bin/activate
python app.py
```

Backend URL: `http://localhost:5001`

### Terminal 2 — Frontend

```bash
cd /projectpath/frontend
npm run dev
```

Frontend URL: `http://localhost:5173`

## 6. What to expect

- Public pages show only Open and Closed listings.
- Admin pages show Yet to Publish, Published, and Closed.
- Property detail pages show the map and Walk Score section.
- Contact form submissions are stored in the `inquiries` table.
- Property page inquiries are also stored in the `inquiries` table with the related property id.

## 7. Stop the app

Press `CTRL+C` in each running terminal.

