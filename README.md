# CobroFlow Lite

AR automation MVP for Spanish SMBs (asesorías, consultoras, agencias): import
unpaid invoices from a CSV export and let CobroFlow chase them by email on a
fixed schedule (15 / 30 / 45 days overdue).

Scope is intentionally narrow — see the product spec for what's explicitly
out of scope for this MVP (payment processing, real accounting integrations,
multi-user roles, etc.).

## Stack

- Next.js 14 (App Router) + TypeScript, Tailwind CSS
- Prisma ORM + PostgreSQL
- TanStack Query, React Hook Form + Zod
- SendGrid for transactional email
- JWT session cookies via `jose` (edge-compatible, so `middleware.ts` can
  verify sessions without a Node runtime)

## Local setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Database.** Point `DATABASE_URL` at a Postgres 15+ instance (Supabase
   works well for this). Copy `.env.example` to `.env` and fill in real
   values — `.env` is gitignored.

   ```bash
   cp .env.example .env
   ```

3. **Run migrations**

   ```bash
   npm run db:migrate
   ```

4. **SendGrid.** Set `SENDGRID_API_KEY` and `SENDGRID_FROM_EMAIL` (a verified
   sender) to actually send reminder emails. Without these, sends fail
   gracefully and get logged as `failed` in `email_logs`.

5. **Start the dev server**

   ```bash
   npm run dev
   ```

   Visit http://localhost:3000.

## Testing

```bash
npm test          # run once
npm run test:watch
```

Unit tests cover the pure domain logic: aging/DSO calculations, CSV parsing
and validation, the reminder-scheduling decision, password hashing, and
email template rendering.

```bash
npm run lint
npx tsc --noEmit
```

## Daily reminder job

`GET /api/cron/send-reminders` sends the next due reminder (1/2/3) for every
unpaid invoice that has crossed the relevant overdue threshold and hasn't
had that reminder sent yet. It's driven by "days overdue ≥ threshold and not
yet sent" rather than an exact-day match, so a missed run doesn't
permanently skip an invoice.

It's protected by a bearer token check against `CRON_SECRET`. On Vercel,
setting the `CRON_SECRET` env var makes the platform's Cron Jobs feature
send that header automatically — see `vercel.json` for the schedule
(`0 8 * * *` UTC ≈ 9:00 in Madrid winter time; Vercel Cron has no timezone
support, so this drifts an hour during DST).

If you deploy elsewhere (Railway, Render), hit that endpoint from any
external scheduler (e.g. GitHub Actions cron, cron-job.org) with the same
`Authorization: Bearer $CRON_SECRET` header.

## Logo uploads

`PUT /api/user/settings` currently writes uploaded logos to
`public/uploads/logos/` on local disk. That's fine for a single Railway
instance but won't survive a redeploy on serverless compute (Vercel) —
swap it for object storage (Supabase Storage or S3) before deploying there.

## Project structure

- `src/lib/` — domain logic and infra, kept independent of the HTTP layer
  (`invoice-metrics.ts`, `csv-import.ts`, `reminders.ts`, `email/`)
- `src/app/api/` — Next.js route handlers (thin HTTP wrappers around `lib/`)
- `src/app/(auth)/`, `src/app/dashboard/` — pages
- `src/components/` — UI

## Deployment

- Frontend + API routes: Vercel
- Database: Supabase (Postgres)
- Alternative backend host: Railway (if you outgrow Vercel's serverless
  filesystem constraints, e.g. for the logo upload path above)
