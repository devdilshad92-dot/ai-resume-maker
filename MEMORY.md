# AI Resume Maker — Project Memory

> Single source of truth for product decisions, architecture, roadmap, and context.
> Update this file whenever a major decision is made or a feature ships.

---

## Vision

**Goal:** Build the #1 AI resume maker in the world.

**The Gap We're Filling:** No competitor has great AI + great UX + great templates + job tracking in one fast, affordable product.

**Competitors:**
| Product | Strength | Weakness |
|---|---|---|
| Jobscan | Best ATS matching | Terrible UX |
| Rezi | ATS-focused AI | Slow, limited templates |
| Kickresume | Best templates | Weak AI |
| Resume.io | Best UX | Shallow AI |
| Teal | Best job tracker | Weak resume quality |
| Enhancv | Best design | Weak AI, expensive |

---

## Tech Stack

### Backend
- **Framework:** FastAPI (async)
- **ORM:** SQLAlchemy (async) + PostgreSQL
- **Auth:** JWT (python-jose + passlib/bcrypt)
- **AI:** Multi-provider — Gemini, OpenAI, Anthropic, OpenRouter
- **File parsing:** pypdf (PDF), python-docx (DOCX)
- **Infra:** Docker Compose

### Frontend (current — needs migration)
- **Framework:** React 18 + TypeScript
- **Build:** Vite (SPA — BAD for SEO, migrate to Next.js)
- **Styling:** TailwindCSS + Framer Motion
- **HTTP:** Axios with JWT interceptor
- **Routing:** React Router v6

### Infrastructure
- **DB:** PostgreSQL 15 (Docker)
- **Container:** Docker Compose (db + backend + frontend)
- **File storage:** Local `/uploads` (needs migration to S3/R2)

---

## Architecture Decisions Made

### AI Provider System
- Multi-provider abstraction: `GeminiProvider`, `OpenAIProvider`, `AnthropicProvider`
- OpenRouter uses OpenAI-compatible client with different base URL
- `AIService.configure()` hot-reloads provider/model without restart
- Primary → fallback auto-retry on failure
- Config stored in `ai_settings` DB table (single row, id=1)
- Admin panel at `/admin` — any logged-in user can change AI config
- Default: `gemini / gemini-2.5-flash` primary, `gemini / gemini-2.5-flash-lite` fallback

### What Was Removed
- **Ollama:** Fully removed (import, class, config, docker service, env var, admin UI)
- **Celery + Redis:** Removed from requirements (unused — background tasks use FastAPI BackgroundTasks)

### Database Models
- `User` — auth, owns resumes/jobs/applications
- `Resume` — stores parsed_content (JSON), raw_text, template_id, meta_data
- `JobDescription` — stores job posting text
- `Application` — links Resume→Job, stores generated_content + ATS score
- `JobRole` — seeded lookup table (~150 roles) for autocomplete
- `AISettings` — single-row table for active AI provider/model config

---

## Environment Variables (`.env`)

```env
SECRET_KEY=<256-bit hex>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_SERVER=db          # docker service name
POSTGRES_PORT=5432
POSTGRES_DB=resume_maker

GEMINI_API_KEY=             # fill in to enable
OPENAI_API_KEY=             # fill in to enable
ANTHROPIC_API_KEY=          # fill in to enable
OPENROUTER_API_KEY=         # fill in to enable

BACKEND_CORS_ORIGINS=["http://localhost:5173","http://localhost:3000"]
```

---

## Current Feature Status

### Working
- JWT auth (login / signup / protected routes)
- PDF + DOCX upload → AI text extraction → parsed JSON stored
- Job description submission
- Background AI resume tailoring
- ATS score + feedback display
- Template rendering (4 styles: minimal-pro, modern-ats, tech-focused, fresher-grad)
- Scratch builder setup wizard (job role, level, industry, template)
- Summary section editor + AI suggestions
- Job role autocomplete (DB + AI fallback)
- Admin panel — provider/model switching, hot-reload

### Broken / Stubbed (fix before anything else)
| Feature | File | Issue |
|---|---|---|
| PDF/DOCX download | `ResumeBuilder.tsx` | Buttons disabled, no implementation |
| Scratch builder save | `ResumeScratch.tsx` | "Save & Continue" calls no API |
| Finalize resume | `ResumeScratch.tsx` | Just navigates to dashboard |
| Dashboard stats | `Dashboard.tsx` | 100% hardcoded fake numbers |
| Section editors | `ResumeScratch.tsx` | Only Summary works; rest are placeholders |
| Profile page | `Navbar.tsx` | Links to `/profile` — route missing |

### Known Security Issues
- No rate limiting on login/signup (brute force risk)
- JWT stored in localStorage (XSS risk — should be httpOnly cookie)
- File uploads: no size limit, never deleted after processing
- `echo=True` on SQLAlchemy engine (logs all SQL in production)
- CORS allows `"*"` in main.py

---

## Roadmap to #1

### Phase 0 — Fix Broken Core (Week 1–2)
- [ ] PDF export
- [ ] Scratch builder: save all sections to DB
- [ ] Dashboard: fetch real resume/application/ATS data from API
- [ ] All section editors: Skills (tag input), Experience, Education, Projects
- [ ] File storage on S3/R2 (uploads lost on container restart)
- [ ] Email verification + password reset

### Phase 1 — Core AI Superiority (Month 1–2)
- [ ] Real-time ATS scoring (live as user edits, not batch)
- [ ] Job description intelligence (auto-extract skills, seniority, stack)
- [ ] One-click tailoring with diff view (original vs AI, accept/reject per section)
- [ ] Bullet point rewriter (select bullet → 3 AI alternatives)
- [ ] Cover letter generator
- [ ] 20+ templates (Tech, Finance, Legal, Creative, Executive, Academic, Fresher)

### Phase 2 — UX That Feels Magical (Month 2–3)
- [ ] LinkedIn import (paste URL → pre-fill all sections)
- [ ] Chrome extension (detect jobs on LinkedIn/Indeed → one-click tailor)
- [ ] Resume strength score (impact language, quantification %, readability)
- [ ] Multi-language resume generation (French, German, Spanish, Portuguese)
- [ ] DOCX export

### Phase 3 — Platform + Retention (Month 3–5)
- [ ] Job application tracker (Applied → Phone Screen → Interview → Offer)
- [ ] Resume version history
- [ ] Shareable resume link (`/u/john-doe`)
- [ ] Resume analytics (views, which sections read longest)
- [ ] A/B test two resume versions
- [ ] Interview prep mode (generate questions from JD + resume)
- [ ] Salary intelligence (show market range when JD is pasted)

### Phase 4 — Growth Engine (Month 4–6)
- [ ] Google / GitHub OAuth
- [ ] Referral program (refer 2 → get Pro free)
- [ ] Recruiter portal (search/contact opted-in candidates)
- [ ] Public API for ATS/job board integrations
- [ ] Subscription + Pro tier (gate DOCX, unlimited tailoring, premium templates)

### Phase 5 — Infrastructure (ongoing, start Month 1)
- [ ] Alembic migrations (currently using `create_all` — data loss risk)
- [ ] Rate limiting (`slowapi` on auth + AI endpoints)
- [ ] S3/R2 for file storage
- [ ] Replace BackgroundTasks with Celery + Redis for reliable AI jobs
- [ ] Test suite (zero tests currently)
- [ ] Disable `echo=True` in `db.py`
- [ ] Non-root user in Dockerfile

---

## SEO Strategy

### Core Problem
Current Vite SPA is a SEO dead zone. Googlebot sees `<div id="root"></div>`.
**Must migrate to Next.js** — same React components, same Tailwind, FastAPI backend stays.

### Content Architecture (pages to build)
```
/                                    → Marketing homepage (SSG)
/resume-examples/                    → Index of all roles
/resume-examples/[job-title]         → Per-role AI-generated example (500+ pages)
/resume-templates/                   → Template gallery
/resume-templates/[template-name]    → Per-template preview
/tools/ats-checker                   → FREE tool — biggest link magnet
/tools/resume-scorer                 → Free scoring tool
/blog/[slug]                         → How-to content
/salary/[job-title]/[city]           → Salary pages → funnel to builder
/cover-letter-examples/[job-title]   → Cover letter pages
```

### Keyword Clusters
| Type | Examples | Priority |
|---|---|---|
| Tool | "ai resume maker", "ats resume builder free" | High |
| Example/template | "software engineer resume example 2025" | Highest volume |
| How-to | "how to beat ats filters", "what is ats resume" | Authority building |
| Job-specific | "google software engineer resume", "amazon PM resume" | Low competition |
| AI-specific | "ai generated resume", "chatgpt resume writer" | Wide open right now |

### Technical SEO Checklist
- [ ] Migrate to Next.js (SSR + SSG)
- [ ] Per-page `<title>` + meta description
- [ ] OpenGraph + Twitter cards
- [ ] JSON-LD structured data (SoftwareApplication, FAQPage, HowTo, BreadcrumbList)
- [ ] `sitemap.xml` (auto-generated, includes all example/template pages)
- [ ] `robots.txt`
- [ ] Canonical URLs
- [ ] Core Web Vitals (Next.js Image, next/font)
- [ ] `hreflang` when multilingual ships

### The Free Tool Play
Build `/tools/ats-checker` — upload resume → ATS score + keyword report, **no signup required**.
- Jobscan charges for this. A free version beats them on top-of-funnel.
- Every career blog and LinkedIn influencer will link to a genuinely useful free tool.
- CTA after results: "Fix these issues — it's free" → signup conversion.

### Realistic SEO Timeline
```
Month 1:   Next.js migration, meta tags, sitemap, robots.txt
Month 2:   50 resume example pages (AI-generated), free ATS tool
Month 3:   200+ example pages, cover letter pages, blog (4 posts/month)
Month 6:   First page for long-tail role-specific terms
Month 9:   Ranking for mid-competition "resume builder" terms
Month 12:  Competing for "ai resume maker" head terms
```

---

## Key File Map

```
backend/
├── app/
│   ├── main.py                  # FastAPI app, CORS, router registration, startup
│   ├── core/
│   │   ├── config.py            # Pydantic settings, all env vars
│   │   ├── db.py                # Async SQLAlchemy engine + session
│   │   └── security.py          # JWT create/verify, bcrypt hashing
│   ├── models/models.py         # ORM: User, Resume, JobDescription, Application, JobRole, AISettings
│   ├── schemas/schemas.py       # Pydantic request/response schemas
│   ├── api/
│   │   ├── auth.py              # POST /auth/signup, /auth/login
│   │   ├── resume.py            # Upload, scratch, update-section, generate, ATS
│   │   ├── job_roles.py         # GET /job-roles/search (DB + AI fallback)
│   │   └── admin.py             # GET/PUT /admin/ai-config
│   └── services/
│       ├── ai_service.py        # Multi-provider AI (Gemini/OpenAI/Anthropic/OpenRouter)
│       └── pdf.py               # PDF + DOCX text extraction

frontend/src/
├── App.tsx                      # Routes: /, /builder, /builder/scratch, /admin
├── api/client.ts                # Axios + JWT interceptor (baseURL hardcoded to localhost:8000)
├── pages/
│   ├── Login.tsx                # Login + signup toggle
│   ├── Dashboard.tsx            # HARDCODED stats — needs real API data
│   ├── ResumeBuilder.tsx        # Upload flow, 4 steps, PDF download DISABLED
│   ├── ResumeScratch.tsx        # Scratch builder — save NOT implemented
│   └── AdminPanel.tsx           # AI provider/model config
├── components/
│   ├── resume/
│   │   ├── TemplateRenderer.tsx # Renders resume in 4 template styles
│   │   ├── TemplateGallery.tsx  # Template picker with preview
│   │   └── ATSScoreView.tsx     # ATS score + feedback display
│   ├── ui/
│   │   ├── JobRoleAutocomplete.tsx  # Debounced search, no keyboard nav
│   │   ├── Button.tsx / Card.tsx / Input.tsx / Skeleton.tsx
│   └── layout/Navbar.tsx        # Logo, Admin link, Account, Sign out
└── hooks/useDebounce.ts

docker-compose.yml               # db + backend + frontend (no Ollama)
.env                             # All secrets — never commit
```

---

## Session Log

### Session 1 (2026-06-03)
- Full codebase analysis completed
- Created `.env` with generated SECRET_KEY
- Built multi-provider AI system (Gemini, OpenAI, Anthropic, OpenRouter)
- Added `AISettings` DB model for runtime config
- Built `/admin` panel with provider/model switcher + hot-reload
- Fully removed Ollama from all files
- Removed unused Celery + Redis from requirements
- Removed `REDIS_URL` from config + env
- Identified: PDF export, scratch builder save, dashboard data as top 3 broken features
- Defined full roadmap to be #1 product
- Defined SEO strategy + Next.js migration plan
- Gemini API key added to `.env`
