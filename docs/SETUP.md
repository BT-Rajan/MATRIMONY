# Local setup

## Prerequisites

- Node.js 20+
- PHP 8.3+ with `pdo_mysql` enabled
- MySQL 8 or MariaDB 10.6+
- Apache (for production-like deployment) — PHP's built-in server is fine for local dev

## 1. Database

```bash
mysql -u root -p < backend/api/sql/001_pass1_core.sql
mysql -u root -p karkathar_matrimony < backend/api/sql/002_pass1_seed_admin.sql
mysql -u root -p karkathar_matrimony < backend/api/sql/003_pass2_masters.sql
mysql -u root -p karkathar_matrimony < backend/api/sql/004_pass2_seed_masters.sql
mysql -u root -p karkathar_matrimony < backend/api/sql/005_pass3_registration.sql
mysql -u root -p karkathar_matrimony < backend/api/sql/006_pass4_admin_review.sql
mysql -u root -p karkathar_matrimony < backend/api/sql/007_pass5_search.sql
```

Migrations are numbered and additive (`001_...`, `002_...`, ...) — always run
them in order. Never edit a migration that has already been run against a
real database; add a new numbered file instead.

> If you see a `Data too long for column` error while loading a seed file
> that contains Tamil text, your `mysql` CLI is reading the file as Latin-1
> instead of UTF-8 — add `--default-character-set=utf8mb4` to the command.

Create a dedicated app DB user rather than using `root`:

```sql
CREATE USER 'karkathar_app'@'localhost' IDENTIFIED BY 'choose-a-strong-password';
GRANT ALL PRIVILEGES ON karkathar_matrimony.* TO 'karkathar_app'@'localhost';
FLUSH PRIVILEGES;
```

## 2. Backend

```bash
cd backend
cp .env.example .env
# edit .env: DB_USER, DB_PASS, JWT_SECRET (use a long random value), CORS_ALLOWED_ORIGIN
```

Run it locally with PHP's built-in server:

```bash
cd api
php -S 127.0.0.1:8080 -t . index.php
```

In production, point an Apache vhost's document root at `backend/api`
(the `.htaccess` there handles routing) and make sure `backend/.env`
is **outside** the public web root or blocked by web-server config.

## 3. Frontend

```bash
cd frontend
cp .env.example .env
# edit .env: VITE_API_BASE_URL should point at your backend/api URL
npm install
npm run dev
```

## 4. First login

```
username: superadmin
password: ChangeMe@123
```

Change this password as soon as an admin-password-change endpoint exists
(Pass 2/4) — until then, update it directly:

```bash
php -r "echo password_hash('YourNewStrongPassword', PASSWORD_DEFAULT), PHP_EOL;"
```

```sql
UPDATE admins SET password_hash = '<paste hash here>' WHERE username = 'superadmin';
```

## Notifications (Pass 8)

All three channels — email, SMS, WhatsApp — default to **disabled**.
With nothing configured, the app works exactly as before; every
notification attempt is simply logged as `skipped` (visible under
நிர்வாகி → அறிவிப்புகள்), and nothing else is affected.

### Email

Email is real SMTP — any provider that speaks standard SMTP works
(Gmail, Amazon SES, SendGrid's SMTP relay, your own Postfix server, a
hosting provider's included mail server). Set in `backend/.env`:

```bash
MAIL_ENABLED=true
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_ENCRYPTION=tls          # tls | ssl | none
SMTP_FROM_EMAIL=noreply@yourdomain.com
SMTP_FROM_NAME=Karkathar Mangala Sandhippu
```

`SMTP_ENCRYPTION=tls` means STARTTLS on the given port (587 is the
usual STARTTLS port); `ssl` means implicit TLS from the first byte
(port 465 is the usual implicit-TLS port); `none` is plain text — only
appropriate for a mail relay on `localhost`/an internal network you
trust.

### SMS and WhatsApp

Unlike email, there's no single protocol every SMS/WhatsApp provider
speaks — Twilio, MSG91, Gupshup, Meta's WhatsApp Cloud API, and others
each have their own REST API and auth scheme. Rather than lock this
project to one vendor's SDK, both channels send a **configurable HTTP
request** built entirely from `.env` — wiring in a real provider is a
config change, not a code change:

```bash
SMS_ENABLED=true
SMS_API_URL=https://your-provider.example.com/send
SMS_API_METHOD=POST
SMS_API_HEADERS={"Content-Type":"application/json","Authorization":"Bearer YOUR_API_KEY"}
SMS_API_BODY_TEMPLATE={"to":"{{phone}}","message":"{{message}}"}
```

`{{phone}}` and `{{message}}` are substituted into the body template
before sending. `WHATSAPP_*` follows the identical shape. Check your
provider's API docs for their exact request format and adjust
`*_API_HEADERS`/`*_API_BODY_TEMPLATE` to match — most REST-API-based
providers (which is most of them) will work with this without any
code changes.

### What triggers a notification

Three lifecycle events, each attempting all three channels (skipping
whichever aren't enabled or configured): a member completing
registration (Step 5), an admin approving a member, and an admin
rejecting a member (the rejection reason is included in the message).
Every attempt — sent, failed, or skipped, with why — is logged and
visible under நிர்வாகி → அறிவிப்புகள்.

## Security notes for deployment

- Set a long, random `JWT_SECRET` — never reuse the local dev value.
- Serve over HTTPS only; the frontend and API should share the same
  parent domain or CORS must be locked to the exact frontend origin.
- `backend/.env`, `backend/api/logs/`, and `backend/api/uploads/` must
  never be web-accessible as raw files — `.htaccess` blocks `.php`
  execution and log access, but confirm this on your actual host.
- `backend/api/uploads/` (and its `photos/`, `id_proofs/`,
  `horoscopes/`, `family_photos/`, `receipts/` subfolders) must be
  writable by the web server user (e.g. `chown -R www-data:www-data
  backend/api/uploads`), or every registration file upload will fail.
- Rotate the GitHub PAT used during development once the project is
  handed off / passes are complete.
