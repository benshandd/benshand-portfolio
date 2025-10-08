# benshand-portfolio Agent Guide

## Workflow
- Use `pnpm` for dependency installation and scripts.
- Follow the phase structure and priorities defined in `PLAN.md`; update it when scope meaningfully changes.
- Keep public routes server-first (App Router RSC) and isolate client components under `src/components/client/` when interactivity is required.

## Coding Standards
- Place server mutations in `src/server/actions/` and validate all inputs with Zod before touching the database.
- Centralize Supabase helpers in `src/server/supabase/`; never expose service role credentials to client code.
- Organize Editor.js authoring tools under `src/features/editor/` and the read-only renderer under `src/features/renderer/`.
- Enforce kebab-case slugs and update slug history whenever a post slug changes.

## Testing & Quality
- Prefer Vitest for unit/integration tests stored in `tests/` and Playwright for e2e specs in `tests/e2e/`.
- Run linting and tests before committing when feasible; document skipped checks in the PR description if necessary.

## Documentation
- Mirror any new environment variables in `.env.example` and call out changes in the README.
- Avoid adding monitoring tooling unless the user explicitly requests it.
