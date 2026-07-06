# Contributing Guide

## Branch Structure

We follow a structured branching model to keep our codebase stable and collaboration smooth.

```
main          ← production-ready code, always stable
dev           ← active development, always deployable
feature/*     ← individual feature or fix branches
```

---

## How It Works

### 1. Never push directly to `main` or `dev`

All changes must come in through a Pull Request (PR). Please respect this even though it is not enforced by branch protection yet. Please do!!

### 2. Always branch from `dev`

When starting new work, create your feature branch from `dev` — not `main`.

```bash
git checkout dev
git pull origin dev
git checkout -b feature/your-feature-name
```

### 3. Branch naming convention

Use a consistent prefix so branches are easy to identify:

```
feature/user-authentication
feature/fleet-dashboard
fix/login-redirect-bug
fix/invoice-null-error
chore/update-dependencies
chore/cleanup-unused-imports
```

### 4. Keep your branch up to date

Before opening a PR, sync your branch with the latest `dev` to avoid conflicts:

```bash
git checkout dev
git pull origin dev
git checkout feature/your-feature-name
git merge dev
```

### 5. Open a PR into `dev`

When your work is ready, open a Pull Request from your feature branch into `dev`.

- Write a clear PR title and description
- Keep PRs focused — one feature or fix per PR

### 6. `dev` → `main` releases

Once `dev` has been tested and is stable, a PR is opened from `dev` into `main`. This should be a collective team decision before merging.

---

## Hotfixes

If a critical bug needs to be fixed in production immediately:

1. Branch from `main` using the `fix/` prefix
2. Fix the bug
3. Open a PR into `main`
4. **Immediately** open another PR to merge `main` back into `dev` to keep them in sync

```
fix/critical-bug → main → dev
```

Never let `main` get ahead of `dev`.

---

## Quick Reference

| Branch | Purpose | Branches from | Merges into |
|--------|---------|--------------|-------------|
| `main` | Production | — | — |
| `dev` | Integration | `main` | `main` |
| `feature/*` | New work | `dev` | `dev` |
| `fix/*` | Bug fixes | `dev` (or `main` for hotfixes) | `dev` (or `main`) |
| `chore/*` | Maintenance | `dev` | `dev` |

---

## Project Structure

### Frontend Structure

This is a Next.js monorepo frontend. The application is divided into feature modules — each major feature lives in its own folder under `app/`:

```
frontend/
└── app/
    ├── (app)/              ← main app wrapper
    │   ├── admin/
    │   ├── billing/
    │   ├── finance/
    │   ├── fleet/
    │   ├── home/
    │   ├── hr/
    │   ├── orders/
    │   ├── procurement/
    │   └── safety/
    ├── (auth)/             ← authentication pages
    └── layout.tsx
```

Other top-level folders:

```
frontend/
├── components/     ← shared, reusable UI components
├── hooks/          ← shared custom hooks
├── lib/            ← utilities, helpers, configs
├── public/         ← static assets
├── store/          ← global state management
└── types/          ← shared TypeScript types
```

#### Adding a New Frontend Feature

When building a new feature, create a new folder for it under `app/(app)/`:

```
app/(app)/your-feature/
└── page.tsx
```

If the feature needs its own components, hooks, or types that are specific to it, keep them inside that folder:

```
app/(app)/your-feature/
├── page.tsx
├── components/
├── hooks/
└── types/
```

Only move things into the top-level `components/`, `hooks/`, or `types/` folders if they are **shared across multiple features**. If it belongs to one feature, keep it with that feature.

---

### Backend Structure

The backend is a Python application. Each concern has its own folder:

```
backend/
├── app/
│   ├── middleware/     ← request/response middleware
│   ├── models/         ← database models
│   ├── routers/        ← API route handlers
│   ├── schemas/        ← request/response schemas (Pydantic)
│   ├── services/       ← business logic
│   └── utils/          ← helper functions and utilities
├── alembic/            ← database migrations
├── __init__.py
├── alembic.ini
├── config.py           ← app configuration
├── database.py         ← database connection setup
├── main.py             ← app entry point
├── requirements.txt    ← Python dependencies
├── run.py              ← server runner
└── .env.example        ← environment variable template
```

#### Adding a New Backend Feature

When adding a new feature to the backend, follow the existing separation of concerns:

- **Model** → `app/models/` — define your database table
- **Schema** → `app/schemas/` — define your request and response shapes
- **Service** → `app/services/` — write your business logic here
- **Router** → `app/routers/` — define your API endpoints and wire them to your service
- **Migration** → `alembic/` — generate a migration for any database changes

Keep business logic in `services/` and out of `routers/`. Routers should only handle request parsing and response formatting.

---

## Commit Message Convention

Use clear, descriptive commit messages with a prefix that reflects the type of change:

```
feat: add fleet dashboard page
fix: resolve null error on invoice submission
chore: update eslint configuration
refactor: simplify procurement form logic
style: fix button alignment on mobile
```

---

## Summary

- Branch from `dev` → do your work → PR into `dev` → PR into `main`
- Use clear branch names with the right prefix
- Never push directly to `dev` or `main`
- Keep your branch synced with `dev` before opening a PR
- One PR per feature or fix — keep it focused
- New frontend features go into `app/(app)/your-feature/` — one folder per feature
- New backend features follow the model → schema → service → router pattern
- Only put things in shared folders if they are used by more than one feature

If you have any questions about the workflow, discuss with the team before proceeding.

---

> **Note:** Branch protection rules and PR approval requirements are not currently enforced on this repository. These guidelines are expected to be followed by all contributors as a team agreement. Enforcement via GitHub rulesets and required reviewers will be introduced in the future.