# AGENTS.md

## Project Purpose

Kiosk-first static frontend for a visitor register, deployable to GitHub Pages, with Supabase as the only external backend.

## Non-Negotiable Constraints

- Do not create backend servers or server functions in this repository.
- Do not use a Supabase service role key in the frontend.
- Do not bypass Supabase with custom APIs.
- The public kiosk must use Supabase RPC functions for kiosk actions:
  - `public.kiosk_checkin(...)`
  - `public.kiosk_list_open_visits()`
  - `public.kiosk_checkout(...)`
- Signatures must be uploaded to the private `signatures` bucket under:
  - `checkin/`
  - `checkout/`
- The admin area must use Supabase Auth and verify `public.profiles.is_admin = true`.
- The app must remain compatible with static GitHub Pages hosting.

## Current Stack

- Vite
- React
- TypeScript
- `@supabase/supabase-js`
- `react-router-dom` with `HashRouter`

## Architecture To Preserve

- `src/config`: environment loading and app configuration
- `src/lib`: shared Supabase client
- `src/services`: data access separated from UI (`auth`, `rpc`, `storage`, `admin`)
- `src/components/kiosk`: touch-first kiosk components
- `src/components/admin`: admin backoffice components
- `src/utils`: date/time, CSV, validation, and error handling
- `src/auth`: admin authentication provider and state

## Operating Rules For Future Agents

- Before changing admin queries or mapping logic, verify the real fields exposed by Supabase. The fields already confirmed for this project are:
  - `visitors.id`, `first_name`, `last_name`, `company`
  - `visits.id`, `visitor_id`, `visit_date`, `checkin_at`, `checkout_at`, `checkin_signature_path`, `checkout_signature_path`, `status`, `notes`
  - `profiles.id`, `email`, `full_name`, `is_admin`
- If a backend change seems necessary, do not apply it from this repository. Document it in `README.md` and explain why it is needed.
- Keep the data access layer separate from UI. Do not put Supabase calls directly in components when an appropriate service exists.
- Keep the kiosk area minimal: no tables, no visit history, and no admin-only elements.
- Every new kiosk feature must consider:
  - touch-first use
  - timeout/reset behavior
  - clear loading states
  - clear error handling
  - minimal local draft persistence
- Every new admin feature must consider:
  - Auth session state
  - admin verification
  - RLS behavior
  - export and auditability of data

## Useful Commands

- Install: `npm install`
- Typecheck: `npm run lint`
- Production build: `npm run build`
- Dev server: `npm run dev`

## Deployment Notes

- GitHub Pages uses `HashRouter`; do not switch to server-side routing unless a suitable fallback is introduced.
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_APP_TIMEZONE` must be supplied at build time.
