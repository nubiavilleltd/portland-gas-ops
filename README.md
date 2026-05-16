# Portland Gas Operations Platform

## What this is

A domain-specific internal ERP platform for Portland Gas Limited. Covers procurement,
gas dispatch, billing, fleet, assets, safety, HR, finance, and reporting across
CNG/LNG operations in Nigeria.

## Monorepo structure

```
portland-gas-ops/
  frontend/    Next.js 14 + TypeScript + Tailwind CSS
  backend/     FastAPI + Python + MySQL
```

---

## Team setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env — fill in DATABASE_URL and SECRET_KEY
alembic upgrade head               # after first migration is generated
python run.py
```

API runs at **http://localhost:8000**
Interactive docs at **http://localhost:8000/api/docs** (development only)

#### Generating the first migration (run once after .env is set up)

```bash
alembic revision --autogenerate -m "initial schema"
alembic upgrade head
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

App runs at **http://localhost:3000**

---

## Branch strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production. Never commit directly. PR from `dev` only after full testing. |
| `dev`  | Active development integration. All features merge here. |

Feature branches are always created **from `dev`**:

```
feature/auth-login-page
feature/procurement-list
fix/sidebar-active-state
chore/update-dependencies
```

### Git workflow every developer must follow

```bash
git checkout dev && git pull origin dev
git checkout -b feature/your-feature
# build
git pull origin dev                          # sync before PR
# resolve any conflicts in your branch — never in dev
git push origin feature/your-feature
# open PR on GitHub targeting dev
# minimum one approval before merge
```

---
## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full contribution guide covering:

- Branch naming and workflow
- How to open a Pull Request
- Frontend and backend project structure
- How to add a new feature
- Commit message conventions

---

## Deployment

| Layer    | Platform | Notes |
|----------|----------|-------|
| Frontend | Vercel   | Root dir = `frontend/`. Set `NEXT_PUBLIC_API_URL` to your backend URL. |
| Backend  | Digital Ocean App Platform or Droplet | Root dir = `backend/`. Set all `.env` vars in DO dashboard. Start: `uvicorn app.main:app --host 0.0.0.0 --port 8000` |

---

## Standards (non-negotiable for all developers)

- All forms: **React Hook Form + Zod**. No exceptions.
- All API calls: through **`lib/api.ts`** only. No direct `fetch` or `axios` outside it.
- All icons: **Lucide React** only.
- All auth state: **Zustand `authStore`** only.
- **No `any` types** in TypeScript. Ever.
- No new npm packages without team discussion.
- All **Tailwind** — no inline styles, no CSS modules unless approved.
- Data fetching in client components: **TanStack Query (`@tanstack/react-query`)**.
