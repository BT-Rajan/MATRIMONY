# கார்காத்தார் மங்கள சந்திப்பு — குரோம்பேட்டை
### Tamil Matrimony Management System

A production-grade matrimony management platform, built in staged passes.
Fully Tamil UI, React 19 + MUI frontend, PHP 8.3 + PDO/MySQL backend,
JWT authentication, and full audit logging.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite, Material UI, React Router, React Hook Form, Yup, Axios |
| Backend | PHP 8.3, PDO (no ORM), custom REST router, hand-written HS256 JWT (zero Composer deps) |
| Database | MySQL 8 / MariaDB, `utf8mb4` throughout |
| Server | Apache + `mod_rewrite` |

No Composer/npm-registry-blocked dependencies are used on the backend —
the API runs on stock PHP + `pdo_mysql`, so it deploys on ordinary shared
hosting without a build step.

## Repository layout

```
frontend/          React app (Vite)
backend/
  api/
    config/        env loader, PDO connection
    controllers/    HTTP-facing request handlers
    services/       business logic
    models/         one class per table, prepared statements only
    middleware/     CORS, JWT auth, rate limiting
    helpers/        Response, Validator, Jwt, Audit, Logger
    sql/            numbered, additive migrations (NNN_passX_description.sql)
    uploads/        photos / horoscopes / family photos / ID proofs / receipts
    logs/           error.log, info.log
  .env.example
docs/               architecture notes, per-pass sign-off, DB setup guide
```

## Local setup

See [`docs/SETUP.md`](docs/SETUP.md) for full step-by-step instructions
(DB creation, seed admin, running frontend + backend locally).

## Development process

This project is built in **numbered passes**, each one complete and
tested before the next begins — see [`docs/PASSES.md`](docs/PASSES.md)
for the full roadmap and current status.

## Default admin login (development only)

```
username: superadmin
password: ChangeMe@123
```

**Change this immediately in any real deployment** — see `docs/SETUP.md`.
