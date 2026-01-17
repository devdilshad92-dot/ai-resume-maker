# AI Resume Maker

A production-ready AI Resume Builder that optimizes resumes for ATS (Applicant Tracking Systems) using Google Gemini Pro.

## Tech Stack
- **Backend**: FastAPI, PostgreSQL, SQLAlchemy (Async), Google Gemini AI.
- **Frontend**: React, Vite, TailwindCSS, Framer Motion.
- **Infrastructure**: Docker Compose.

## Features
- **Smart Parsing**: Extract details from PDF/DOCX.
- **AI Tailoring**: Rewrites resume bullet points based on Job Description.
- **ATS Scoring**: Real-time feedback and score.
- **Secure**: JWT Authentication.

## How to Run

### Prerequisites
- Docker and Docker Compose
- Node.js (if running locally without Docker)
- Python 3.9+ (if running locally)

### Option 1: Docker (Recommended)
1. set your Gemini API Key in `.env` (create one in root or backend).
   ```bash
   export GEMINI_API_KEY=your_key
   ```
2. Run:
   ```bash
   docker-compose up --build
   ```
3. Access:
   - Frontend: `http://localhost:5173`
   - Backend Docs: `http://localhost:8000/docs`

### Option 2: Local Dev
1. **Backend**:
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```
2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Folder Structure
- `backend/app`: API logic.
- `frontend/src`: React UI.
