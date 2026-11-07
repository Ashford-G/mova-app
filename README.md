# MOVA Next — additive React migration

This folder is a **separate frontend project** intended to be uploaded into the existing repository as `mova-next/`.
It does not overwrite or delete the existing root-level `index.html`, `styles.css`, `app.js`, SQL files, or Supabase functions.

## Important status

This is a migration foundation and polished React interface shell, not a verified one-to-one port of the old MOVA app. The previous source files and live database schema were not available to this build process, so existing financial calculations, table names, RLS assumptions, AI endpoints, and payment flows are deliberately not guessed.

The new app includes:
- React + TypeScript + Vite
- Tailwind CSS v4
- shadcn/ui-compatible configuration and reusable accessible UI primitives
- Supabase client setup using public frontend environment variables
- Email/password sign-in and sign-up
- Protected app shell and responsive navigation
- Dashboard, Intelligence, Safe, Price, Goals, Transactions, AI Coach, Profile screens (UI foundations)
- Demo-safe empty states and sample display values clearly marked as demo data
- A migration adapter boundary for wiring existing Supabase tables/functions after schema review

## Do not delete the old app yet

Keep the old root files and current Vercel deployment as the fallback until each feature has been connected to the real database and tested.

## Setup

1. Upload this entire `mova-next` folder into the existing GitHub repository without replacing root files.
2. In Vercel, create a **separate preview project** pointing to the same repository:
   - Root Directory: `mova-next`
   - Framework: Vite
   - Build command: `npm run build`
   - Output directory: `dist`
3. Add environment variables to the Vercel preview project:
   - `VITE_SUPABASE_URL` = existing Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = existing publishable/anon key
4. Locally, copy `.env.example` to `.env.local` and fill those same public values.
5. Install and run:
   ```bash
   npm install
   npm run dev
   ```
6. Build check:
   ```bash
   npm run build
   ```

## Security

- Never put Supabase `service_role`, secret API keys, Pesepay keys, Paynow integration keys, or other private credentials in `VITE_*` variables or browser code.
- `VITE_*` values are bundled into the public frontend. Only Supabase's publishable/anon key belongs here, protected by correct RLS.
- Keep payment provider secrets in Supabase Edge Function secrets.
- Existing `rapid-api` and `create-pesepay-payment` functions are not modified by this project.
- If a real secret key was ever committed in `app.js` or another public GitHub file, rotate it with its provider.

## Migration checklist

- [ ] Confirm exact existing Supabase tables, columns, views, RPCs and Edge Functions.
- [ ] Reuse existing auth users and project; do not create a new Supabase project.
- [ ] Map transactions, goals, obligations, savings, Safe-to-Spend, MOVA Safe and MOVA Price to the real schema.
- [ ] Port the exact financial calculations and test against known existing account data.
- [ ] Reconnect Intelligence and AI Coach to their existing approved backend functions.
- [ ] Reconnect trial/Free/Pro entitlement checks; never trust a frontend-only plan flag.
- [ ] Implement and verify payment status server-side before activating Pro.
- [ ] Test two separate accounts and confirm RLS isolation.
- [ ] Test mobile layouts and accessibility.
- [ ] Only then consider switching the production domain.

## Why some screens use placeholders

A safe migration must not invent the current MOVA database schema or silently replace working business logic. The screen structure is ready, while the data adapter is intentionally isolated so we can wire the existing backend precisely after inspecting the original source and schema.
