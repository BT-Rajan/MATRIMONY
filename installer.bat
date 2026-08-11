@echo off
REM ============================================================================
REM installer.bat - local/hosting setup for karkathar mangala sandhippu (MATRIMONY)
REM
REM Automates docs\SETUP.md:
REM   1. Run migrations (in order) against a database you already have
REM      access to - your own local MySQL, or one your hosting provider
REM      already created for you. This does NOT create a new database user;
REM      it only asks for the credentials of a user that can already run
REM      SQL against that database (that's all the installer ever needs).
REM   2. Set up backend\.env with those same credentials
REM   3. Set up frontend\.env and run npm install
REM   4. Create uploads/logs folders
REM
REM Usage:
REM   installer.bat                    interactive
REM   installer.bat /NONINTERACTIVE    use defaults, no prompts (needs env vars set - see below)
REM   installer.bat /SKIPDB            skip database setup
REM   installer.bat /SKIPFRONTEND      skip npm install
REM
REM For /NONINTERACTIVE, set these environment variables before running:
REM   MATRIMONY_DB_HOST, MATRIMONY_DB_PORT, MATRIMONY_DB_NAME,
REM   MATRIMONY_DB_USER, MATRIMONY_DB_PASS
REM
REM Re-running is safe: migrations are just re-applied against the same DB,
REM and existing .env files are never overwritten without confirmation.
REM Run from a normal Command Prompt (cmd.exe), not PowerShell.
REM This window always stays open at the end (success or failure) - press
REM any key to close it once you're done reading.
REM ============================================================================
setlocal EnableDelayedExpansion

set "SCRIPT_DIR=%~dp0"
if "%SCRIPT_DIR:~-1%"=="\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"
set "BACKEND_DIR=%SCRIPT_DIR%\backend"
set "API_DIR=%BACKEND_DIR%\api"
set "SQL_DIR=%API_DIR%\sql"
set "FRONTEND_DIR=%SCRIPT_DIR%\frontend"
set "TMP_PS1=%TEMP%\matrimony_installer_%RANDOM%.ps1"
set "TMP_SQL=%TEMP%\matrimony_installer_%RANDOM%.sql"

set "NONINTERACTIVE=0"
set "SKIPDB=0"
set "SKIPFRONTEND=0"
set "OVERWRITE="
set "OVERWRITE2="

for %%A in (%*) do (
  if /I "%%A"=="/NONINTERACTIVE" set "NONINTERACTIVE=1"
  if /I "%%A"=="/SKIPDB" set "SKIPDB=1"
  if /I "%%A"=="/SKIPFRONTEND" set "SKIPFRONTEND=1"
  if /I "%%A"=="/?" goto :usage
  if /I "%%A"=="/HELP" goto :usage
)

set "DB_HOST=%MATRIMONY_DB_HOST%"
set "DB_PORT=%MATRIMONY_DB_PORT%"
set "DB_NAME=%MATRIMONY_DB_NAME%"
set "DB_USER=%MATRIMONY_DB_USER%"
set "DB_PASS=%MATRIMONY_DB_PASS%"
if "%DB_HOST%"=="" set "DB_HOST=127.0.0.1"
if "%DB_PORT%"=="" set "DB_PORT=3306"
if "%DB_NAME%"=="" set "DB_NAME=karkathar_matrimony"

echo.
echo ==============================================
echo  MATRIMONY installer
echo ==============================================

REM ---------------------------------------------------------------------
REM 0a. Auto-detect XAMPP / common bundled PHP+MySQL installs and add
REM     them to PATH for this session only, if not already on PATH.
REM ---------------------------------------------------------------------
where php >nul 2>nul
if errorlevel 1 (
  for %%X in (C:\xampp D:\xampp C:\xampp8 C:\xampp7) do (
    if exist "%%X\php\php.exe" set "PATH=%%X\php;!PATH!"
  )
)
where mysql >nul 2>nul
if errorlevel 1 (
  for %%X in (C:\xampp D:\xampp C:\xampp8 C:\xampp7) do (
    if exist "%%X\mysql\bin\mysql.exe" set "PATH=%%X\mysql\bin;!PATH!"
  )
)

REM ---------------------------------------------------------------------
REM 0b. Prerequisite checks
REM ---------------------------------------------------------------------
echo.
echo ==^> Checking prerequisites

where php >nul 2>nul
if errorlevel 1 (
  echo ERROR: PHP not found on PATH ^(also checked common XAMPP install paths^).
  echo   If PHP is installed somewhere else ^(e.g. XAMPP in a non-default folder^),
  echo   run this first in the same window, then re-run installer.bat:
  echo     set "PATH=C:\path\to\xampp\php;%%PATH%%"
  goto :fail
)
for /f "tokens=*" %%V in ('php -r "echo PHP_VERSION;" 2^>nul') do set "PHP_VER=%%V"
echo   PHP !PHP_VER! found

php -m | findstr /I pdo_mysql >nul
if errorlevel 1 (
  echo   WARNING: pdo_mysql extension not detected - the backend will not run without it.
)

if "%SKIPDB%"=="0" (
  where mysql >nul 2>nul
  if errorlevel 1 (
    echo ERROR: mysql client not found on PATH ^(also checked common XAMPP install paths^).
    echo   If using XAMPP in a non-default folder, run this first in the same
    echo   window, then re-run installer.bat:
    echo     set "PATH=C:\path\to\xampp\mysql\bin;%%PATH%%"
    goto :fail
  )
  echo   mysql client found
)

if "%SKIPFRONTEND%"=="0" (
  where node >nul 2>nul
  if errorlevel 1 (
    echo ERROR: Node.js not found on PATH. Install Node.js 20+.
    goto :fail
  )
  for /f "tokens=*" %%V in ('node -v') do set "NODE_VER=%%V"
  echo   Node !NODE_VER! found

  where npm >nul 2>nul
  if errorlevel 1 (
    echo ERROR: npm not found on PATH.
    goto :fail
  )
)

REM ---------------------------------------------------------------------
REM 1. Database
REM
REM Only ONE set of credentials is ever asked for: a database name plus
REM a username/password that can already run SQL against it (CREATE
REM TABLE / ALTER / INSERT). That's every permission the installer needs.
REM It never creates a MySQL user - on shared hosting you normally can't
REM anyway (that's done once via your host's control panel), and this
REM avoids the installer trying to do something it doesn't have rights
REM to do, or something you didn't ask for.
REM ---------------------------------------------------------------------
if "%SKIPDB%"=="1" (
  echo.
  echo ==^> Skipping database setup ^(/SKIPDB^)
  goto :backend_env
)

echo.
echo ==^> Database setup

if not exist "%SQL_DIR%" (
  echo ERROR: Migration directory not found: %SQL_DIR%
  goto :fail
)

if "%NONINTERACTIVE%"=="0" (
  echo   Enter the details of a database you already have access to -
  echo   your own local MySQL, or one already created for you by your
  echo   hosting provider ^(cPanel etc^). Nothing new is created except
  echo   the tables themselves.
  echo.
  set /p "DB_HOST=Database host [%DB_HOST%]: "
  if "!DB_HOST!"=="" set "DB_HOST=127.0.0.1"
  set /p "DB_PORT=Database port [%DB_PORT%]: "
  if "!DB_PORT!"=="" set "DB_PORT=3306"
  set /p "DB_NAME=Database name [%DB_NAME%]: "
  if "!DB_NAME!"=="" set "DB_NAME=karkathar_matrimony"
  set /p "DB_USER=Database username: "
  set /p "DB_PASS=Database password (leave blank if none): "
)

if "%DB_USER%"=="" (
  echo ERROR: A database username is required.
  goto :fail
)

REM MYSQL_PWD is read directly by the mysql client from the environment -
REM this is deliberate: a password embedded on the command line as -pXXXX
REM breaks (and can crash this whole script) the moment it contains a
REM character cmd.exe treats specially - ^& ^^ %% ^! ^< ^> ^| are all valid,
REM common password characters. MYSQL_PWD sidesteps that entirely.
set "MYSQL_PWD=%DB_PASS%"
set "MYSQL_ARGS=-h %DB_HOST% -P %DB_PORT% -u %DB_USER%"

echo.
echo ==^> Testing the connection
mysql %MYSQL_ARGS% --default-character-set=utf8mb4 -e "SELECT 1;" >nul 2>"%TEMP%\matrimony_conn_test.log"
if errorlevel 1 (
  echo ERROR: Could not connect with those credentials. Details:
  type "%TEMP%\matrimony_conn_test.log"
  del /q "%TEMP%\matrimony_conn_test.log" >nul 2>nul
  set "MYSQL_PWD="
  goto :fail
)
del /q "%TEMP%\matrimony_conn_test.log" >nul 2>nul
echo   Connected.

echo.
echo ==^> Preparing database "%DB_NAME%"
mysql %MYSQL_ARGS% --default-character-set=utf8mb4 -e "CREATE DATABASE IF NOT EXISTS %DB_NAME% CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>"%TEMP%\matrimony_createdb.log"
if errorlevel 1 (
  REM Common on shared hosting: the DB user can't CREATE DATABASE because
  REM the database was already provisioned for them. That's fine as long
  REM as it's actually usable - check that instead of failing outright.
  mysql %MYSQL_ARGS% --default-character-set=utf8mb4 -D %DB_NAME% -e "SELECT 1;" >nul 2>nul
  if errorlevel 1 (
    echo ERROR: Could not create or access database "%DB_NAME%". Details:
    type "%TEMP%\matrimony_createdb.log"
    del /q "%TEMP%\matrimony_createdb.log" >nul 2>nul
    set "MYSQL_PWD="
    goto :fail
  )
  echo   Database already exists and is accessible - continuing.
) else (
  echo   Database ready.
)
del /q "%TEMP%\matrimony_createdb.log" >nul 2>nul

echo.
echo ==^> Running migrations (in filename order) from %SQL_DIR%
REM Every migration file targets the database by name via the mysql
REM client's own -D flag below, not by relying on the file's internal
REM "CREATE DATABASE" / "USE karkathar_matrimony;" statements - those
REM two lines are stripped from each file first, so this works
REM correctly even if your actual database is named something else.
for /f "delims=" %%F in ('dir /b /on "%SQL_DIR%\*.sql"') do (
  echo   - %%F
  findstr /I /V /B /C:"CREATE DATABASE" /C:"USE karkathar_matrimony" "%SQL_DIR%\%%F" > "%TMP_SQL%"
  mysql %MYSQL_ARGS% --default-character-set=utf8mb4 -D %DB_NAME% < "%TMP_SQL%"
  if errorlevel 1 (
    echo ERROR: Migration failed: %%F
    del /q "%TMP_SQL%" >nul 2>nul
    set "MYSQL_PWD="
    goto :fail
  )
)
del /q "%TMP_SQL%" >nul 2>nul
echo   All migrations applied.

set "MYSQL_PWD="

REM ---------------------------------------------------------------------
REM 2. Backend .env - same credentials entered above, no separate app user
REM ---------------------------------------------------------------------
:backend_env
echo.
echo ==^> Backend configuration

set "BACKEND_ENV=%BACKEND_DIR%\.env"
set "BACKEND_ENV_EXAMPLE=%BACKEND_DIR%\.env.example"
if not exist "%BACKEND_ENV_EXAMPLE%" (
  echo ERROR: Missing %BACKEND_ENV_EXAMPLE%
  goto :fail
)

set "WRITE_BACKEND_ENV=1"
if exist "%BACKEND_ENV%" (
  set "WRITE_BACKEND_ENV=0"
  if "%NONINTERACTIVE%"=="1" (
    set "WRITE_BACKEND_ENV=1"
  ) else (
    set /p "OVERWRITE=backend\.env already exists - overwrite it? [Y/n] "
    if /I "!OVERWRITE!"=="" set "WRITE_BACKEND_ENV=1"
    if /I "!OVERWRITE!"=="Y" set "WRITE_BACKEND_ENV=1"
  )
)

if "%WRITE_BACKEND_ENV%"=="1" (
  for /f "tokens=*" %%S in ('powershell -NoProfile -Command "-join ((48..57)+(65..70)|Get-Random -Count 64|ForEach-Object{[char]$_})" 2^>nul') do set "JWT_SECRET=%%S"
  if "!JWT_SECRET!"=="" set "JWT_SECRET=change-this-to-a-long-random-value-%RANDOM%%RANDOM%%RANDOM%"

  if exist "%TMP_PS1%" del /q "%TMP_PS1%" >nul 2>nul
  echo $c = Get-Content -Raw '%BACKEND_ENV_EXAMPLE%'> "%TMP_PS1%"
  echo $c = $c -replace '(?m)^^DB_HOST=.*', ('DB_HOST=' + $env:MATRIMONY_ENV_DB_HOST)>> "%TMP_PS1%"
  echo $c = $c -replace '(?m)^^DB_PORT=.*', ('DB_PORT=' + $env:MATRIMONY_ENV_DB_PORT)>> "%TMP_PS1%"
  echo $c = $c -replace '(?m)^^DB_NAME=.*', ('DB_NAME=' + $env:MATRIMONY_ENV_DB_NAME)>> "%TMP_PS1%"
  echo $c = $c -replace '(?m)^^DB_USER=.*', ('DB_USER=' + $env:MATRIMONY_ENV_DB_USER)>> "%TMP_PS1%"
  echo $c = $c -replace '(?m)^^DB_PASS=.*', ('DB_PASS=' + $env:MATRIMONY_ENV_DB_PASS)>> "%TMP_PS1%"
  echo $c = $c -replace '(?m)^^JWT_SECRET=.*', 'JWT_SECRET=!JWT_SECRET!'>> "%TMP_PS1%"
  echo Set-Content -NoNewline -Path '%BACKEND_ENV%' -Value $c>> "%TMP_PS1%"

  REM Passed via environment variables (not embedded into the generated
  REM PowerShell text) so a password containing a quote or $ can't break
  REM the generated script - same reasoning as MYSQL_PWD above.
  set "MATRIMONY_ENV_DB_HOST=%DB_HOST%"
  set "MATRIMONY_ENV_DB_PORT=%DB_PORT%"
  set "MATRIMONY_ENV_DB_NAME=%DB_NAME%"
  set "MATRIMONY_ENV_DB_USER=%DB_USER%"
  set "MATRIMONY_ENV_DB_PASS=%DB_PASS%"
  powershell -NoProfile -ExecutionPolicy Bypass -File "%TMP_PS1%"
  if errorlevel 1 (
    echo ERROR: Failed to write backend\.env via PowerShell.
    del /q "%TMP_PS1%" >nul 2>nul
    set "MATRIMONY_ENV_DB_HOST="
    set "MATRIMONY_ENV_DB_PORT="
    set "MATRIMONY_ENV_DB_NAME="
    set "MATRIMONY_ENV_DB_USER="
    set "MATRIMONY_ENV_DB_PASS="
    goto :fail
  )
  del /q "%TMP_PS1%" >nul 2>nul
  set "MATRIMONY_ENV_DB_HOST="
  set "MATRIMONY_ENV_DB_PORT="
  set "MATRIMONY_ENV_DB_NAME="
  set "MATRIMONY_ENV_DB_USER="
  set "MATRIMONY_ENV_DB_PASS="

  echo   Wrote backend\.env ^(DB credentials + a fresh random JWT_SECRET^)
  echo   Email/SMS/WhatsApp remain disabled - edit backend\.env to enable, see docs\SETUP.md
) else (
  echo   Keeping existing backend\.env
)

REM ---------------------------------------------------------------------
REM 3. Uploads & logs folders
REM ---------------------------------------------------------------------
echo.
echo ==^> Preparing uploads\ and logs\ directories
for %%D in (photos id_proofs horoscopes family_photos receipts) do (
  if not exist "%API_DIR%\uploads\%%D" mkdir "%API_DIR%\uploads\%%D"
)
if not exist "%API_DIR%\logs" mkdir "%API_DIR%\logs"
echo   uploads\ and logs\ ready
echo   NOTE: on IIS/Apache-for-Windows deployments, make sure the web server
echo   process has write access to backend\api\uploads and backend\api\logs.

REM ---------------------------------------------------------------------
REM 4. Frontend
REM ---------------------------------------------------------------------
if "%SKIPFRONTEND%"=="1" (
  echo.
  echo ==^> Skipping frontend setup ^(/SKIPFRONTEND^)
  goto :done
)

echo.
echo ==^> Frontend configuration

set "FRONTEND_ENV=%FRONTEND_DIR%\.env"
set "FRONTEND_ENV_EXAMPLE=%FRONTEND_DIR%\.env.example"
if not exist "%FRONTEND_ENV_EXAMPLE%" (
  echo ERROR: Missing %FRONTEND_ENV_EXAMPLE%
  goto :fail
)

set "WRITE_FRONTEND_ENV=1"
if exist "%FRONTEND_ENV%" (
  set "WRITE_FRONTEND_ENV=0"
  if "%NONINTERACTIVE%"=="1" (
    set "WRITE_FRONTEND_ENV=1"
  ) else (
    set /p "OVERWRITE2=frontend\.env already exists - overwrite it? [Y/n] "
    if /I "!OVERWRITE2!"=="" set "WRITE_FRONTEND_ENV=1"
    if /I "!OVERWRITE2!"=="Y" set "WRITE_FRONTEND_ENV=1"
  )
)

if "%WRITE_FRONTEND_ENV%"=="1" (
  set "API_BASE_URL=http://127.0.0.1:8080"
  if "%NONINTERACTIVE%"=="0" (
    set /p "API_BASE_URL=Backend API base URL (VITE_API_BASE_URL) [http://127.0.0.1:8080]: "
    if "!API_BASE_URL!"=="" set "API_BASE_URL=http://127.0.0.1:8080"
  )

  if exist "%TMP_PS1%" del /q "%TMP_PS1%" >nul 2>nul
  echo $c = Get-Content -Raw '%FRONTEND_ENV_EXAMPLE%'> "%TMP_PS1%"
  echo $c = $c -replace '(?m)^^VITE_API_BASE_URL=.*', 'VITE_API_BASE_URL=!API_BASE_URL!'>> "%TMP_PS1%"
  echo Set-Content -NoNewline -Path '%FRONTEND_ENV%' -Value $c>> "%TMP_PS1%"

  powershell -NoProfile -ExecutionPolicy Bypass -File "%TMP_PS1%"
  if errorlevel 1 (
    echo ERROR: Failed to write frontend\.env via PowerShell.
    del /q "%TMP_PS1%" >nul 2>nul
    goto :fail
  )
  del /q "%TMP_PS1%" >nul 2>nul
  echo   Wrote frontend\.env
) else (
  echo   Keeping existing frontend\.env
)

echo.
echo ==^> Installing frontend dependencies (npm install)
pushd "%FRONTEND_DIR%"
call npm install
if errorlevel 1 (
  popd
  echo ERROR: npm install failed
  goto :fail
)
popd
echo   Frontend dependencies installed

:done
echo.
echo ==============================================
echo  Setup complete
echo ==============================================
echo.
echo Next steps:
echo.
echo   1. Start the backend:
echo        cd backend\api
echo        php -S 127.0.0.1:8080 -t . index.php
echo.
echo   2. Start the frontend (in another terminal):
echo        cd frontend
echo        npm run dev
echo.
echo   3. Log in with the seeded admin account, then change the password
echo      immediately (see docs\SETUP.md "First login"):
echo        username: superadmin
echo        password: ChangeMe@123
echo.
echo Press any key to close this window . . .
pause >nul
endlocal
exit /b 0

:usage
echo Usage: installer.bat [/NONINTERACTIVE] [/SKIPDB] [/SKIPFRONTEND]
echo.
echo For /NONINTERACTIVE, set these environment variables first:
echo   MATRIMONY_DB_HOST, MATRIMONY_DB_PORT, MATRIMONY_DB_NAME,
echo   MATRIMONY_DB_USER, MATRIMONY_DB_PASS
echo.
pause
exit /b 0

:fail
echo.
echo Installer stopped due to an error - see above for details.
echo.
echo Press any key to close this window . . .
pause >nul
endlocal
exit /b 1
