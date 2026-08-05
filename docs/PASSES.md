# Development passes

Each pass is built completely, tested, and committed before the next
begins, per the master prompt's workflow. Status is updated here at the
end of every pass.

| Pass | Scope | Status |
|---|---|---|
| 1 | Project setup, auth (admin + member JWT login), DB connection, routing, theme, common components, API service layer | ✅ Done |
| 2 | Masters module (Religion, Caste, Sub Caste, District, Taluk, Village, Education, Occupation, Income, Star, Rasi, Dosham, Relationship, Event, Payment Type) — CRUD, search, pagination | ✅ Done |
| 3 | Self-registration wizard (5 steps, autosave, resume) | ⏳ Not started |
| 4 | Admin CRUD — members, approval, verification, deactivate, archive | ⏳ Not started |
| 5 | Search — simple, advanced, saved searches, export | ⏳ Not started |
| 6 | Booklet generator (PDF, cover, QR code, print-ready) | ⏳ Not started |
| 7 | Dashboard — statistics, charts, reports | ⏳ Not started |
| 8 | Notifications — SMS, WhatsApp, Email | ⏳ Not started |
| 9 | Optimization — caching, indexes, security hardening, testing, deployment | ⏳ Not started |

## Pass 1 summary

**Delivered:**
- GitHub repo created: `BT-Rajan/MATRIMONY` (private)
- Frontend: React 19 + Vite + MUI, Tamil UI throughout, custom
  maroon/gold theme, Noto Sans Tamil + Baloo Thambi 2 fonts
- Admin + Member login (tabbed single screen), React Hook Form + Yup
  validation, role-aware protected routing, Axios instance with
  auth/error interceptors, Toast + Loader + ErrorBoundary
- Backend: PHP 8.3 front-controller router, PDO database layer,
  dependency-free HS256 JWT, server-side Validator, Audit logger,
  CORS + JWT middleware, login rate limiting
- Database: `admins`, `members` (core columns), `audit_log`,
  `login_attempts`, `registration_number_sequence`
- **Tested end-to-end** against a live MariaDB instance: successful
  login issues a valid JWT, wrong password is rejected, missing
  fields return field-level Tamil validation errors, unknown routes
  return 404, PHP syntax-checked across every file

**Known follow-ups for later passes:**
- Member registration (self-signup) arrives in Pass 3 — Pass 1 only
  wires the login side; there's a placeholder "coming soon" screen
  at `/register`.
- No password-reset flow yet.
- `login_attempts` grows unbounded — Pass 9 (optimization) should add
  a cleanup job or TTL.

## Pass 2 summary

**Delivered:**
- Generic, config-driven master-data engine (backend `MasterRegistry` +
  `MasterModel` + `MasterService` + `MasterController`, frontend
  `masterConfig.js` + `MasterListPage` + `MasterFormDialog`) covering
  all 15 master types instead of 15 hand-written CRUD modules
- Two data shapes: `simple` (10 types) and `hierarchical` with parent/
  child FKs (Caste→Religion, Sub Caste→Caste, Taluk→District,
  Village→Taluk), plus a one-off `event` shape (date/venue)
- Full CRUD + search + pagination + parent-filtering on every type,
  server-side uniqueness validation, FK-RESTRICT-aware delete (blocks
  deleting a parent still in use, with a friendly Tamil error)
- Seed data: 27 Nakshatrams, 12 Rasis, 38 Tamil Nadu districts, common
  Doshams/Relationships/Payment Types/Education/Occupation/Income
  bands, and a starter Religion→Caste→Sub Caste hierarchy
- Admin nav now has a "மாஸ்டர் தரவு" section with a grouped landing
  page linking to all 15 types

**Tested end-to-end** against live MariaDB: registry listing, search,
pagination, hierarchical parent-filtering, create, duplicate-name
rejection (422), missing-parent rejection (422), update, delete of an
unreferenced row (200), delete of a row with children (409, blocked by
FK RESTRICT), unauthenticated access (401) — all verified via real
HTTP requests, and every audit_log entry confirmed written.

**Known follow-ups for later passes:**
- Taluks/Villages are seeded empty (only the schema + starter Caste/
  Sub Caste hierarchy is seeded) — admin builds these out for their
  actual operating area via the CRUD screens.
- No bulk import/export for master data yet (could be added in
  Pass 5's Export work or Pass 9 optimization).
