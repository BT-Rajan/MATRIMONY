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
```

Migrations are numbered and additive (`001_...`, `002_...`, ...) — always run
them in order. Never edit a migration that has already been run against a
real database; add a new numbered file instead.

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

## Security notes for deployment

- Set a long, random `JWT_SECRET` — never reuse the local dev value.
- Serve over HTTPS only; the frontend and API should share the same
  parent domain or CORS must be locked to the exact frontend origin.
- `backend/.env`, `backend/api/logs/`, and `backend/api/uploads/` must
  never be web-accessible as raw files — `.htaccess` blocks `.php`
  execution and log access, but confirm this on your actual host.
- Rotate the GitHub PAT used during development once the project is
  handed off / passes are complete.
