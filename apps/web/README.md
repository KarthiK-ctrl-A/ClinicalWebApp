# Clinic web app

Next.js doctor and patient portal for records, prescriptions, messages, and audio or video consultations.

## Run locally

1. Install dependencies with `npm install` in this directory.
2. Set these variables in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_API_URL` (for example, `http://localhost:3001`)
3. Start the API in `../api` and run `npm run dev` here.
4. Open `http://localhost:3000`.

The web app calls the API under `/api/v1`. Supabase authentication provides the bearer token, and Supabase Realtime delivers message and call updates.

## Checks

- `npm run lint`: lint the web app
- `npx tsc --noEmit`: typecheck
- `npm run build`: create a production build
