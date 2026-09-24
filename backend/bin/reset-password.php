<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') exit(1);
require __DIR__ . '/../src/helpers.php';

$username = strtolower(trim($argv[1] ?? ''));
if ($username === '') {
    echo "Usage: php backend/bin/reset-password.php <username>\nUsers:\n";
    foreach (db()->query('SELECT username, role, is_active FROM users ORDER BY role, username') as $u) {
        echo "  {$u['username']} ({$u['role']})" . ($u['is_active'] ? '' : ' [disabled]') . "\n";
    }
    exit(1);
}

$st = db()->prepare('SELECT id, is_active FROM users WHERE username = ?');
$st->execute([$username]);
$u = $st->fetch();
if (!$u) { fwrite(STDERR, "No such user.\n"); exit(1); }

function ask(string $q): string
{
    echo $q;
    $tty = DIRECTORY_SEPARATOR === '/' && function_exists('posix_isatty') && posix_isatty(STDIN);
    if ($tty) system('stty -echo');
    $v = rtrim((string)fgets(STDIN), "\r\n");
    if ($tty) { system('stty echo'); echo "\n"; }
    return $v;
}

$p1 = ask('New password (min 10 chars): ');
if (strlen($p1) < 10 || strtolower($p1) === $username) { fwrite(STDERR, "Password too weak.\n"); exit(1); }
if ($p1 !== ask('Repeat password: ')) { fwrite(STDERR, "Passwords do not match.\n"); exit(1); }

db()->prepare('UPDATE users SET password_hash = ? WHERE id = ?')->execute([password_hash($p1, PASSWORD_DEFAULT), $u['id']]);
db()->exec('DELETE FROM throttle'); // clears any login lockout
echo "Password updated for $username.\n";
if (!$u['is_active']) echo "Warning: this user is disabled; enable it from Users or SQL.\n";
