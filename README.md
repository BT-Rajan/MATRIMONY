# கார்காத்தார் மங்கள சந்திப்பு (Karkathar Mangala Sandhippu) — Matrimony Registration

An intentionally small matrimony-registration app. No frameworks, no build
step, no signup/login for members — just a form, an email OTP to edit it
later, and a simple admin panel.

## Stack

- **Backend:** plain PHP 8.1+ (PDO/MySQL), no Composer dependencies
- **Frontend:** plain HTML/CSS/JS, no build step
- **Database:** MySQL / MariaDB
- **Email:** hand-written SMTP client (`api/lib/mailer.php`), falls back to
  PHP's `mail()` if `SMTP_HOST` isn't set

## How it works

- **Register:** anyone fills the public form at `public/index.html` — no
  account needed. On success they get a registration number and a
  confirmation email.
- **Edit:** `public/edit.html` — enter the registered email, get a 6-digit
  OTP by email, verify it, and you're in an edit session (30 minutes) to
  update your own profile and payment proof.
- **Admin:** `public/admin/index.html` — a single admin login
  (username/password). From there: search/filter profiles, edit any field,
  approve/reject (which emails the applicant), and see/download
  gender-based reports as CSV.

## Local setup

```bash
# 1. Database
mysql -u root -p < db/schema.sql
php db/seed_admin.php admin "a-strong-password"

# 2. Config
cp .env.example .env
# edit .env: DB credentials, and SMTP_* if you want real email sending
# (leave SMTP_HOST empty to just log emails during local dev)

# 3. Run
php -S localhost:8000 -t public   # serves the frontend
# api/ is fetched by the frontend via relative ../api/... paths, so it
# needs to be reachable from the same document root in production —
# see Deployment below.
```

## Deployment (Apache)

Point the vhost's document root at the project root (not `public/`), so
both `public/` and `api/` are reachable — the frontend calls `../api/...`
relative URLs. `mod_rewrite` is not required; every endpoint is a plain
`.php` file. Make sure:

- `.env` is outside the web root, or at least not served (it isn't matched
  by any PHP handler, but double-check your server config)
- `api/uploads/.htaccess` and `api/lib/.htaccess` are respected (i.e.
  `AllowOverride All` for this vhost, or fold their rules into the vhost
  config directly)
- `api/uploads/payment_proofs/` is writable by the web server user
- PHP has the `pdo_mysql` extension enabled

## Database

See `db/schema.sql` — four tables: `profiles`, `otp_codes`,
`edit_sessions`, `admins`. No masters/lookup tables — star, rasi,
education, and occupation are fixed lists shipped in
`public/assets/data.js` (they don't change often enough to need an admin
CRUD screen; edit that file directly if the list ever needs to change).

## Adding another admin

```bash
php db/seed_admin.php <username> <password>
```

Running it again with an existing username resets that admin's password.
