# Clinic API

NestJS API for authentication, patient records, prescriptions, messaging, and consultations. Supabase stores application data; Cloudflare RealtimeKit handles calls.

## Run locally

1. Install dependencies with `npm install` in this directory.
2. Set the environment variables below in `.env`.
3. Apply the SQL files in `../../supabase/migrations` in filename order to your Supabase project.
4. Start the API with `npm run start:dev`. It listens on port 3001 by default.

Required environment variables:

- `FRONTEND_URL`: allowed web origin, such as `http://localhost:3000`
- `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`
- `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_REALTIMEKIT_APP_ID`, `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_AUDIO_PRESET`, `CLOUDFLARE_VIDEO_PRESET`

Optional variables: `PORT`, `NODE_ENV`, and `DEMO_PASSWORD` (used by the seed and verification scripts).

## Checks

- `npm run build`: compile the API
- `npm run lint`: lint source and tests
- `npm test`: run unit tests

The scripts in `scripts/` seed demo accounts and verify access rules against a configured Supabase project. They use the demo password and can write data; run them only against a test project.
