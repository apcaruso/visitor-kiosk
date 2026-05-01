# Visitor Register

A static React frontend for a Supabase-backed visitor register. It is designed for a public kiosk flow and a separate authenticated admin area. It does not include a custom backend server or a hosted Supabase project.

## Purpose

This project helps replace a paper or spreadsheet visitor log with a browser-based check-in and check-out flow. It is intended for companies that are willing to build, the required Supabase database, Auth, Storage, RPC functions, and security policies.

## What it does

- Provides a public kiosk home screen.
- Handles visitor check-in with first name, last name, company, and signature.
- Handles visitor check-out for open visits and captures a final signature.
- Uploads signatures as PNG files to the private Supabase Storage bucket `signatures`.
- Uses Supabase RPC calls for public kiosk actions.
- Provides an admin login using Supabase Auth.
- Checks `public.profiles.is_admin = true` before showing the admin area.
- Lets admins search visits, preview signatures through signed URLs, export CSV files, and correct visit records.

## What is included

- Vite, React, TypeScript, React Router `HashRouter`, and Supabase JS.
- Static frontend source code only.
- Kiosk components optimized for touch use.
- Admin components for filtering, export, signature preview, and record correction.
- Data access services under `src/services`.
- A GitHub Pages deployment workflow.
- Example SQL for additional checkout helper RPCs.

## What is not included

- No custom backend server.
- No serverless functions.
- No hosted Supabase project.
- No production credentials.
- No visitor data, signatures, screenshots with data, CSV exports, database dumps, or backups.
- No complete production security review.
- No license file yet.

## How it works

The app is a static site. GitHub Pages can serve it because routing uses `HashRouter` and Vite builds static assets.

The kiosk flow writes through Supabase RPC functions. The core RPCs expected by the app are:

- `public.kiosk_checkin(...)`
- `public.kiosk_list_open_visits()`
- `public.kiosk_checkout(...)`

The current checkout UI also uses company-based helper RPCs:

- `public.kiosk_search_open_visit_companies(...)`
- `public.kiosk_list_open_visits_by_company(...)`

Check-in uploads the visitor signature to `signatures/checkin/...`, then calls `kiosk_checkin(...)`. Check-out uploads the final signature to `signatures/checkout/...`, then calls `kiosk_checkout(...)`.

The admin area uses Supabase Auth, reads the current user profile from `public.profiles`, and only allows access when `is_admin` is `true`. Admin data access uses the `visits` and `visitors` tables according to the user's Supabase RLS policies.

## Tech stack

- Vite
- React
- TypeScript
- `@supabase/supabase-js`
- `react-router-dom` with `HashRouter`

## Local setup

Install dependencies:

```bash
npm install
```

Create a local `.env` from `.env.example` and fill it with values from your own Supabase project:

```bash
cp .env.example .env
```

Start the dev server:

```bash
npm run dev
```

Run the typecheck:

```bash
npm run lint
```

Build the static site:

```bash
npm run build
```

## Environment variables

The frontend expects these build-time variables:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_TIMEZONE=Europe/Rome
```

Do not commit `.env` files. Never use a Supabase service role key in this frontend.

## Supabase requirements

You must provide your own Supabase setup, including:

- Tables for `visitors`, `visits`, and `profiles`.
- A private Storage bucket named `signatures`.
- Storage paths for `checkin/` and `checkout/` signatures.
- Supabase Auth users for admins.
- `public.profiles.is_admin` values for admin authorization.
- RPC functions used by the kiosk flow.
- RLS, grants, and Storage policies appropriate for your organization.

The admin mapping currently expects these fields:

- `visitors`: `id`, `first_name`, `last_name`, `company`
- `visits`: `id`, `visitor_id`, `visit_date`, `checkin_at`, `checkout_at`, `checkin_signature_path`, `checkout_signature_path`, `status`, `notes`
- `profiles`: `id`, `email`, `full_name`, `is_admin`

SQL files in this repository are examples. Review and adapt them before using them with real data.

## GitHub Pages deployment

The workflow at `.github/workflows/deploy.yml` builds the app and deploys the generated `dist` folder to GitHub Pages.

Repository setup:

1. Create the GitHub repository.
2. Push the project to the `main` branch.
3. In GitHub, set Pages to use GitHub Actions.
4. Add these GitHub Actions repository variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_APP_TIMEZONE`
5. Run the workflow manually or push to `main`.

The workflow uses `npm ci`, `npm run build`, `actions/configure-pages`, `actions/upload-pages-artifact`, and `actions/deploy-pages`.

## Privacy and security notes

Visitor names, companies, visit times, notes, and signatures are personal data. Signatures are especially sensitive.

Do not commit `.env` files, CSV exports, signatures, screenshots containing data, database dumps, or backups.

The Supabase anon key is exposed in the browser by design. RLS policies, RPC grants, `SECURITY DEFINER` behavior, and Storage policies must be reviewed carefully before using real visitor data.

Public kiosk RPCs can expose data if they are designed too broadly. Keep returned fields minimal and test anonymous access explicitly.

SQL files, if present, are examples and must be reviewed before production use.

## License

WTFPL - Do What The Fuck You Want To Public License.
