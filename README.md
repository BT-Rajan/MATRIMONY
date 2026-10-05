# Chromepet Karkathar Sangam — Mangala Santhippu applications

React (Vite) + PHP 8.1+ (PDO) + MySQL/MariaDB. Requires `mbstring`, `pdo_mysql`.

```
backend/   PHP source, schema.sql, bin/install.php   (keep outside the web root)
public/    web root: api/index.php + built React app
frontend/  React source
```

Setup
1. `cp backend/.env.example backend/.env` and set DB credentials
2. `php backend/bin/install.php` — creates DB, tables and the first admin
3. `cd frontend && npm install && npm run build` — outputs into `public/`
4. Point the web server (Apache/XAMPP) at `public/`

Dev: `php -S 127.0.0.1:8000 -t public backend/dev-router.php` and `npm run dev` in `frontend/`.

Editable content: `frontend/src/config.js` (event date/venue, bank, contact), `frontend/src/content/terms.js` (terms; bump `TERMS_VERSION` in `backend/src/helpers.php` on change).

CloudPanel (Nginx) server: from the site dir run `sudo php backend/bin/server-setup.php`
(add `--dry-run` to preview). It creates `backend/.env`, sets up the DB, builds the frontend,
points the vhost root at `public/` with API/SPA routing, syncs CloudPanel's site record, fixes ownership and verifies.
