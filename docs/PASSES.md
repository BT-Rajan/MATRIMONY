# Development passes

Each pass is built completely, tested, and committed before the next
begins, per the master prompt's workflow. Status is updated here at the
end of every pass.

| Pass | Scope | Status |
|---|---|---|
| 1 | Project setup, auth (admin + member JWT login), DB connection, routing, theme, common components, API service layer | ✅ Done |
| 2 | Masters module (Religion, Caste, Sub Caste, District, Taluk, Village, Education, Occupation, Income, Star, Rasi, Dosham, Relationship, Event, Payment Type) — CRUD, search, pagination | ✅ Done |
| 3 | Self-registration wizard (5 steps, autosave, resume) | ✅ Done |
| 4 | Admin CRUD — members, approval, verification, deactivate, archive | ✅ Done |
| 5 | Search — simple, advanced, saved searches, export | ✅ Done |
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

## Pass 3 summary

**Delivered:**
- `members` table extended with the full Step 1 bio-data profile (dob,
  height/weight, marital status, education/occupation/income,
  religion/caste/sub-caste, star/rasi/dosham, address, photo/ID-proof
  paths, about-me, lifestyle fields) plus one child table per remaining
  step: `member_photos` (up to 10 extra), `member_horoscopes`,
  `member_family`, `member_references`, `member_event_participation`
- `FileUpload.php` — a shared, security-conscious upload handler used by
  every step: real MIME-sniffing against the file's actual bytes (never
  trusts the client-declared extension or Content-Type), a dangerous-
  extension blocklist, size limits per file type, UUID renaming on disk
- `RegistrationService.php` — full server-side validation matching every
  rule in the spec (age 18-60, height/weight ranges, sibling-count
  cross-checks, reference-phone-≠-applicant-phone, duplicate-transaction
  rejection, DOB-must-match-across-steps, etc.)
- **Resume mechanism**: Step 1 creates the account and auto-logs the
  member in (JWT); resuming later is just the existing member login —
  `GET /registration/me` returns the full draft for the wizard to
  rehydrate, and `registration_step` tracks furthest-reached step
  (never moves backwards, so revisiting an earlier step to edit doesn't
  lose progress)
- Frontend: one wizard container (`RegistrationWizard.jsx`) with an MUI
  Stepper, five step form components, cascading master-data dropdowns
  (Religion→Caste→Sub-Caste; District for now, Taluk/Village wiring is
  ready via the same `useMasterOptions` hook once seeded), a reusable
  `FileDropInput` with image preview, and full Yup validation mirroring
  the backend
- Login and the member dashboard both redirect an incomplete member
  (`registration_step < 6`) straight back into the wizard at their
  saved step

**Tested end-to-end** against a live MariaDB instance with real image/
PDF file uploads (not mocked): full happy-path through all 5 steps;
negative paths for duplicate mobile/email, underage DOB, missing
required files, password mismatch, mismatched DOB between steps 1 and
2, married-siblings-exceeds-total, reference-phone-equals-applicant-
phone, duplicate payment transaction number — and critically, **a file
with a `.jpg` name but plain-text content was correctly rejected** by
the MIME-sniffing check rather than trusting the extension. Scripts are
kept in `backend/tests/` for re-running.

**Known follow-ups for later passes:**
- No autosave-on-keystroke yet — each step saves on "Next"/"Back" and
  on final submit. True field-level autosave (debounced PATCH per
  field) would need a separate lighter-weight endpoint per step; noted
  for Pass 9 if the client wants it.
- Taluk/Village dropdowns aren't wired into Step 1 yet (only District
  is) since those tables are seeded empty — trivial to add once an
  admin populates them via the Masters screens.
- `member_event_participation` payment fields aren't verified against
  any payment gateway — this pass only records what the member reports
  (transaction number + receipt upload), matching the spec.

## Pass 4 summary

**Delivered:**
- Admin review trail on `members`: `reviewed_by`, `reviewed_at`,
  `rejection_reason`, `previous_status`
- `MemberAdminService.php` + `AdminMemberController.php`: paginated
  list with search/status/gender/verified/religion/district filters,
  full-profile view, **approve** (blocked unless
  `registration_step >= 6`, matching "cannot approve incomplete
  profile"), **reject** (requires a reason), **verify/unverify**,
  **deactivate → blocked** (login rejected while blocked),
  **reactivate** (restores the exact prior status), **archive**
  (also now blocks login — a reasonable extension of "removed from
  the platform" beyond what the spec spelled out), **delete** (blocked
  once `status = approved`, matching "cannot delete approved
  profile" — cascades to all child tables and removes the uploaded
  files from disk), a scoped **edit** of core contact/address fields,
  and a guarded edit of event-participation/payment data (blocked
  once approved, matching "cannot edit approved payment")
- Every action writes to `audit_log` with before/after values
- Frontend: `MembersListPage` (search, status/gender filters,
  pagination, status chips, verified badge) and `MemberDetailPage`
  (full profile across all 5 registration steps, every workflow
  action as a button with confirmation dialogs, inline edit dialog)
- Admin dashboard now shows live counts (total/pending/approved/
  verified) instead of placeholder dashes
- New "உறுப்பினர்கள்" admin nav section

**Two real bugs found and fixed while testing (not in this pass's
new code, but only surfaced by it):**
1. Member login by mobile/email was silently broken since Pass 1 — a
   duplicate named SQL placeholder (`:identifier` reused for both the
   email and mobile side of an OR clause) that MySQL's native prepared
   statements reject. It only surfaced now because this pass was the
   first to test member login end-to-end (Pass 1's tests only covered
   admin login). Fixed, and the whole codebase was scanned
   programmatically for the same class of bug — none found elsewhere.
2. A classic MySQL multi-column `UPDATE` gotcha: `SET status =
   :status, previous_status = status` reads the column's
   *already-updated* value within the same statement, not the value
   before the update — so reactivating a deactivated member silently
   restored the wrong status. Fixed by passing the previous status in
   explicitly as a bound parameter.

**Tested end-to-end** — twice: once against the running dev database,
and again from a **completely fresh database built by running all six
migrations in sequence** (001 through 006, the exact order a real
deployment would use), followed by the full registration flow (Pass 3)
and the full admin workflow (Pass 4) on that freshly-built schema.
17 admin scenarios plus the Pass 3 suite all pass: approve, reject
(with/without reason), re-approve-already-approved (409), delete-
approved-blocked (409), verify, core-field edit, invalid-email edit
(422), payment-edit-on-approved-blocked (409), deactivate, blocked-
login-rejected (403), reactivate, reactivated-login-succeeds (200),
archive, archived-login-rejected, filtered listing, and unauthenticated
access (401).

**Known follow-ups for later passes:**
- Admin edit is intentionally scoped to contact/address fields, not
  the full bio-data (photo/ID-proof/horoscope-document re-upload,
  religion/caste/education/etc.) — a fuller "admin edits everything"
  screen can be added later if needed; noted rather than built to keep
  this pass's scope matching what the spec asked for ("Members,
  Approval, Verification, Deactivate, Archive").
- No bulk actions (e.g. approve multiple members at once) yet.
- "Archive" doesn't currently expose an "unarchive" action in the UI,
  though the backend's `previous_status` tracking would support adding
  one cheaply later.

## Pass 5 summary

**Delivered:**
- One filter-building engine (`MemberModel::buildFilterClauses`)
  shared by three surfaces: the member list (Pass 4), advanced search,
  and CSV export — no duplicated query logic
- **Simple search**: the existing single search box (registration
  number / name / mobile / email)
- **Advanced search**: every field the spec listed — registration
  number, age/height/weight ranges, education, occupation, income,
  religion, caste, district, state, country, star, rasi, dosham,
  event participation, reference (name or phone), phone, email,
  verified, payment made, photo available, horoscope available — as
  a dedicated dialog with cascading Religion→Caste, applied on top of
  the simple search/status/gender filters
- **Saved searches**: name + serialize the active filter set as JSON,
  list/apply/delete, scoped per admin
- **Export**: streams a CSV of the current filtered result set (capped
  at 5,000 rows), with a UTF-8 BOM so Tamil names render correctly
  when opened in Excel

**Tested end-to-end** against a live database with two distinctly
different member profiles (different gender/age/district/religion/
payment status) to make each filter meaningfully discriminating —
confirmed each advanced filter returns the right member and excludes
the wrong one (not just "the query ran without error"), including the
subtler ones: `payment` correctly separates a member with a recorded
event payment from one who opted out, and `reference` correctly
matches on the *reference's* name, not the member's own.

**Two more real bugs found and fixed while testing (pre-existing, not
introduced by this pass):**
1. `MemberModel::findByEmailOrMobile` reused one named placeholder
   (`:identifier`) for two different values in an `OR` clause — same
   bug class as Pass 4's fix, in a different query. Found via the same
   codebase-wide scan script, which is now worth re-running after any
   pass that touches raw SQL.
2. Several optional registration fields (`whatsapp`, `weight_kg`,
   `income_id`, `sub_caste_id`, `about_myself`, `gothram`,
   `father_occupation`, `family_income_id`, reference `address`/
   `known_since`/`remarks`) crashed with a 500 if the field was
   omitted from the request entirely (as opposed to sent as an empty
   string) — `$input['x'] !== ''` doesn't handle a missing array key.
   The real React frontend always sends every field via `FormData`, so
   this wasn't reachable through the UI, but it's a latent bug for any
   future API client that omits optional fields. Fixed with `??`
   defaults on every optional-field access in `RegistrationService`.

**Verified twice** — against the dev database, and again from a
**completely fresh database built by running all seven migrations in
sequence (001-007)**, followed by the full Pass 3 registration flow,
the full Pass 4 admin workflow, and the full Pass 5 search suite on
that clean schema. Every test passes both times.

**Known follow-ups for later passes:**
- Export is CSV only (opens fine in Excel/Sheets) — no native
  `.xlsx` export, since that would require a Composer dependency this
  project deliberately avoids; worth revisiting in Pass 9 if a real
  `.xlsx` is required.
- Export is capped at 5,000 rows as a safety limit; large exports
  would need streaming/background-job handling instead.
- Advanced search filters are admin-facing only — a member-facing
  "browse potential matches" search (with privacy-appropriate limits
  on which fields are shown) isn't part of this pass; flagging in case
  that's actually what's wanted, since the master prompt's search
  field list (phone, email, payment status) reads as admin-tool
  oriented rather than member-browsing oriented.
