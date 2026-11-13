# ClinicalWebApp

**A full-stack clinic portal for secure doctor–patient coordination.**

ClinicalWebApp is a role-based web application that brings together patient records, prescriptions, messaging, and virtual consultations. Doctors can manage their assigned patients and initiate consultations; patients can view their own information and communicate with their assigned doctor.

> **Project scope:** Demonstration/MVP built with synthetic data. It is **not** certified as HIPAA-compliant or approved for real clinical use.

## Live application

- **Frontend:** [clinicalwebapp-web.vercel.app](https://clinicalwebapp-web.vercel.app)
- **Backend:** Deployed on Render (set your service URL in `NEXT_PUBLIC_API_URL`).

Availability depends on the current deployment status and configured integrations.

## Tech stack

| Layer | Technologies |
| --- | --- |
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Backend | NestJS, TypeScript, REST API |
| Authentication | Supabase Auth (email/password, JWT) |
| Database & authorization | Supabase PostgreSQL, Row Level Security (RLS) |
| Realtime messaging & events | Supabase Realtime |
| Virtual consultations | Cloudflare RealtimeKit (audio/video) |
| Deployment | Vercel (web), Render (API) |
| CI | GitHub Actions (backend tests/build; frontend build) |

## Features

### Doctor portal

- Sign in with a doctor account.
- View **only assigned patients** and open their profiles.
- Review laboratory results and imaging reports.
- View and create prescriptions for assigned patients.
- Exchange messages with patients in near real time.
- Initiate audio or video consultations; manage ringing, active, and ended calls.
- Review patient call history, including call outcome and estimated duration.

### Patient portal

- Sign in with a patient account.
- View a dashboard with assigned doctor details and consultation information, when available.
- Send and receive messages with the assigned doctor.
- Receive, accept, or decline incoming consultation requests.
- Join audio/video consultations.
- Access a **read-only My Prescriptions** page for their own prescriptions.

**Feature validation note:** The patient prescription endpoint (`GET /api/v1/prescriptions/me`) and its UI have been added to the project workflow, but record visibility must be verified against the current patient associations and RLS policies. Audio/video preset selection and call-screen cleanup also require end-to-end verification in the deployed environment. See [Known limitations](#known-limitations--next-steps).

## Architecture

```text
                       ┌───────────────────────────────┐
                       │ Next.js / React (Vercel)      │
                       │ Doctor and patient portals    │
                       └──────────────┬────────────────┘
                                      │ HTTPS + JWT
                                      ▼
                       ┌───────────────────────────────┐
                       │ NestJS REST API (Render)      │
                       │ Controllers → Services →      │
                       │ Repositories                  │
                       └──────────────┬────────────────┘
                                      │ User-scoped requests
                                      ▼
                       ┌───────────────────────────────┐
                       │ Supabase                      │
                       │ Auth · PostgreSQL · RLS       │
                       │ Realtime                      │
                       └───────────────────────────────┘

           Cloudflare RealtimeKit handles consultation media sessions.
```

The backend is organized as a **modular monolith**, with feature-specific controllers, services, repositories, and DTOs. Business logic and authorization checks are kept server-side. The client uses the Supabase publishable key; privileged credentials remain on the server.

### Repository layout

```text
ClinicalWebApp/
├── .github/
│   └── workflows/
│       └── ci.yml
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── common/           # Auth guards, roles, decorators
│   │   │   ├── database/         # Supabase integration
│   │   │   ├── integrations/     # Cloudflare RealtimeKit
│   │   │   └── modules/          # Auth, patients, medical records,
│   │   │                        # prescriptions, messaging, calls
│   │   └── scripts/             # Demo data seeding
│   └── web/
│       └── src/
│           ├── app/              # Login, doctor, and patient routes
│           ├── features/         # Messaging and calling components
│           ├── lib/              # API and Supabase clients
│           └── types/
└── supabase/
    └── migrations/              # Database schema and RLS policies
```

The directory tree summarizes the intended structure; individual files may vary as features evolve.

## Data model & access control

Core tables include:

- `profiles` — users' display details and doctor/patient roles.
- `patients` — patient details, linked login (`user_id`), and assigned doctor (`doctor_id`).
- `lab_results` and `imaging_reports` — clinical records.
- `prescriptions` — medication orders associated with patients and doctors.
- `messages` — doctor–patient conversation history.
- `calls` and `call_participants` — consultation lifecycle and Cloudflare participant mapping.
- `appointments` — optional scheduled consultation information.

**Authorization model:**

- NestJS authenticates the Supabase access token and applies role checks.
- Doctor operations verify the requested patient is assigned to that doctor.
- Patient-facing endpoints identify the patient from the authenticated user, **not** from a client-supplied patient ID.
- Supabase RLS is an additional database-level boundary. Policies must be reviewed and tested for each table.
- Never use an administrative Supabase key in the frontend or in a `NEXT_PUBLIC_*` environment variable.

## Getting started locally

### Prerequisites

- Node.js **24** and npm (the CI workflow uses Node.js 24).
- A Supabase project with authentication, schema migrations, and RLS configured.
- A Cloudflare RealtimeKit application and API token for virtual consultations.
- Access to the Git repository.

### 1. Clone

```bash
git clone <YOUR_REPOSITORY_URL>
cd ClinicalWebApp
```

### 2. Configure backend variables

Create `apps/api/.env` using your own values:

```dotenv
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY=YOUR_SUPABASE_SERVER_SECRET_KEY

CLOUDFLARE_ACCOUNT_ID=YOUR_CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_REALTIMEKIT_APP_ID=YOUR_REALTIMEKIT_APP_ID
CLOUDFLARE_API_TOKEN=YOUR_CLOUDFLARE_API_TOKEN
CLOUDFLARE_AUDIO_PRESET=YOUR_AUDIO_PRESET_NAME
CLOUDFLARE_VIDEO_PRESET=YOUR_VIDEO_PRESET_NAME
```

`FRONTEND_URL` must be a valid, complete origin; it is used to configure backend CORS.

### 3. Configure frontend variables

Create `apps/web/.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Do not append `/api/v1`** to `NEXT_PUBLIC_API_URL`; the existing frontend API helper includes the API route prefix.

### 4. Prepare Supabase

Apply the SQL migrations in `supabase/migrations/` to your **development** Supabase project, then verify that the RLS policies permit only authorized doctor/patient access.

The repository includes a demo-seeding script at `apps/api/scripts/seed.mjs` in the project structure. If present and configured, run it **only against a disposable development database**:

```bash
cd apps/api
node scripts/seed.mjs
```

The demonstration dataset is designed for **2 doctors and 40 patients** (20 assigned to each doctor), with synthetic medical records. Do not run the seed script against a production database without reviewing its behavior.

### 5. Run the backend

From a terminal in the repository root:

```bash
cd apps/api
npm ci
npm run start:dev
```

Health endpoint: `http://localhost:3001/api/v1/health`

### 6. Run the frontend

In another terminal:

```bash
cd apps/web
npm ci
npm run dev
```

Visit `http://localhost:3000` and sign in using accounts created in your Supabase development project. Keep demo passwords out of the repository.

## Selected API endpoints

All routes are prefixed with `/api/v1`.

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/health` | Public | Health check |
| `GET` | `/me` | Authenticated | Current user/profile |
| `GET` | `/patients` | Doctor | Assigned patients |
| `GET` | `/patients/:id` | Doctor | Assigned patient details |
| `GET` | `/patients/:id/records` | Doctor | Lab and imaging records |
| `GET` | `/patients/:id/prescriptions` | Doctor | Patient prescriptions |
| `POST` | `/patients/:id/prescriptions` | Doctor | Create prescription |
| `GET` | `/prescriptions/me` | Patient | Own prescriptions (read-only) |
| `GET`, `POST` | `/messages/patients/:patientId` | Doctor | Patient conversation |
| `GET`, `POST` | `/messages/me` | Patient | Own conversation |
| `POST` | `/calls` | Doctor | Initiate consultation |
| `GET` | `/calls/current` | Patient | Current incoming/active call |
| `GET` | `/calls/patients/:patientId/current` | Doctor | Current patient call |
| `POST` | `/calls/:id/accept` | Patient | Accept call |
| `POST` | `/calls/:id/decline` | Patient | Decline call |
| `POST` | `/calls/:id/token` | Authorized participant | Obtain participant access token |
| `POST` | `/calls/:id/end` | Authorized participant | End call |
| `GET` | `/calls/patients/:patientId/history` | Doctor | Consultation history |

The endpoints above reflect the application's described implementation; confirm registered routes against NestJS startup logs after pulling the latest branch.

## Tests & CI

Backend:

```bash
cd apps/api
npm test -- --runInBand
npm run build
```

Frontend:

```bash
cd apps/web
npx tsc --noEmit
npm run build
```

GitHub Actions is configured through `.github/workflows/ci.yml` to run on pull requests to `main`, pushes to `main`, and manual dispatch. It validates **backend unit tests + build** and **frontend production build**. ESLint was temporarily excluded from the workflow during submission preparation; it should be restored after the outstanding lint findings are addressed.

The CI build uses non-production placeholder public variables. It does not contact a real Supabase/Cloudflare environment unless additional integration-test configuration is added.

## Deployment

### Frontend — Vercel

- Set project root directory to `apps/web`.
- Select the **Next.js** framework preset.
- Set actual `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_API_URL` values in Vercel's environment settings.
- `NEXT_PUBLIC_API_URL` must point to the Render service origin, without `/api/v1`.

### Backend — Render

- Set service root directory to `apps/api`.
- Build with `npm ci && npm run build`.
- Start using the project's configured NestJS production start script.
- Set `FRONTEND_URL` to the **exact Vercel production origin**, including `https://`.
- Configure Supabase server credentials and Cloudflare RealtimeKit credentials in Render's private environment settings.
- Verify `GET /api/v1/health` after deployment.

GitHub Actions validates pull requests; Vercel and Render handle deployment according to their configured Git integrations. Passing CI does not by itself guarantee a successful deployment.

## Manual verification checklist

1. Doctor 1 can view only Doctor 1's assigned patients; Doctor 2 cannot access them by changing a URL.
2. Each patient can access only their own prescriptions and messages.
3. A doctor can create a prescription and the associated patient can view it after refresh.
4. A patient can receive and accept/decline a consultation request.
5. Audio consultations use an **audio-only Cloudflare preset**; video consultations enable video.
6. Ending a call clears the meeting UI for both participants.
7. Call history shows the appropriate outcome and estimated duration.
8. Sign-out and account switching clear previous users' sensitive UI state.

## Known limitations & next steps

- **Prescription visibility:** Verify the relationship between `patients.user_id`, `patients.id`, and `prescriptions.patient_id`, plus patient `SELECT` RLS policies. Rows in the database do not guarantee the authenticated patient can read them.
- **RealtimeKit lifecycle:** Validate single meeting initialization, audio/video preset selection, call end cleanup, and cross-participant status synchronization.
- **Call durations:** Current history duration is an estimate based on application timestamps, not a verified media-connected duration.
- **Appointments:** Next-consultation details are available only when scheduling data exists.
- **CI quality gates:** Restore ESLint checks after resolving React Hooks lint issues, and expand authorization/integration test coverage.
- **Production readiness:** A production healthcare system would require a formal security and privacy assessment, audit logging, monitoring, backup/recovery procedures, retention policies, and other applicable compliance work.

## Security and data disclaimer

This project is intended as a **technical demonstration** using **synthetic patient data only**. Do not upload real protected health information (PHI) or production credentials to the repository. Using Supabase RLS, authenticated APIs, and hosted services alone does **not** establish HIPAA compliance.

## License

No license has been specified. All rights are reserved unless a license file is added by the repository owner.
