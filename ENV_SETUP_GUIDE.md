# Environment Setup Guide

## Overview
This project uses environment variables to manage sensitive credentials and configuration. All sensitive data is now stored in a `.env` file instead of being hardcoded in the source code.

## Setup Instructions

### 1. Backend Setup

#### Step 1: Copy the example file
```bash
cd backend
cp .env.example .env
```

#### Step 2: Fill in your credentials in `.env`
Edit `backend/.env` and add your actual values:

```env
# Required: Google Gemini API Key
GOOGLE_API_KEY=your_google_gemini_api_key_here

# Database Configuration (Already filled with Supabase credentials)
DB_ENGINE=django.db.backends.postgresql
DB_NAME=postgres
DB_USER=postgres.oiscsacsglwideokczhm
DB_PASSWORD=agnayarjunibrukeerthi
DB_HOST=aws-1-ap-south-1.pooler.supabase.com
DB_PORT=5432
DB_SSL_MODE=require

# Django Configuration
DJANGO_SECRET_KEY=your_secret_key_here  # Change this for production
DEBUG=True  # Set to False in production
ALLOWED_HOSTS=localhost,127.0.0.1  # Add your production domain

# Email Configuration (Optional if using email features)
EMAIL_HOST_USER=a27423001@smtp-brevo.com
EMAIL_HOST_PASSWORD=smtp_key_here
DEFAULT_FROM_EMAIL=me.openbox@gmail.com

# CORS Configuration
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

#### Step 3: Verify python-dotenv is installed
```bash
pip install python-dotenv
```

It should already be in your `requirements.txt`. If upgrading, run:
```bash
pip install -r requirements.txt
```

### 2. What Changed

#### Files Modified:
1. **`backend/api/gemini_utils.py`**
   - Now loads `GOOGLE_API_KEY` from `.env` instead of hardcoded empty string
   - Added `from dotenv import load_dotenv`

2. **`backend/backend/settings.py`**
   - All sensitive settings now use `os.getenv()` to read from `.env`
   - Includes: `DJANGO_SECRET_KEY`, database credentials, email settings, CORS origins
   - Added `from dotenv import load_dotenv` and `load_dotenv()` at the top

#### New Files:
- **`backend/.env`** - Your actual configuration (DO NOT commit)
- **`backend/.env.example`** - Template for team members (safe to commit)

### 3. Security Best Practices

✅ **What you've improved:**
- API keys are no longer in source code
- Database credentials are in `.env` (not tracked by git)
- Email passwords are protected
- Different environments can have different configs

⚠️ **Still TODO for production:**
1. Generate a strong `DJANGO_SECRET_KEY`
2. Set `DEBUG=False` in production
3. Update `ALLOWED_HOSTS` with your production domain
4. Use environment-specific `.env` files for staging/production
5. Never share your `.env` file with anyone
6. Rotate API keys periodically

### 4. Running the Project

```bash
# Backend
cd backend
source venv/Scripts/Activate.ps1  # On Windows PowerShell
python manage.py runserver

# Frontend (in new terminal)
cd client
npm run dev
```

### 5. For Team Members

1. Ask for the production `.env` credentials via secure channel
2. Create your own `.env` file based on `.env.example`
3. Never commit the `.env` file to git

### 6. Environment Variables Reference

| Variable | Purpose | Example |
|----------|---------|---------|
| `GOOGLE_API_KEY` | Gemini AI API Key | `AIzaSyD...` |
| `DB_NAME` | Database name | `postgres` |
| `DB_USER` | Database user | `postgres.abc...` |
| `DB_PASSWORD` | Database password | `yourpassword` |
| `DB_HOST` | Database host | `aws-1-ap-south-1...` |
| `DJANGO_SECRET_KEY` | Django secret key | `your-secret-key` |
| `DEBUG` | Debug mode | `True` or `False` |
| `EMAIL_HOST_USER` | SMTP username | `user@smtp-brevo.com` |
| `EMAIL_HOST_PASSWORD` | SMTP password | `smtp_key...` |

---

**Note:** The `.env` file is listed in `.gitignore` and will NOT be committed to the repository.
