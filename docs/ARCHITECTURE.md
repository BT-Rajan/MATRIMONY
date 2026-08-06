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

## Masters engine (Pass 2)

15 lookup types (Religion, Caste, Sub Caste, District, Taluk, Village,
Education, Occupation, Income, Star, Rasi, Dosham, Relationship, Event,
Payment Type) share one generic engine instead of 15 hand-written CRUD
modules:

- `config/MasterRegistry.php` is the **only** place table/column names
  for this engine come from. `MasterModel`'s dynamic SQL always looks
  the table name up here by `slug` — it never accepts a table name from
  the request — so building queries with string-interpolated identifiers
  stays injection-safe (values are still always bound as parameters).
- Two shapes: `simple` (`id, name_tamil, name_english, sort_order,
  is_active`) and `hierarchical` (adds a `parent_id`-style FK — Caste→
  Religion, Sub Caste→Caste, Taluk→District, Village→Taluk). `events` is
  a one-off third shape (`event_date`, `venue`) handled by light special-
  casing in `MasterService`.
- Hierarchical parents use `ON DELETE RESTRICT` — deleting a parent that
  still has children fails at the DB level; `MasterService::delete()`
  catches that and returns a friendly Tamil 409 instead of a raw SQL
  error.
- One React page (`MasterListPage.jsx`) + one dialog
  (`MasterFormDialog.jsx`) render all 15 types by reading
  `frontend/src/config/masterConfig.js` (a frontend mirror of the PHP
  registry) — search, pagination, parent-filtering, and the add/edit
  form all adapt to the config rather than being copy-pasted per type.
- Every create/update/delete writes to `audit_log` via the `Audit`
  helper (actor, before/after JSON, IP, user agent).

Later passes (registration wizard, admin member CRUD) consume these
tables read-only via `masterService.options(slug, parentId)` to
populate dropdowns — per the master prompt's rule, **no dropdown values
are ever hardcoded** in the frontend.

## Registration wizard (Pass 3)

- One `FileUpload.php` helper backs every file field across all 5
  steps. It never trusts a client-supplied extension or `Content-Type`
  — `finfo_file()` checks the file's actual bytes against an allow-
  list per field (e.g. photo: jpg/jpeg/png only), and a fixed
  denylist (`.php`, `.exe`, `.svg`, `.zip`, ...) is rejected outright
  regardless of what the real content turns out to be. Every accepted
  file is renamed to a random UUID on disk; the original filename is
  kept only in the DB row.
- Step 1 is the only public endpoint — it creates the member row
  (`status='draft'`) and returns a JWT, i.e. registering *is*
  logging in. There's no separate "resume" endpoint: a member who
  drops off simply logs back in with the member login screen (Pass 1)
  and `GET /registration/me` rehydrates the wizard from
  `registration_step` and the saved sub-tables.
- `members.registration_step` only ever moves forward
  (`GREATEST(registration_step, :step)` in `MemberModel::advanceStep`)
  — revisiting an earlier step to correct something never regresses
  how far the member has actually gotten.
- Steps 2, 3, and 5 accept file uploads, so they're POST endpoints
  with `multipart/form-data` bodies — PHP does not populate `$_FILES`
  for `PUT` requests. Step 4 has no file, so it's a plain JSON `PUT`.
- Horoscope/Family/Reference/Event-participation are each a single row
  per member (`member_id` as the primary key) written with
  `INSERT ... ON DUPLICATE KEY UPDATE`, so re-saving a step (editing
  after Next, or an eventual autosave) is idempotent rather than
  accumulating duplicate rows.



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

## Admin member workflow (Pass 4)

- Status transitions are enforced server-side, not just hidden in the
  UI: `approve` checks `registration_step >= 6`, `reject` requires a
  reason, `delete` is refused once `status = approved` (the member
  must be archived instead), and editing
  `member_event_participation` is refused once approved. Every
  transition writes `reviewed_by`/`reviewed_at` and an `audit_log`
  row with before/after values.
- `deactivate` records the member's status into `previous_status`
  *before* overwriting it, so `reactivate` restores exactly where
  they were (approved members go back to approved, not to some
  default). This must be done as two separate bound parameters in
  the `UPDATE` — `SET status = :new, previous_status = status` looks
  right but is wrong in MySQL, because multi-column `UPDATE`
  assignments see each other's *new* values, not the pre-update row;
  the previous status has to be read in PHP and passed in explicitly.
- `blocked` and `archived` both reject login (`AuthService::
  loginMember`) — archived wasn't explicitly called out as
  login-blocking in the source spec, but "removed from the platform"
  clearly implies it.
- Deleting a member cascades to every child table via `ON DELETE
  CASCADE` (photos, horoscope, family, reference, event
  participation) and `MemberAdminService::delete()` also removes the
  actual uploaded files from disk, so a hard delete doesn't leave
  orphaned files behind.

## Design direction

Palette and typography draw on Tamil temple/ritual visual language rather
than a generic SaaS look: kumkum maroon + turmeric gold on an ivory
background, Baloo Thambi 2 for Tamil display headings, Noto Sans Tamil for
body text. A repeating kolam (rangoli) motif is used sparingly as a
section divider — the one recurring signature element, not scattered
decoration.
