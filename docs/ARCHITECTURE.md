# Architecture

## Guiding rules (apply to every pass)

- **PDO only, prepared statements only.** No string-concatenated SQL anywhere.
- **Repository-style models** — one class per table, static query methods,
  no business logic. Business logic lives in `services/`.
- **Controllers are thin** — parse request, call a service, call `Response::`.
  No SQL, no business rules in a controller.
- **Every mutating action is audited** via `Audit::log(...)` into `audit_log`
  (actor, action, entity, old/new values as JSON, IP, user agent, timestamp).
- **Server-side validation always duplicates client-side validation.**
  React Hook Form + Yup on the frontend is a UX convenience; the PHP
  `Validator` helper is the actual source of truth.
- **Standard JSON envelope** for every response:
  ```json
  { "status": "success", "data": {...}, "message": "..." }
  { "status": "error", "message": "...", "errors": { "field": "..." } }
  ```
- **No hardcoded dropdown values.** Religion / Caste / District / Education /
  etc. all come from master tables (Pass 2) — the frontend fetches option
  lists from the API, never ships them as constants.
- **File uploads**: validated by extension + MIME + size, renamed to a UUID
  on disk, original filename retained in the DB row, executable extensions
  (`.php`, `.js`, `.exe`, ...) rejected outright regardless of stated
  content-type.

## Auth

- JWT is generated with a hand-written HS256 implementation
  (`backend/api/helpers/Jwt.php`) — no Composer dependency, so the API
  runs on any stock PHP 8.3 host with just `pdo_mysql` enabled.
- Tokens carry `sub` (user id), `role` (`admin` | `member`), `iat`, `exp`.
- The frontend stores the token in `localStorage` and attaches it as
  `Authorization: Bearer <token>` via an Axios request interceptor.
- A 401 response anywhere triggers an automatic redirect to `/login` and
  clears the stored session (Axios response interceptor).
- Login attempts are rate-limited per identifier (6 failed attempts / 15
  minutes) via `login_attempts` — see `middleware/RateLimiter.php`.

## Database migration convention

Files in `backend/api/sql/` are numbered and never edited after being
run against a real database:

```
001_pass1_core.sql          admins, members (core), audit_log, login_attempts
002_pass1_seed_admin.sql    default super-admin
003_pass2_masters.sql       (Pass 2) religion, caste, district, ... master tables
...
```

Each pass adds new numbered files; existing tables are extended with
`ALTER TABLE`, never dropped or destructively rewritten.

## Frontend structure

```
src/
  components/common/   Loader, Toast (context), ErrorBoundary, KolamDivider
  layouts/              AuthLayout (login/register shell), MainLayout (app shell)
  pages/                one folder per feature area
  routes/               AppRoutes.jsx, ProtectedRoute.jsx (role-aware)
  contexts/             AuthContext, ToastContext
  services/             one file per API resource (authService.js, ...)
  validators/           one Yup schema file per form area
  theme/                MUI theme (palette, typography)
```

## Design direction

Palette and typography draw on Tamil temple/ritual visual language rather
than a generic SaaS look: kumkum maroon + turmeric gold on an ivory
background, Baloo Thambi 2 for Tamil display headings, Noto Sans Tamil for
body text. A repeating kolam (rangoli) motif is used sparingly as a
section divider — the one recurring signature element, not scattered
decoration.
