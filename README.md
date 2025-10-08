# Ben Shand Portfolio

A modern developer portfolio built with Next.js App Router, Supabase, Drizzle ORM, and an Editor.js-powered content system. The project ships a production-ready marketing site and a role-aware dashboard for composing posts, managing resources, and configuring the public experience.

## Features

- **App Router + React Server Components** for fast public pages with 60s incremental revalidation.
- **Editor.js authoring experience** with autosave, preview mode, and server-side validation.
- **Supabase Postgres and Storage** accessed via Drizzle ORM and service-only upload endpoints.
- **Role-based dashboard** with NextAuth credentials auth, command-friendly forms, and media management.
- **Books, courses, and categories** management with drag-like ordering controls and bulk CSV import.
- **Cache-aware mutations** triggering `revalidatePath`/`revalidateTag` for fresh public data.

## Getting Started

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Create an `.env` file** from `.env.example` and populate the required values. All environments share a single Supabase database; consider enabling a banner warning in Settings to remind administrators.

3. **Run database migrations and seed data**

   ```bash
   pnpm db:push
   pnpm db:seed
   ```

   The seed script loads starter profile settings, categories, a draft post, example books/courses, and an optional owner user when `OWNER_EMAIL` and `OWNER_PASSWORD` are set.

4. **Start the development server**

   ```bash
   pnpm dev
   ```

   Visit [http://localhost:3000](http://localhost:3000) to view the public site. Dashboard routes live at `/dashboard` and require credentials seeded above.

## Scripts

- `pnpm dev` – start the Next.js development server.
- `pnpm build` – compile the production build.
- `pnpm start` – run the production server.
- `pnpm lint` – run ESLint via `next lint`.
- `pnpm db:generate` – generate Drizzle SQL from schema.
- `pnpm db:push` – apply schema changes to the database.
- `pnpm db:studio` – open Drizzle Studio.
- `pnpm db:seed` – populate baseline data.

## Architecture Notes

- Public routes default to `revalidate = 60` and load data via Drizzle queries or cached helpers.
- Dashboard pages use server actions guarded by role-based checks. Viewer roles have read-only UI by design.
- Media uploads flow through `/api/upload`, which authenticates the session, streams to Supabase Storage, and writes metadata to the `uploads` table.
- Environment parsing lives in `src/env/server.ts` and `src/env/client.ts` to guarantee secrets stay on the server.
- Editor.js blocks are rendered on the public site through a safe renderer that falls back gracefully on unknown block types.

## Testing

Automated tests are not yet included. Recommended follow-ups:

- Add unit tests for server actions and schema invariants.
- Snapshot-test the Editor.js renderer on representative content.
- Integrate linting and type checking into CI pipelines.

## Deployment

- Deploy on Vercel with the environment variables described above.
- Point Supabase Storage remote patterns to allow Next/Image optimization (`next.config.ts`).
- Ensure `DATABASE_URL` references the Supabase transaction pooler and `DIRECT_URL` references the non-pooled connection for migrations.
