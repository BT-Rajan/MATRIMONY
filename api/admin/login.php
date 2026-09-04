<?php
declare(strict_types=1);
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/helpers.php';

apply_cors();
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    fail('POST முறை தேவை', 405);
}

$in = input();
$username = trim($in['username'] ?? '');
$password = (string) ($in['password'] ?? '');
if ($username === '' || $password === '') {
    fail('பயனர்பெயர் மற்றும் கடவுச்சொல் தேவை', 422);
}

$pdo = db();
$stmt = $pdo->prepare('SELECT id, password_hash FROM admins WHERE username = :u');
$stmt->execute(['u' => $username]);
$admin = $stmt->fetch();

if (!$admin || !password_verify($password, $admin['password_hash'])) {
    fail('தவறான பயனர்பெயர் அல்லது கடவுச்சொல்', 401);
}

session_start();
session_regenerate_id(true);
$_SESSION['admin_id'] = (int) $admin['id'];

json_out(['ok' => true]);
