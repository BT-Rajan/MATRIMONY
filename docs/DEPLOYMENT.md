# Deployment

A step-by-step checklist for putting this on real Apache/PHP/MySQL
hosting (shared hosting or a VPS — no Composer, no shell access to
background daemons required, matching the project's zero-Composer-
dependency design).

## 1. Database

1. Create the MySQL/MariaDB database and a dedicated app user (never
   use `root` in production):
   ```sql
   CREATE DATABASE karkathar_matrimony CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'karkathar_app'@'localhost' IDENTIFIED BY '<a long random password>';
   GRANT ALL PRIVILEGES ON karkathar_matrimony.* TO 'karkathar_app'@'localhost';
   FLUSH PRIVILEGES;
   ```
2. Run every migration in `backend/api/sql/`, **in numeric order**,
   001 through the highest-numbered file present:
   ```bash
   for f in backend/api/sql/*.sql; do
     mysql -u karkathar_app -p --default-character-set=utf8mb4 karkathar_matrimony < "$f"
   done
   ```
   (`001_pass1_core.sql` creates the database itself via `CREATE
   DATABASE IF NOT EXISTS`, so the first run can target any existing
   connection.) Always include `--default-character-set=utf8mb4` — its
   absence is the single most common way to end up with corrupted
   Tamil text; see the note in `SETUP.md`.
3. Run `002_pass1_seed_admin.sql`, then **immediately change the
   default admin password** (see `SETUP.md` "First login").

## 2. Backend

1. Upload `backend/` to the server. Point the Apache vhost's document
   root at `backend/api` (its `.htaccess` handles routing).
2. Copy `backend/.env.example` to `backend/.env` and fill in real
   values:
   - `DB_*` — the app DB user created above
   - `JWT_SECRET` — a long, random value, never reused from
     development (`php -r "echo bin2hex(random_bytes(32));"`)
   - `CORS_ALLOWED_ORIGIN` — the exact frontend origin (scheme +
     host, no trailing slash)
   - `MAIL_*` / `SMS_*` / `WHATSAPP_*` — see "Notifications" in
     `SETUP.md`; leave disabled if not needed yet, the app works fine
     without them
3. `backend/.env` must **not** be web-accessible. It sits outside
   `backend/api` (the document root), so a default Apache config
   already can't serve it directly — confirm this on your actual host.
4. Make the upload directories writable by the web server user:
   ```bash
   chown -R www-data:www-data backend/api/uploads backend/api/logs
   chmod -R 755 backend/api/uploads backend/api/logs
   ```
5. Confirm required PHP extensions are enabled: `pdo_mysql`,
   `mbstring`, `curl`, `fileinfo` (used by the upload MIME-sniffing
   check). All are standard on shared hosting, but verify with
   `php -m` if you have shell access, or a `phpinfo()` script if not.

## 3. Frontend

1. `cd frontend && cp .env.example .env`, set `VITE_API_BASE_URL` to
   the real backend URL (e.g. `https://yourdomain.com/api`).
2. `npm install && npm run build`.
3. Upload the contents of `frontend/dist/` to the frontend's document
   root. The build includes `.htaccess` (security headers + SPA
   routing) — confirm `mod_headers` and `mod_rewrite` are enabled on
   the server, or those headers/routes silently won't apply.

## 4. HTTPS

Both frontend and backend must be served over HTTPS in production —
JWTs and passwords must never travel in plaintext. Most hosts provide
free Let's Encrypt certificates; enable HTTPS and redirect all HTTP
traffic to HTTPS at the web-server level before going live.

## 5. Cron jobs

One recommended daily job — pruning operational logs that would
otherwise grow unboundedly (never touches member data, registrations,
or the audit trail):

```cron
0 3 * * * php /path/to/backend/api/cli/cleanup.php >> /path/to/backend/api/logs/cleanup.log 2>&1
```

This removes `login_attempts` rows older than 30 days and
`notifications` rows older than 180 days (both figures are constants
at the top of `cleanup.php` — adjust if you want a different
retention window).

## 6. Post-deploy checklist

- [ ] Log in as the default admin, change the password immediately
- [ ] Confirm HTTPS is enforced (visiting `http://` redirects to `https://`)
- [ ] Submit a full test registration through the real public site
      (all 5 steps, real file uploads) and confirm it appears in the
      admin member list
- [ ] Approve/reject that test registration and confirm any configured
      notification channel actually delivers
- [ ] Check the browser console on every major screen for errors —
      the master prompt's acceptance criteria requires none
- [ ] Delete or archive the test registration once confirmed working
- [ ] Rotate/revoke any development GitHub PAT once handoff is
      complete
- [ ] Set up the cron job above
- [ ] Confirm `backend/.env` is not reachable by URL
      (`https://yourdomain.com/.env` and similar should 404)

## Known scaling limits (see docs/PASSES.md for full context)

These are documented, deliberate scope boundaries, not oversights:
- CSV export and booklet generation are capped at 5,000 and 200 rows
  respectively — very large associations would need batched
  generation instead.
- Simple search uses `LIKE '%...%'` across a few columns, which can't
  use a standard index for leading-wildcard matches. Fine at the scale
  of a single association's membership (hundreds to low thousands);
  a `FULLTEXT` index would be the next step if that scale is exceeded,
  at the cost of changing search semantics from substring to
  word-boundary matching.
