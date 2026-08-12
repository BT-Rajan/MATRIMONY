#!/usr/bin/env bash
# ==============================================================================
# installer.sh - local/hosting setup for karkathar mangala sandhippu (MATRIMONY)
#
# Automates docs/SETUP.md:
#   1. Run migrations (in order) against a database you already created
#      yourself - your own local MySQL/MariaDB, or one your hosting
#      provider already created for you. This installer does NOT create a
#      database or a database user; it only asks for the credentials of a
#      user that can already run SQL against a database that already
#      exists (that's all it ever needs).
#   2. Set up backend/.env with those same credentials
#   3. Set up frontend/.env and run npm install
#   4. Create uploads/logs folders with the right permissions
#
# Usage:
#   ./installer.sh                    interactive
#   ./installer.sh --noninteractive   use defaults, no prompts (needs env vars set - see below)
#   ./installer.sh --skip-db          skip database setup
#   ./installer.sh --skip-frontend    skip npm install
#   ./installer.sh --help             show this usage
#
# For --noninteractive, set these environment variables before running:
#   MATRIMONY_DB_HOST, MATRIMONY_DB_PORT, MATRIMONY_DB_NAME,
#   MATRIMONY_DB_USER, MATRIMONY_DB_PASS
#
# Before running this: create the database yourself, e.g.
#   CREATE DATABASE karkathar_matrimony CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
#
# Re-running is safe: migrations are just re-applied against the same DB,
# and existing .env files are never overwritten without confirmation.
# ==============================================================================
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
API_DIR="$BACKEND_DIR/api"
SQL_DIR="$API_DIR/sql"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

NONINTERACTIVE=0
SKIPDB=0
SKIPFRONTEND=0

usage() {
  cat <<'EOF'
Usage: ./installer.sh [--noninteractive] [--skip-db] [--skip-frontend]

For --noninteractive, set these environment variables first:
  MATRIMONY_DB_HOST, MATRIMONY_DB_PORT, MATRIMONY_DB_NAME,
  MATRIMONY_DB_USER, MATRIMONY_DB_PASS

This installer does NOT create a database - create it yourself first, e.g.:
  CREATE DATABASE karkathar_matrimony CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EOF
}

for arg in "$@"; do
  case "$arg" in
    --noninteractive) NONINTERACTIVE=1 ;;
    --skip-db) SKIPDB=1 ;;
    --skip-frontend) SKIPFRONTEND=1 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $arg"; usage; exit 1 ;;
  esac
done

DB_HOST="${MATRIMONY_DB_HOST:-127.0.0.1}"
DB_PORT="${MATRIMONY_DB_PORT:-3306}"
DB_NAME="${MATRIMONY_DB_NAME:-karkathar_matrimony}"
DB_USER="${MATRIMONY_DB_USER:-}"
DB_PASS="${MATRIMONY_DB_PASS:-}"

echo
echo "=============================================="
echo " MATRIMONY installer"
echo "=============================================="

# ---------------------------------------------------------------------------
# 0. Prerequisite checks
# ---------------------------------------------------------------------------
echo
echo "==> Checking prerequisites"

if ! command -v php >/dev/null 2>&1; then
  echo "ERROR: PHP not found on PATH."
  exit 1
fi
PHP_VER="$(php -r 'echo PHP_VERSION;')"
echo "  PHP $PHP_VER found"

if ! php -r "exit(extension_loaded('pdo_mysql') ? 0 : 1);" 2>/dev/null; then
  echo "  WARNING: pdo_mysql extension not detected - the backend will not run without it."
fi

if [ "$SKIPDB" -eq 0 ]; then
  if ! command -v mysql >/dev/null 2>&1; then
    echo "ERROR: mysql client not found on PATH."
    exit 1
  fi
  echo "  mysql client found"
fi

if [ "$SKIPFRONTEND" -eq 0 ]; then
  if ! command -v node >/dev/null 2>&1; then
    echo "ERROR: Node.js not found on PATH. Install Node.js 20+."
    exit 1
  fi
  echo "  Node $(node -v) found"

  if ! command -v npm >/dev/null 2>&1; then
    echo "ERROR: npm not found on PATH."
    exit 1
  fi
fi

# ---------------------------------------------------------------------------
# 1. Database - migrations only. This installer never creates a database or
#    a database user; it expects both to already exist and just needs
#    credentials that can already run SQL (CREATE TABLE / ALTER / INSERT)
#    against the database named below.
# ---------------------------------------------------------------------------
if [ "$SKIPDB" -eq 1 ]; then
  echo
  echo "==> Skipping database setup (--skip-db)"
else
  echo
  echo "==> Database setup"
  echo "  This installer does NOT create a database. Create it yourself first"
  echo "  if you haven't already, e.g.:"
  echo "    CREATE DATABASE $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
  echo "  Then enter the credentials of a user that can already run SQL against it."

  if [ ! -d "$SQL_DIR" ]; then
    echo "ERROR: Migration directory not found: $SQL_DIR"
    exit 1
  fi

  if [ "$NONINTERACTIVE" -eq 0 ]; then
    echo
    read -rp "Database host [$DB_HOST]: " input; [ -n "$input" ] && DB_HOST="$input"
    read -rp "Database port [$DB_PORT]: " input; [ -n "$input" ] && DB_PORT="$input"
    read -rp "Database name [$DB_NAME]: " input; [ -n "$input" ] && DB_NAME="$input"
    read -rp "Database username: " input; [ -n "$input" ] && DB_USER="$input"
    read -rsp "Database password (leave blank if none): " input; echo; [ -n "$input" ] && DB_PASS="$input"
  fi

  if [ -z "$DB_USER" ]; then
    echo "ERROR: A database username is required."
    exit 1
  fi

  # MYSQL_PWD is read directly by the mysql client from the environment -
  # deliberate, so a password containing shell-special characters (& $ ' " etc,
  # all valid and common in passwords) never has to be embedded on a command
  # line or interpolated into a string.
  export MYSQL_PWD="$DB_PASS"
  MYSQL_ARGS=(-h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER")

  echo
  echo "==> Testing the connection to database \"$DB_NAME\""
  conn_log="$(mktemp)"
  if ! mysql "${MYSQL_ARGS[@]}" --default-character-set=utf8mb4 -D "$DB_NAME" -e "SELECT 1;" >"$conn_log" 2>&1; then
    echo "ERROR: Could not connect to database \"$DB_NAME\" with those credentials. Details:"
    cat "$conn_log"
    rm -f "$conn_log"
    unset MYSQL_PWD
    exit 1
  fi
  rm -f "$conn_log"
  echo "  Connected."

  echo
  echo "==> Running migrations (in filename order) from $SQL_DIR"
  # Every migration file targets the database by name via the mysql client's
  # own -D flag below, not by relying on the file's internal
  # "CREATE DATABASE" / "USE karkathar_matrimony;" statements - those two
  # lines are stripped from each file first, so this works correctly even if
  # your actual database is named something else.
  migration_failed=0
  while IFS= read -r -d '' f; do
    fname="$(basename "$f")"
    echo "  - $fname"
    tmp_sql="$(mktemp)"
    grep -Ev '^(CREATE DATABASE|USE karkathar_matrimony)' "$f" > "$tmp_sql"
    if ! mysql "${MYSQL_ARGS[@]}" --default-character-set=utf8mb4 -D "$DB_NAME" < "$tmp_sql"; then
      echo "ERROR: Migration failed: $fname"
      migration_failed=1
    fi
    rm -f "$tmp_sql"
    [ "$migration_failed" -eq 1 ] && break
  done < <(find "$SQL_DIR" -maxdepth 1 -name '*.sql' -print0 | sort -z)

  unset MYSQL_PWD

  if [ "$migration_failed" -eq 1 ]; then
    exit 1
  fi
  echo "  All migrations applied."
fi

# ---------------------------------------------------------------------------
# 2. Backend .env - same credentials entered above, no separate app user
# ---------------------------------------------------------------------------
echo
echo "==> Backend configuration"

BACKEND_ENV="$BACKEND_DIR/.env"
BACKEND_ENV_EXAMPLE="$BACKEND_DIR/.env.example"
if [ ! -f "$BACKEND_ENV_EXAMPLE" ]; then
  echo "ERROR: Missing $BACKEND_ENV_EXAMPLE"
  exit 1
fi

write_backend_env=1
if [ -f "$BACKEND_ENV" ]; then
  write_backend_env=0
  if [ "$NONINTERACTIVE" -eq 1 ]; then
    write_backend_env=1
  else
    read -rp "backend/.env already exists - overwrite it? [y/N] " ans
    case "$ans" in [Yy]*) write_backend_env=1 ;; esac
  fi
fi

# Escapes &, / and \ so a value can be dropped safely into a sed s/// replacement.
sed_escape() { printf '%s' "$1" | sed -e 's/[&/\]/\\&/g'; }

if [ "$write_backend_env" -eq 1 ]; then
  if command -v openssl >/dev/null 2>&1; then
    JWT_SECRET="$(openssl rand -hex 32)"
  else
    JWT_SECRET="$(head -c 48 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 64)"
  fi

  cp "$BACKEND_ENV_EXAMPLE" "$BACKEND_ENV"
  sed -i.bak \
    -e "s/^DB_HOST=.*/DB_HOST=$(sed_escape "$DB_HOST")/" \
    -e "s/^DB_PORT=.*/DB_PORT=$(sed_escape "$DB_PORT")/" \
    -e "s/^DB_NAME=.*/DB_NAME=$(sed_escape "$DB_NAME")/" \
    -e "s/^DB_USER=.*/DB_USER=$(sed_escape "$DB_USER")/" \
    -e "s/^DB_PASS=.*/DB_PASS=$(sed_escape "$DB_PASS")/" \
    -e "s/^JWT_SECRET=.*/JWT_SECRET=$(sed_escape "$JWT_SECRET")/" \
    "$BACKEND_ENV"
  rm -f "$BACKEND_ENV.bak"
  echo "  Wrote backend/.env (DB credentials + a fresh random JWT_SECRET)"
  echo "  Email/SMS/WhatsApp remain disabled - edit backend/.env to enable, see docs/SETUP.md"
else
  echo "  Keeping existing backend/.env"
fi

# ---------------------------------------------------------------------------
# 3. Uploads & logs folders
# ---------------------------------------------------------------------------
echo
echo "==> Preparing uploads/ and logs/ directories"
for d in photos id_proofs horoscopes family_photos receipts; do
  mkdir -p "$API_DIR/uploads/$d"
done
mkdir -p "$API_DIR/logs"
chmod -R u+rwX "$API_DIR/uploads" "$API_DIR/logs" 2>/dev/null || true
echo "  uploads/ and logs/ ready"
echo "  NOTE: make sure the web server user (e.g. www-data) has write access"
echo "  to backend/api/uploads and backend/api/logs in production."

# ---------------------------------------------------------------------------
# 4. Frontend
# ---------------------------------------------------------------------------
if [ "$SKIPFRONTEND" -eq 1 ]; then
  echo
  echo "==> Skipping frontend setup (--skip-frontend)"
else
  echo
  echo "==> Frontend configuration"

  FRONTEND_ENV="$FRONTEND_DIR/.env"
  FRONTEND_ENV_EXAMPLE="$FRONTEND_DIR/.env.example"
  if [ ! -f "$FRONTEND_ENV_EXAMPLE" ]; then
    echo "ERROR: Missing $FRONTEND_ENV_EXAMPLE"
    exit 1
  fi

  write_frontend_env=1
  if [ -f "$FRONTEND_ENV" ]; then
    write_frontend_env=0
    if [ "$NONINTERACTIVE" -eq 1 ]; then
      write_frontend_env=1
    else
      read -rp "frontend/.env already exists - overwrite it? [y/N] " ans
      case "$ans" in [Yy]*) write_frontend_env=1 ;; esac
    fi
  fi

  if [ "$write_frontend_env" -eq 1 ]; then
    api_base_url="http://127.0.0.1:8080"
    if [ "$NONINTERACTIVE" -eq 0 ]; then
      read -rp "Backend API base URL (VITE_API_BASE_URL) [$api_base_url]: " input
      [ -n "$input" ] && api_base_url="$input"
    fi

    cp "$FRONTEND_ENV_EXAMPLE" "$FRONTEND_ENV"
    sed -i.bak -e "s#^VITE_API_BASE_URL=.*#VITE_API_BASE_URL=$(sed_escape "$api_base_url")#" "$FRONTEND_ENV"
    rm -f "$FRONTEND_ENV.bak"
    echo "  Wrote frontend/.env"
  else
    echo "  Keeping existing frontend/.env"
  fi

  echo
  echo "==> Installing frontend dependencies (npm install)"
  (cd "$FRONTEND_DIR" && npm install)
  if [ $? -ne 0 ]; then
    echo "ERROR: npm install failed"
    exit 1
  fi
  echo "  Frontend dependencies installed"
fi

echo
echo "=============================================="
echo " Setup complete"
echo "=============================================="
echo
echo "Next steps:"
echo
echo "  1. Start the backend:"
echo "       cd backend/api"
echo "       php -S 127.0.0.1:8080 -t . index.php"
echo
echo "  2. Start the frontend (in another terminal):"
echo "       cd frontend"
echo "       npm run dev"
echo
echo "  3. Log in with the seeded admin account, then change the password"
echo "     immediately (see docs/SETUP.md \"First login\"):"
echo "       username: superadmin"
echo "       password: ChangeMe@123"
echo
