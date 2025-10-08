# Project Implementation Plan

## Overview
This plan outlines how to deliver a modern, fast, and accessible developer portfolio web application that satisfies the provided specifications. The work is split into phases that can be tackled iteratively while maintaining deployable increments.

## Phase 0 – Project Foundations
1. **Repository setup**
   - Initialize Next.js (App Router, TypeScript, Tailwind, pnpm) scaffold.
   - Configure shadcn/ui with base components and design tokens (Inter via `next/font`).
   - Establish base Tailwind config: typography scale, spacing grid, color tokens (`--bg`, `--fg`, etc.), motion timing.
2. **Developer tooling**
   - Configure ESLint, Prettier, Husky (pre-commit lint), and lint-staged.
   - Add `pnpm` scripts: `dev`, `build`, `start`, `lint`, `test`, `db:*` commands.
   - Document environment variables in `.env.example` and `README` (shared Supabase DB warning).
3. **CI/CD**
   - Set up GitHub Actions: lint + type-check, run unit tests, ensure Drizzle schema validation.
   - Draft Vercel project configuration and Supabase provisioning checklist.

## Phase 1 – Data & Infrastructure
1. **Database schema**
   - Define Drizzle schema per spec (users, profile_settings, blog tables, books, courses, uploads, snapshots).
   - Add indexes, constraints, enums, relations, migrations via drizzle-kit.
   - Seed script to insert base data (profile settings, categories, draft post, books, courses, owner user from env).
2. **Supabase integration**
   - Configure Supabase client helper (service role for server actions only).
   - Storage bucket setup (`uploads`), signed URL utilities, image metadata storage.
   - Establish remotePatterns for Supabase in `next.config.js` for `next/image`.
3. **Auth & middleware**
   - Implement NextAuth Credentials provider with bcrypt hashing.
   - Middleware to guard `/dashboard/*` and API routes by role (`owner`, `editor`, `viewer`).
   - Session callbacks to include role; secure cookie options.

## Phase 2 – Public Site (RSC-first)
1. **Global layout & theming**
   - App Router layout with metadata, Inter font, color theme toggle with system preference support.
   - Build header/footer components with navigation, social links, resume links, contact CTA.
2. **Home page**
   - Server component fetching `profile_settings` (ISR 60s, `revalidateTag('profile')`).
   - Present hero text, contact links, social icons (Lucide), resume buttons.
3. **Blog listing**
   - Server components for `/blog` with pagination (page size 10), search (`?q=`), category/tag filters, `cacheTag: blog:list`.
   - `/categories/[slug]` page filtering posts.
4. **Blog detail**
   - Static generation with incremental revalidation, `cacheTag: blog:post:{id}`.
   - Render Editor.js JSON blocks via safe renderer (paragraph, header, list, image, code, quote, checklist). Handle unknown blocks.
   - Include SEO metadata, JSON-LD, reading time, category/tags, next/prev links.
5. **Bookshelf & Courses**
   - `/books` sorts by `order_index`.
   - `/courses` filter by `discipline` (RSC) with toggles.

## Phase 3 – Dashboard (Client-heavy)
1. **Shell & navigation**
   - Protected layout with role banner (shared Supabase DB warning).
   - shadcn/ui navigation, breadcrumbs, command palette (Cmd/Ctrl+K).
2. **Posts module**
   - List view: filters (status, category, tag), search, row actions, status badges, `revalidate` hooks.
   - Editor view: form using react-hook-form + Zod. Autosave (every 10s/on blur), dirty state warning, save status indicator.
   - Editor.js integration with required tools, hero image selector (media picker), validation for publish (title, summary ≤180, category, hero image, ≥1 block).
   - Publish/unpublish toggles adjust `status`, `published_at` (validate), call revalidation API.
   - Versioning: maintain last 5 snapshots (separate table or JSONB array) with restore capability.
3. **Categories**
   - CRUD UI. Prevent delete if posts exist unless reassignment flow.
4. **Books**
   - CRUD with drag-and-drop reorder (persist `order_index`), cover upload.
5. **Courses**
   - CRUD with discipline select and CSV bulk import (server parsing, validation feedback).
6. **Settings**
   - Form for hero text, contact email, socials, resume URLs, favicon/OG defaults upload. Autosave + dirty warning.
7. **Media library**
   - Grid view with search by filename/tag, copy URL, soft-delete (flag, ensure not referenced).

## Phase 4 – APIs & Revalidation
1. **Server actions**
   - Implement typed server actions with Zod validation for CRUD operations.
   - Ensure role-based checks and rate limiting (10/min/IP) on admin POST routes.
2. **Upload API**
   - `/api/upload` handles Editor.js image uploads, stores metadata in `uploads` table, returns JSON with `publicUrl`.
3. **Revalidation API**
   - `/api/revalidate` verifying `REVALIDATE_SECRET` to trigger path/tag revalidation.
4. **Revalidation hooks**
   - On mutation actions, revalidate `/blog`, `/blog/[slug]`, category/tag pages via cache tags.

## Phase 5 – Performance, Accessibility, and Testing
1. **Performance tuning**
   - Ensure ISR and caching configured, Next/Image widths/heights, font `swap`, minimal CLS.
   - Lighthouse checks for LCP ≤2.5s on 4G, CLS <0.1.
2. **Accessibility**
   - Audit with axe and manual keyboard testing. Provide alt text, focus states, reduced motion support.
3. **Testing**
   - Unit tests for data validation, auth, server actions.
   - Component tests for Editor.js renderer (at least six block types) using React Testing Library.
   - End-to-end smoke tests for dashboard flows (Playwright) focusing on role guards and publish workflow.

## Phase 6 – Deployment & Operations
1. **Vercel deployment**
   - Connect repo, configure environment variables (shared Supabase DB, pooler URL).
   - Set up preview deployments using same Supabase DB with clear warning.
2. **Supabase operations**
   - Configure daily backups, monitoring, alerting.
   - Document restore steps.
3. **Monitoring & logging**
   - Set up error tracking (Sentry) and log aggregation.
4. **Documentation**
   - Update README with setup instructions, admin usage guide, deployment process, backup strategy.

## Milestones & Deliverables
- **Milestone 1:** Foundations + schema + seed data.
- **Milestone 2:** Public site MVP (home, blog list/detail, books, courses).
- **Milestone 3:** Dashboard posts module with Editor.js integration.
- **Milestone 4:** Remaining dashboard modules, media library, autosave/versioning.
- **Milestone 5:** Testing, performance, accessibility, deployment readiness.

## Risks & Mitigations
- **Shared database across environments**: Show prominent admin banner; implement feature flags for destructive actions.
- **Editor.js complexity**: Start integration early, wrap in reusable component, ensure server-side renderer robust to schema changes.
- **Autosave conflicts**: Use optimistic UI with version field; warn on concurrent updates; consider row-level locking or compare timestamps.
- **Supabase rate limits**: Batch operations where possible, implement exponential backoff.
- **Security**: Strict separation of service role usage; never expose in client; audit API routes.

## Success Criteria
- Meets non-negotiables (Editor.js persistence, Supabase storage, Vercel deployment, auth & role guard).
- Public pages load within performance targets and pass accessibility audits.
- Admin dashboard supports full CRUD workflows with autosave/versioning, revalidation occurs within 60 seconds of publish actions.
- Comprehensive documentation, CI, and backup procedures in place.

