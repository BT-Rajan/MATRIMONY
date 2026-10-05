<?php
declare(strict_types=1);
// One-shot setup for a CloudPanel (Nginx) server. Run as root from the site dir:
//   php backend/bin/server-setup.php [--domain=karkathar.org] [--skip-build] [--skip-db] [--skip-clp-db] [--dry-run]
// Safe to re-run: every step checks before it changes anything, and files are backed up as *.bak.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }

const MARK = '# matrimony-setup';
const CLP_DB = '/home/clp/htdocs/app/data/db.sq3';

$opt = getopt('', ['domain:', 'skip-build', 'skip-db', 'skip-clp-db', 'dry-run', 'help']);
if (isset($opt['help'])) { echo "usage: php backend/bin/server-setup.php [--domain=host] [--skip-build] [--skip-db] [--skip-clp-db] [--dry-run]\n"; exit; }
$dry = isset($opt['dry-run']);

function step(string $m): void { echo "\n\033[1m== $m\033[0m\n"; }
function ok(string $m): void { echo "  ok    $m\n"; }
function warn(string $m): void { echo "  WARN  $m\n"; }
function fail(string $m): never { fwrite(STDERR, "  ERROR $m\n"); exit(1); }
function ask(string $q, string $def = '', bool $hidden = false): string
{
    echo "  $q" . ($def !== '' && !$hidden ? " [$def]" : '') . ': ';
    if ($hidden) system('stty -echo');
    $v = trim((string)fgets(STDIN));
    if ($hidden) { system('stty echo'); echo "\n"; }
    return $v === '' ? $def : $v;
}
function run(string $cmd, bool $dry): int
{
    echo "  \$ $cmd\n";
    if ($dry) return 0;
    passthru($cmd, $rc);
    return $rc;
}
function put(string $f, string $s, bool $dry): void
{
    if ($dry) { ok("(dry-run) would write $f"); return; }
    if (is_file($f)) @copy($f, "$f.bak");
    $tmp = "$f.tmp";
    if (file_put_contents($tmp, $s, LOCK_EX) === false || !rename($tmp, $f)) fail("write failed: $f");
    ok("wrote $f (backup: $f.bak)");
}

// Applies the app's routing to a CloudPanel vhost (rendered file or stored template).
function patch_vhost(string $s, string $site, string $pub): string
{
    // web root -> public/
    $s = preg_replace('#(\broot\s+)' . preg_quote($site, '#') . '/?;#', '${1}' . $pub . ';', $s);
    // SPA fallback instead of WordPress-style /index.php
    $s = preg_replace('#try_files\s+\$uri\s+\$uri/\s+/index\.php\?\$args;#', 'try_files $uri $uri/ /index.html;', $s);
    if (str_contains($s, MARK)) return $s;
    // API front controller + headers, inserted in the server block that runs PHP
    $add = "  " . MARK . "\n"
         . "  location /api/ {\n    try_files \$uri /api/index.php?\$args;\n  }\n"
         . "  location ~ /\\. {\n    deny all;\n  }\n"
         . "  add_header X-Content-Type-Options \"nosniff\" always;\n"
         . "  add_header X-Frame-Options \"DENY\" always;\n"
         . "  add_header Referrer-Policy \"no-referrer\" always;\n"
         . "  add_header Permissions-Policy \"camera=(), microphone=(), geolocation=()\" always;\n"
         . "  add_header Content-Security-Policy \"default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'\" always;\n"
         . "  " . MARK . " end\n";
    $n = 0;
    $s = preg_replace('#^([ \t]*location\s+~\s+\\\\\.php\$\s*\{)#m', $add . '$1', $s, 1, $n);
    if ($n === 0) fail('no "location ~ \.php$" block found in vhost - is this a CloudPanel PHP site?');
    return $s;
}

// ---------------------------------------------------------------- preflight
step('Preflight');
$uid = function_exists('posix_geteuid') ? posix_geteuid() : (int)trim((string)shell_exec('id -u'));
if ($uid !== 0 && !$dry) fail('run as root (sudo php backend/bin/server-setup.php)');
if (PHP_VERSION_ID < 80100) fail('PHP 8.1+ required, found ' . PHP_VERSION);
foreach (['mbstring', 'pdo_mysql'] as $e) extension_loaded($e) ? ok("ext $e") : fail("PHP extension $e missing (apt install php" . PHP_MAJOR_VERSION . '.' . PHP_MINOR_VERSION . '-' . ($e === 'pdo_mysql' ? 'mysql' : $e) . ')');

$site = realpath(__DIR__ . '/../..');
$pub = "$site/public";
$domain = strtolower($opt['domain'] ?? basename($site));
if (!preg_match('/^([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/', $domain)) fail("cannot tell the domain from $site - pass --domain=example.org");
$user = trim((string)shell_exec('stat -c %U ' . escapeshellarg($site)));
if (preg_match('#^/home/([^/]+)/htdocs/#', $site, $m)) $user = $m[1];
if ($user === '' || $user === 'root') fail("could not determine the CloudPanel site user for $site");
ok("site dir  $site");
ok("domain    $domain");
ok("site user $user");

// ---------------------------------------------------------------- .env
step('Backend config (backend/.env)');
$envFile = "$site/backend/.env";
if (is_file($envFile)) {
    ok('exists, keeping it');
} else {
    echo "  Create the database + user in CloudPanel (Databases tab) first, then enter them here.\n";
    $vals = [
        'DB_HOST' => ask('DB host', '127.0.0.1'),
        'DB_PORT' => ask('DB port', '3306'),
        'DB_NAME' => ask('DB name', 'matrimony'),
        'DB_USER' => ask('DB user', 'matrimony'),
        'DB_PASS' => ask('DB password', '', true),
        'IP_HEADER' => '',
    ];
    $out = '';
    foreach ($vals as $k => $v) $out .= "$k=$v\n";
    put($envFile, $out, $dry);
}
if (!$dry && is_file($envFile)) { @chmod($envFile, 0640); @chown($envFile, $user); @chgrp($envFile, $user); }

// ---------------------------------------------------------------- database
step('Database');
if (isset($opt['skip-db'])) {
    ok('skipped (--skip-db)');
} elseif (!$dry) {
    require "$site/backend/src/helpers.php";
    try {
        new PDO('mysql:host=' . env('DB_HOST', '127.0.0.1') . ';port=' . env('DB_PORT', '3306') . ';charset=utf8mb4',
            env('DB_USER', 'root'), env('DB_PASS', ''), [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT => 5]);
        ok('connected as ' . env('DB_USER'));
    } catch (PDOException $e) {
        fail('cannot connect to MySQL: ' . $e->getMessage() . "\n        fix backend/.env (or delete it and re-run), or use --skip-db");
    }
    $php = escapeshellarg(PHP_BINARY);
    if (run("$php " . escapeshellarg("$site/backend/bin/install.php"), $dry) !== 0) fail('install.php failed');
    if (run("$php " . escapeshellarg("$site/backend/bin/migrate.php"), $dry) !== 0) fail('migrate.php failed');
}

// ---------------------------------------------------------------- frontend
step('Frontend build');
if (isset($opt['skip-build'])) {
    ok('skipped (--skip-build)');
} else {
    if (trim((string)shell_exec('command -v npm')) === '') {
        is_file("$pub/index.html")
            ? warn('npm not found - keeping the existing public/index.html')
            : fail("npm not found and public/index.html is missing.\n        install Node 18+ (curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt install -y nodejs) or build locally and upload public/index.html + public/assets/");
    } else {
        $fe = escapeshellarg("$site/frontend");
        $inst = is_file("$site/frontend/package-lock.json") ? 'npm ci' : 'npm install';
        if (run("cd $fe && $inst --no-audit --no-fund && npm run build", $dry) !== 0) fail('frontend build failed');
    }
}
if (!$dry && !is_file("$pub/index.html")) fail('public/index.html still missing after build');
ok('public/index.html present');

// ---------------------------------------------------------------- nginx vhost
step('Nginx vhost');
$vhost = "/etc/nginx/sites-enabled/$domain.conf";
if (!is_file($vhost)) fail("$vhost not found - create the site in CloudPanel (Add Site -> PHP Site) first");
$old = file_get_contents($vhost);
$new = patch_vhost($old, $site, $pub);
if ($new === $old) {
    ok('already configured');
} else {
    put($vhost, $new, $dry);
    if (!$dry) {
        exec('nginx -t 2>&1', $o, $rc);
        if ($rc !== 0) {
            copy("$vhost.bak", $vhost);
            fail("nginx -t failed, original vhost restored:\n" . implode("\n", $o));
        }
        ok('nginx -t passed');
        run('systemctl reload nginx', $dry) === 0 ? ok('nginx reloaded') : warn('reload failed - run: systemctl reload nginx');
    }
}

// ---------------------------------------------------------------- CloudPanel DB
// Keeps CloudPanel's own record in sync so saving the site in its UI later doesn't undo the above.
step('CloudPanel site record');
if (isset($opt['skip-clp-db'])) {
    ok('skipped (--skip-clp-db)');
} elseif (!is_file(CLP_DB)) {
    warn(CLP_DB . ' not found - set Root Directory to "' . basename($site) . '/public" in CloudPanel by hand');
} elseif (!extension_loaded('pdo_sqlite')) {
    warn('pdo_sqlite missing - in CloudPanel set Sites -> ' . $domain . ' -> Settings -> Root Directory to "' . basename($site) . '/public"');
} else {
    $clp = new PDO('sqlite:' . CLP_DB, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $cols = array_column($clp->query('PRAGMA table_info(site)')->fetchAll(PDO::FETCH_ASSOC), 'name');
    $row = in_array('domain_name', $cols, true)
        ? $clp->query('SELECT * FROM site WHERE domain_name = ' . $clp->quote($domain))->fetch(PDO::FETCH_ASSOC) : false;
    if (!$row) {
        warn("site $domain not found in CloudPanel DB - set Root Directory to \"" . basename($site) . '/public" in the UI');
    } else {
        $set = [];
        if (isset($row['root_directory']) && !str_ends_with(rtrim($row['root_directory'], '/'), '/public')) {
            $set['root_directory'] = rtrim($row['root_directory'], '/') . '/public';
        }
        if (isset($row['vhost_template'])) {
            $t = patch_vhost((string)$row['vhost_template'], $site, $pub);
            if ($t !== $row['vhost_template']) $set['vhost_template'] = $t;
        }
        if (!$set) {
            ok('already in sync');
        } elseif ($dry) {
            ok('(dry-run) would update: ' . implode(', ', array_keys($set)));
        } else {
            copy(CLP_DB, CLP_DB . '.bak');
            $sql = 'UPDATE site SET ' . implode(', ', array_map(fn($k) => "$k = ?", array_keys($set))) . ' WHERE domain_name = ?';
            $clp->prepare($sql)->execute([...array_values($set), $domain]);
            ok('updated ' . implode(', ', array_keys($set)) . ' (backup: ' . CLP_DB . '.bak)');
        }
    }
}

// ---------------------------------------------------------------- permissions
step('Permissions');
if (run('chown -R ' . escapeshellarg("$user:$user") . ' ' . escapeshellarg($site), $dry) !== 0) warn('chown failed');
if (!$dry) { @chmod($envFile, 0640); }
ok("owner $user, backend/.env 0640");

// ---------------------------------------------------------------- verify
step('Verify');
if ($dry) { ok('(dry-run) skipped'); exit; }
function probe(string $url, string $host): string
{
    $ctx = stream_context_create(['http' => ['method' => 'GET', 'header' => "Host: $host\r\n", 'follow_location' => 0, 'timeout' => 8, 'ignore_errors' => true],
                                  'ssl' => ['verify_peer' => false, 'verify_peer_name' => false, 'peer_name' => $host]]);
    $h = @get_headers($url, false, $ctx);
    return $h ? $h[0] : 'unreachable';
}
$bad = 0;
foreach (['/' => '200', '/favicon.ico' => '200', '/apply.html' => '200', '/api/session' => '200', '/backend/.env' => '', '/.git/HEAD' => ''] as $p => $want) {
    $r = probe("https://127.0.0.1$p", $domain);
    $code = preg_match('/\s(\d{3})\s/', $r . ' ', $m) ? $m[1] : '???';
    $good = $want !== '' ? $code === $want : $code !== '200';
    if (!$good) $bad++;
    echo '  ' . ($good ? 'ok   ' : 'FAIL ') . ' ' . str_pad($p, 16) . $r . "\n";
}
echo $bad
    ? "\n$bad check(s) failed. Look at: tail -n 30 /home/$user/logs/nginx/error.log\n"
    : "\nAll good - https://$domain/ is ready.\n";
