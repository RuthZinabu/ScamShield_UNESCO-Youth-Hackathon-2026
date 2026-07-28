# ScamShield AI — Project Guide & Render Deployment

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Codebase Structure](#3-codebase-structure)
4. [Database Schema](#4-database-schema)
5. [API Reference](#5-api-reference)
6. [Frontend Pages](#6-frontend-pages)
7. [Environment Variables](#7-environment-variables)
8. [How the AI Works](#8-how-the-ai-works)
9. [Render Deployment — Step by Step](#9-render-deployment--step-by-step)

---

## 1. Project Overview

ScamShield AI is a **Media and Information Literacy (MIL)** platform that helps users think critically about digital content. It does **not** label things as scams — instead it educates users by surfacing warning signs, asking reflective questions, and teaching digital literacy skills.

**Key features:**

| Feature | Description |
|---|---|
| **Verify** | Paste text, a URL, an email, or a job offer — the AI analyses it and returns structured indicators |
| **Chat** | Conversational MIL assistant powered by Gemini (streaming SSE) |
| **Learn** | Lessons on fake news, phishing, deepfakes, safe shopping, etc. with quizzes |
| **Community** | Browse and submit community scam reports |
| **Dashboard** | Personal literacy score, streak, and recent activity |

---

## 2. Architecture

```
Browser
  │
  ├── React SPA (Vite)          artifacts/scamshield/
  │     └── calls /api/*  ──► Express API Server    artifacts/api-server/
  │                                   │
  │                                   ├── PostgreSQL (Drizzle ORM)   lib/db/
  │                                   └── Google AI Studio (Gemini)  via GEMINI_API_KEY
  │
  └── (dev only) mockup sandbox       artifacts/mockup-sandbox/
```

**In production on Render you run two services:**

| Service | What it is | Build command | Start command |
|---|---|---|---|
| **API Server** | Node.js / Express | `pnpm run build` (in `artifacts/api-server`) | `node --enable-source-maps ./dist/index.mjs` |
| **Static Site** | React / Vite SPA | `pnpm run build` (in `artifacts/scamshield`) | *(served as static files)* |

Plus **one managed PostgreSQL database** on Render.

---

## 3. Codebase Structure

```
/
├── artifacts/
│   ├── api-server/          Express 5 API — TypeScript, built with esbuild
│   │   └── src/
│   │       ├── app.ts       Express app setup (CORS, JSON, logging)
│   │       ├── index.ts     Entry point — reads PORT env var
│   │       ├── lib/
│   │       │   └── mil-analysis.ts   Gemini JSON analysis call
│   │       └── routes/
│   │           ├── analyses.ts       POST /api/analyses (AI content check)
│   │           ├── chat.ts           GET/POST /api/chat/* (streaming SSE)
│   │           ├── dashboard.ts      GET /api/dashboard/*
│   │           ├── health.ts         GET /api/healthz
│   │           ├── lessons.ts        GET/POST /api/lessons/*
│   │           └── reports.ts        GET/POST /api/reports/*
│   │
│   └── scamshield/          React SPA — Vite, Tailwind, shadcn/ui
│       └── src/
│           ├── App.tsx      Router (wouter) + providers
│           ├── pages/       Home, Verify, Chat, Learn, LessonDetail,
│           │                Community, Dashboard, NotFound
│           ├── components/  UI components (shadcn/ui based)
│           ├── i18n/        Internationalisation (react-i18next)
│           └── lib/         Utilities
│
├── lib/
│   ├── db/                  Drizzle ORM — schema + DB client (pg)
│   ├── api-zod/             Zod schemas for request/response validation
│   ├── api-spec/            OpenAPI spec + Orval codegen config
│   └── api-client-react/    Auto-generated React Query hooks (from OpenAPI)
│
├── pnpm-workspace.yaml      pnpm monorepo config
└── tsconfig.json            Root TypeScript project references
```

---

## 4. Database Schema

All tables are PostgreSQL, managed via Drizzle ORM (`lib/db/`).

### `analyses`
Stores every content analysis run by the user.

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `content_type` | text | `text \| url \| email \| social-media \| job \| scholarship \| news \| general` |
| `input_text` | text | The pasted content |
| `source_url` | text | Optional URL |
| `status` | text | `completed \| failed` |
| `is_bookmarked` | boolean | User can save results |
| `warning_sign_count` | integer | Derived from AI result |
| `trust_indicator_count` | integer | Derived from AI result |
| `result` | jsonb | Full `MILAnalysisResult` JSON |
| `created_at / updated_at` | timestamptz | |

### `conversations` + `chat_messages`
Stores MIL chat sessions.

| Table | Key columns |
|---|---|
| `conversations` | `id`, `title`, `created_at`, `updated_at` |
| `chat_messages` | `id`, `conversation_id` (FK→conversations), `role` (`user\|assistant`), `content`, `created_at` |

### `lessons` + `quiz_questions`
Educational content.

| Table | Key columns |
|---|---|
| `lessons` | `id`, `title`, `category`, `summary`, `content`, `duration_minutes`, `difficulty` |
| `quiz_questions` | `id`, `lesson_id` (FK), `question`, `options[]`, `correct_index`, `explanation`, `order_index` |

### `reports`
Community-submitted scam reports.

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `title` | text | |
| `description` | text | |
| `category` | text | `job \| investment \| shopping \| news \| scholarship \| phishing \| romance \| other` |
| `country / language` | text | Optional |
| `evidence_url` | text | Optional |
| `upvote_count` | integer | |

### `progress`
Tracks which lessons a user has completed.

| Column | Type |
|---|---|
| `id` | serial PK |
| `lesson_id` | FK → lessons |
| `quiz_score` | integer |
| `completed_at` | timestamptz |

---

## 5. API Reference

All routes are prefixed with `/api`.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/healthz` | Health check |
| `POST` | `/api/analyses` | Run AI analysis on content |
| `GET` | `/api/analyses` | List past analyses (supports `?bookmarked=true&limit=&offset=`) |
| `GET` | `/api/analyses/stats` | Summary counts by content type |
| `GET` | `/api/analyses/:id` | Get single analysis |
| `DELETE` | `/api/analyses/:id` | Delete analysis |
| `PATCH` | `/api/analyses/:id/bookmark` | Toggle bookmark |
| `GET` | `/api/chat/conversations` | List conversations |
| `POST` | `/api/chat/conversations` | Create conversation |
| `GET` | `/api/chat/conversations/:id` | Get conversation + messages |
| `DELETE` | `/api/chat/conversations/:id` | Delete conversation |
| `POST` | `/api/chat/conversations/:id/messages` | Send message → **SSE stream** |
| `GET` | `/api/lessons` | List lessons (supports `?category=`) |
| `GET` | `/api/lessons/categories` | List available categories |
| `GET` | `/api/lessons/:id` | Get lesson + quiz questions |
| `POST` | `/api/lessons/:id/complete` | Mark lesson complete + record quiz score |
| `GET` | `/api/reports` | List community reports |
| `GET` | `/api/reports/trending` | Top upvoted reports |
| `POST` | `/api/reports` | Submit a report |
| `GET` | `/api/reports/:id` | Get single report |
| `GET` | `/api/dashboard/stats` | Literacy score, streak, totals |
| `GET` | `/api/dashboard/activity` | Recent analyses + completed lessons |

### SSE Chat Format

The chat send endpoint (`POST /api/chat/conversations/:id/messages`) streams **Server-Sent Events**:

```
data: {"content":"Here is some "}

data: {"content":"streamed text..."}

data: {"done":true}
```

---

## 6. Frontend Pages

| Route | Page | What it does |
|---|---|---|
| `/` | Home | Landing page, feature highlights, FAQ |
| `/verify` | Verify | Paste content → AI analyses it → structured result card |
| `/chat` | Chat | Conversational MIL assistant (streaming) |
| `/learn` | Learn | Browse lessons by category |
| `/learn/:id` | LessonDetail | Read lesson, take quiz |
| `/community` | Community | Browse + submit scam reports |
| `/dashboard` | Dashboard | Literacy score, streak, recent activity |

**API client:** The frontend uses auto-generated React Query hooks from `lib/api-client-react/` (built from the OpenAPI spec via Orval). All API calls go to `/api/*` relative paths — the browser proxies them to the API server.

---

## 7. Environment Variables

### API Server

| Variable | Required | Description |
|---|---|---|
| `PORT` | ✅ Yes | Port the Express server binds to |
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string |
| `GEMINI_API_KEY` | ✅ Yes | Google AI Studio API key ([get one here](https://aistudio.google.com/apikey)) |
| `NODE_ENV` | Optional | Set to `production` for production builds |

### Frontend (Vite build)

| Variable | Required | Description |
|---|---|---|
| `PORT` | ✅ Yes (dev only) | Dev server port |
| `BASE_PATH` | ✅ Yes (dev only) | Base path prefix for the Vite dev server |

> In production the frontend is a **static build** served directly by Render — no runtime env vars needed for the frontend itself.

---

## 8. How the AI Works

Both AI features use **Google AI Studio (Gemini 2.0 Flash)** via the `@google/genai` SDK.

### Content Analysis (`POST /api/analyses`)

1. User submits content + type (text, email, job offer, etc.)
2. Server calls `runMILAnalysis()` in `artifacts/api-server/src/lib/mil-analysis.ts`
3. Gemini is called with `responseMimeType: "application/json"` — it returns structured JSON directly
4. Response shape: `warningSigns[]`, `trustIndicators[]`, `reflectiveQuestions[]`, `verificationSteps[]`, `literacyLesson`, `recommendedActions[]`, `educationalTip`
5. Result is saved to the `analyses` table in Postgres

### Chat (`POST /api/chat/conversations/:id/messages`)

1. User sends a message
2. Server loads full conversation history from Postgres
3. Calls `genai.models.generateContentStream()` with `systemInstruction` set to the MIL educator prompt
4. Streams response chunks as SSE (`data: {"content":"..."}`)
5. Full response is saved to `chat_messages` table once streaming ends

> If `GEMINI_API_KEY` is not set, both endpoints return a graceful placeholder response — the app still loads and functions, just without live AI.

---

## 9. Render Deployment — Step by Step

You will create **three resources** on Render:

1. A **PostgreSQL** database
2. A **Web Service** for the API server
3. A **Static Site** for the React frontend

---

### Step 1 — Create a PostgreSQL Database

1. Go to [render.com](https://render.com) → **New +** → **PostgreSQL**
2. Fill in:
   - **Name:** `scamshield-db` (or anything you like)
   - **Region:** Choose one closest to your users
   - **Plan:** Free (or Starter for production)
3. Click **Create Database**
4. Once created, open the database and copy the **Internal Database URL** — you will need this in Step 2.

---

### Step 2 — Deploy the API Server

1. **New +** → **Web Service**
2. Connect your GitHub repository
3. Configure the service:

| Setting | Value |
|---|---|
| **Name** | `scamshield-api` |
| **Region** | Same as your database |
| **Branch** | `main` |
| **Root Directory** | *(leave blank — commands run from repo root)* |
| **Runtime** | `Node` |
| **Build Command** | `npm install -g pnpm && pnpm install --frozen-lockfile && pnpm --filter @workspace/api-server run build` |
| **Start Command** | `node --enable-source-maps artifacts/api-server/dist/index.mjs` |
| **Plan** | Free or Starter |

4. Under **Environment Variables**, add:

| Key | Value |
|---|---|
| `DATABASE_URL` | Paste the **Internal Database URL** from Step 1 |
| `GEMINI_API_KEY` | Your Google AI Studio key |
| `NODE_ENV` | `production` |
| `PORT` | `10000` *(Render sets this automatically — you can leave it out)* |

5. Click **Create Web Service**
6. Wait for the first deploy to finish. Note the service URL (e.g. `https://scamshield-api.onrender.com`).

#### Push the database schema

After the API server is running, open a **Shell** tab on the Render service (or run this locally with `DATABASE_URL` set):

```bash
pnpm --filter @workspace/db run push
```

This runs `drizzle-kit push` and creates all tables in your Render Postgres database.

---

### Step 3 — Deploy the Frontend (Static Site)

1. **New +** → **Static Site**
2. Connect the same repository
3. Configure:

| Setting | Value |
|---|---|
| **Name** | `scamshield-web` |
| **Branch** | `main` |
| **Build Command** | `npm install -g pnpm && pnpm install --frozen-lockfile && pnpm --filter @workspace/scamshield run build` |
| **Publish Directory** | `artifacts/scamshield/dist/public` |

4. Under **Environment Variables** (build-time), add:

| Key | Value |
|---|---|
| `BASE_PATH` | `/` |
| `PORT` | `3000` *(needed only during the Vite build step)* |

5. Click **Create Static Site**

#### Configure API proxy (rewrite rules)

The frontend calls `/api/*` relative paths. On Render Static Sites you set up a **Rewrite Rule** to proxy those to your API server:

In the static site settings → **Redirects/Rewrites**, add:

| Source | Destination | Action |
|---|---|---|
| `/api/*` | `https://scamshield-api.onrender.com/api/*` | **Rewrite** |

> Replace `https://scamshield-api.onrender.com` with your actual API service URL from Step 2.

---

### Step 4 — Verify Everything Works

1. Open your static site URL (e.g. `https://scamshield-web.onrender.com`)
2. Check the home page loads
3. Go to **Verify** and paste some text → you should get an AI analysis result
4. Go to **Chat** and send a message → you should see streaming responses
5. Check the API health endpoint directly: `https://scamshield-api.onrender.com/api/healthz`
   - Should return: `{"status":"ok"}`

---

### Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| API returns 500 on `/api/analyses` | `GEMINI_API_KEY` not set or invalid | Check Render env vars |
| App loads but API calls fail | Rewrite rule not configured | Re-check Step 3 rewrite rule |
| `DATABASE_URL must be set` error in API logs | Env var missing | Add `DATABASE_URL` to the web service |
| Tables don't exist errors | Schema never pushed | Run `pnpm --filter @workspace/db run push` |
| Chat streams nothing | `GEMINI_API_KEY` missing | Check Render env vars; placeholder response means key is absent |
| Frontend blank / 404 on refresh | Publish directory wrong | Must be `artifacts/scamshield/dist/public` |

---

### Summary Checklist

- [ ] PostgreSQL database created on Render
- [ ] API Web Service created with `DATABASE_URL`, `GEMINI_API_KEY`, `NODE_ENV=production`
- [ ] Database schema pushed (`pnpm --filter @workspace/db run push`)
- [ ] Static Site created with correct build command and publish directory
- [ ] Rewrite rule `/api/*` → API service URL configured on the static site
- [ ] `/api/healthz` returns `{"status":"ok"}`
- [ ] Verify page returns an AI analysis
- [ ] Chat page streams responses
