<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') exit(1);
require __DIR__ . '/../src/helpers.php';

$name = env('DB_NAME', 'matrimony');
$raw = new PDO('mysql:host=' . env('DB_HOST', '127.0.0.1') . ';port=' . env('DB_PORT', '3306') . ';charset=utf8mb4',
    env('DB_USER', 'root'), env('DB_PASS', ''), [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
try {
    $raw->exec('CREATE DATABASE IF NOT EXISTS `' . str_replace('`', '', $name) . '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
} catch (PDOException $e) {
    echo "Could not create database (assuming it already exists): " . $e->getMessage() . "\n";
}

foreach (array_filter(array_map('trim', explode(';', file_get_contents(__DIR__ . '/../schema.sql')))) as $sql) {
    db()->exec($sql);
}
echo "Schema ready.\n";

if ((int)db()->query("SELECT COUNT(*) FROM users WHERE role = 'admin'")->fetchColumn() > 0) {
    echo "Admin already exists.\n";
    exit;
}

function ask(string $q, bool $hidden = false): string
{
    echo $q;
    if ($hidden && DIRECTORY_SEPARATOR === '/') system('stty -echo');
    $v = trim((string)fgets(STDIN));
    if ($hidden && DIRECTORY_SEPARATOR === '/') { system('stty echo'); echo "\n"; }
    return $v;
}

$user = strtolower(ask('Admin username: '));
$full = ask('Admin name: ');
$pass = ask('Admin password (min 10 chars): ', true);
if (!preg_match('/^[a-z0-9._-]{3,30}$/', $user) || $full === '' || strlen($pass) < 10) {
    fwrite(STDERR, "Invalid input.\n");
    exit(1);
}
db()->prepare("INSERT INTO users (name, username, password_hash, role) VALUES (?, ?, ?, 'admin')")
    ->execute([$full, $user, password_hash($pass, PASSWORD_DEFAULT)]);
echo "Admin created.\n";
