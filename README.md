# Ben Shand Portfolio

A modern developer portfolio built with Next.js App Router, Supabase, Drizzle ORM, and a Tiptap-powered content system. The project ships a production-ready marketing site and a role-aware dashboard for composing posts, managing resources, and configuring the public experience.

## Features

- **App Router + React Server Components** for fast public pages with 60s incremental revalidation.
- **Tiptap rich-text editor** with autosave, a minimal formatting toolbar, and publish gating.
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

   The seed script loads starter profile settings, categories, three published example posts, books/courses, and an optional owner user when `OWNER_EMAIL` and `OWNER_PASSWORD` are set.

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
- `pnpm db:seed` – populate baseline data (profile settings, categories, bookshelf entries, and example blog posts).

## Authoring Blog Posts

1. Sign in at `/dashboard/sign-in` with an owner or editor account.
2. Navigate to **Posts → New post** and provide a title—slugs auto-generate but remain editable.
3. Compose directly in the inline Tiptap editor using the lightweight toolbar for headings, emphasis, lists, quotes, and code blocks.
4. Use **Save draft** to persist changes or **Publish** to push the post live; summaries are generated automatically from your content.
5. For published posts, the posts list exposes a **View live** link that opens the public blog page in a new tab.

## Tiptap Implementation Notes

- Posts, snapshots, and validation now store [Tiptap](https://tiptap.dev/docs) JSON documents (`doc`, `content[]`). `src/lib/editor.ts` provides shared schemas and helpers.
- The dashboard uses `src/components/client/tiptap-editor.tsx`, a minimal toolbar that mirrors the [Tiptap getting started guide](https://tiptap.dev/docs/editor/getting-started/overview) and stays inline with the form.
- Public rendering happens via `src/features/renderer/tiptap.tsx`, which converts Tiptap JSON to HTML using a shared extension set (`StarterKit`).
- Server actions (`upsertPost`, `duplicatePost`) validate Tiptap JSON, enforce publish rules, and compute reading time from rendered plain text.
- Drafts stay within the dashboard, while published posts expose their public `/blog/[slug]` URL immediately.

## Testing Blog Updates Locally

1. Run `pnpm install` to ensure the latest Tiptap packages and shared editor utilities are installed.
2. Copy `.env.example` to `.env` and fill every Supabase/NextAuth variable; the hero image upload relies on valid Supabase Storage credentials.
3. Apply schema changes with `pnpm db:push`, then seed baseline content via `pnpm db:seed` to load starter categories, bookshelf data, and three published example posts stored as Tiptap JSON.
4. Start the dev server with `pnpm dev` and sign in at `/dashboard/sign-in` using the seeded owner credentials (or create an owner via Supabase if you skipped seeding).
5. Visit `/blog` to confirm the seeded posts render correctly, then open one in the dashboard to experiment with the inline Tiptap editor (headings, lists, code blocks).
6. Publish an edited post or create a new draft to ensure the simplified workflow still generates summaries and updates the live page.

## Architecture Notes

- Public routes default to `revalidate = 60` and load data via Drizzle queries or cached helpers.
- Dashboard pages use server actions guarded by role-based checks. Viewer roles have read-only UI by design.
- Media uploads flow through `/api/upload`, which authenticates the session, streams to Supabase Storage, and writes metadata to the `uploads` table.
- Environment parsing lives in `src/env/server.ts` and `src/env/client.ts` to guarantee secrets stay on the server.
- Tiptap JSON is rendered on the public site through a safe renderer that falls back gracefully on unknown node types.

## Testing

- `pnpm test` – temporarily disabled; skip running Vitest suites for now.
- `pnpm lint` and `pnpm build` should pass before deploying.

## Deployment

- Deploy on Vercel with the environment variables described above.
- Point Supabase Storage remote patterns to allow Next/Image optimization (`next.config.ts`).
- Ensure `DATABASE_URL` references the Supabase transaction pooler and `DIRECT_URL` references the non-pooled connection for migrations.
