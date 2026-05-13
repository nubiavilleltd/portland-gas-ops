# Portland Gas Operations — Backend

FastAPI application serving the internal ERP platform for Portland Gas Limited.

## Stack

- **FastAPI** — web framework
- **SQLAlchemy** — ORM
- **Alembic** — database migrations
- **MySQL** (via PyMySQL) — primary database
- **Pydantic v2** — data validation
- **python-jose** — JWT tokens
- **passlib[bcrypt]** — password hashing

## Python version

**This project requires Python 3.12.** Do not use 3.11 or 3.13 — library versions in `requirements.txt` are tested against 3.12 only.

Check yours before starting:
```bash
python3 --version   # must say Python 3.12.x
```

If you have a different version, install 3.12 via [pyenv](https://github.com/pyenv/pyenv):
```bash
pyenv install 3.12
pyenv local 3.12    # writes .python-version — pyenv will auto-switch in this folder
```

## Quick start

```bash
python3.12 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your credentials
python run.py
```

## Generating and running migrations

```bash
# First time — generate initial schema from models
alembic revision --autogenerate -m "initial schema"

# Apply migrations
alembic upgrade head

# Rollback one step
alembic downgrade -1
```

## Project structure

```
app/
  main.py          FastAPI app, CORS, router registration
  config.py        Pydantic settings from .env
  database.py      SQLAlchemy engine + session + Base
  models/          SQLAlchemy ORM models
  schemas/         Pydantic request/response schemas
  routers/         API route handlers
  services/        Business logic (auth, approval engine, etc.)
  middleware/      Auth dependency (get_current_user, require_roles)
  utils/           Security helpers (JWT, password hashing)
```

## Environment variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | MySQL connection string |
| `SECRET_KEY` | JWT signing key — keep secret |
| `ALGORITHM` | JWT algorithm (default HS256) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token TTL |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token TTL |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins |
| `ENVIRONMENT` | `development` or `production` |
