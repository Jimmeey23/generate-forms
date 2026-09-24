# Physique 57 Form Generator

A modern event and influencer sign-up form generator backed by Supabase. Every generated form receives a stable visual identity derived from its event brief, including layout, palette, hero treatment, spacing, metadata, and Physique 57 branding.

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and add the server-only Supabase and Momence values.
3. Link the Supabase project and run `supabase db push`.
4. Start the frontend and API together with `npm run dev`.
5. Open `http://localhost:8080`.

The API runs on port `8787`; Vite proxies `/api` requests to it during development.

## Environment

Never expose `SUPABASE_SERVICE_ROLE_KEY` or Momence tokens through `VITE_` variables. They are read only by the Express server. See `.env.example` for the required variable names.

## Checks

```bash
npm run typecheck
npm run build
```
