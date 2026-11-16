# MORX — Existing System Architecture & Audit Report

**Date:** October 31, 2026  
**Auditor:** Senior Backend Architect & API Integration Engineer  
**System:** Morx Team Collaboration & Project Management Platform

---

## 1. Executive Summary

This audit assesses the current state of the Morx platform prior to implementing the **Unified API Gateway & Provider Intelligence Platform**. The Morx core is a production-oriented team management, project tracking, and AI collaboration application.

The platform will be extended with an independent, intelligent API Gateway under `/api/v1/*` without altering or breaking any existing core application features, databases, or user-facing routes.

---

## 2. Technical Stack Audit

### 2.1 Frontend Architecture
* **Framework:** Next.js 14.2.35 (React 18.3, App Router).
* **Styling & UI:** Tailwind CSS, Radix UI primitives (`@radix-ui/*`), Framer Motion, Lucide React icons.
* **Data Visualization:** Recharts.
* **Component Model:** Functional components with React hooks and client components (`"use client"`).

### 2.2 Backend & API Architecture
* **Architecture:** Next.js Route Handlers (`app/api/**/route.ts`).
* **HTTP Processing:** Native `NextRequest` and `NextResponse`.
* **Standard Response Envelope:** `ApiResponse<T>` defined in `lib/types/index.ts` containing `{ success, data?, error?, message?, limitReached? }`.
* **Versioning:** Prior to this initiative, routes were unversioned under `/api/{resource}`. The new gateway will introduce clean versioning under `/api/v1/{service}`.

### 2.3 Database & ORM
* **Primary Database:** Supabase (Cloud PostgreSQL with PostgREST).
* **Client Access:** `@supabase/supabase-js` and `@supabase/ssr`.
* **Client Instances:**
  * `lib/supabase.ts`: Provides `supabaseAdmin` utilizing `process.env.SUPABASE_SERVICE_ROLE_KEY` with a 30-second fetch timeout.
  * `lib/supabase/client.ts` & `lib/supabase/server.ts`: Handle browser/SSR cookie-based auth contexts.
* **Legacy Compatibility:** `lib/utils/db-helpers.ts` and `lib/utils/supabase-helpers.ts` convert legacy MySQL syntax to PostgreSQL.
* **Core Tables:** `users`, `teams`, `projects`, `tasks`, `task_comments`, `ai_usage`, `notifications`, `templates`, `surveys`.

### 2.4 Authentication & Authorization
* **Provider:** NextAuth.js (`app/api/auth/[...nextauth]/route.ts`) supporting:
  * Google OAuth (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`).
  * Credentials Provider (Email/Password verified via bcrypt with Supabase user lookup).
* **Session Strategy:** JWT session tokens supplemented by `morx_session` cookie for client hydration.
* **Route Protection:** Higher-order helper `withAuth` and `requireAuth` in `lib/middleware/auth.ts`, checking NextAuth session followed by `morx_session` fallback.

### 2.5 Existing API Integrations
* **OpenRouter API:** Used for generative AI assistance, project descriptions, and Scrum reports (`lib/utils/ai.ts`).
* **Google OAuth & GitHub OAuth:** Used for single sign-on.
* **Supabase REST API:** Used for data storage and auth verification.

### 2.6 Environment Variables & Configuration
* `.env.local` contains credentials for:
  * `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  * `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
  * `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
  * `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
  * `ANALYTICS_PASSWORD`
  * `OPENROUTER_API_KEY`
  * `CRON_SECRET`

### 2.7 Middleware & Caching
* **Root Middleware:** No root `middleware.ts` is currently present, meaning route protection and rate limiting have been handled at the route handler level.
* **Caching:** Currently relies on Next.js default fetch cache semantics (`force-dynamic` / `revalidate`). No distributed Redis instance is currently connected.

### 2.8 Existing Dashboard & Administration
* **Analytics Page:** `app/analytics/page.tsx` backed by `app/api/analytics/route.ts`, protected via an administrative password (`ANALYTICS_PASSWORD`).
* **System Metrics:** Displays user counts, teams, projects, task metrics, and recent activity.

---

## 3. Proposed Gateway Integration Points & Isolation Strategy

```text
Existing Morx Core                    New Intelligent API Gateway
===================                   ============================
/app                                  /app/api/v1/
  /teams, /projects, /tasks              /videos/search
  /analytics, /docs                      /tiktok/*
  /api/ai/*                              /instagram/*
  /api/auth/*                            /weather/*
  /api/health                            /maps/*
                                         /routes/*
                                         /gateway/* (Admin & Keys)
                                      
                                      /lib/gateway/
                                         /core (orchestrator, registry, cache, limiter)
                                         /providers (youtube, openweather, google-maps, etc.)
                                         /normalizers
                                         /security
```

### Critical Architectural Guarantees:
1. **Zero Core Degradation:** Existing team, project, auth, and analytics routes will remain completely untouched.
2. **Dedicated Modular Engine:** All gateway logic will live in `lib/gateway/` and routes will be isolated in `app/api/v1/`.
3. **Storage Compatibility:** Database tables for API clients and usage (`api_clients`, `api_keys`, `api_usage`, `providers`, `provider_health`) will be added idempotently with in-memory / fallback resilience so the application remains 100% operational even prior to running database migrations.
4. **Security Isolation:** Client API keys (`Bearer morx_...`) are strictly hashed using SHA-256 and verified independently from internal provider secrets. External provider API keys are never leaked to client responses.

---

## 4. Potential Breaking Changes & Mitigations

| Area | Potential Risk | Mitigation |
|---|---|---|
| Routing Conflicts | Overlapping path definitions | Explicitly namespace the gateway under `/api/v1/*` |
| Database Migration | Schema locks or missing tables | Implement graceful fallback to resilient mock/memory storage when tables are missing |
| TypeScript Compatibility | Interface collisions | Encapsulate gateway models in `lib/gateway/types/` |
| Quota Overruns | Cost spikes on Google / YouTube APIs | Enforce local in-memory caching and request deduplication before outbound calls |

