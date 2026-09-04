<?php
// One-off CLI script to create (or reset) the admin login.
// Usage: php db/seed_admin.php <username> <password>
require_once __DIR__ . '/../api/lib/db.php';

[$script, $username, $password] = array_pad($argv, 3, null);
if (!$username || !$password) {
    fwrite(STDERR, "Usage: php db/seed_admin.php <username> <password>\n");
    exit(1);
}
if (strlen($password) < 8) {
    fwrite(STDERR, "Password must be at least 8 characters.\n");
    exit(1);
}

$pdo = db();
$hash = password_hash($password, PASSWORD_DEFAULT);
$stmt = $pdo->prepare(
    'INSERT INTO admins (username, password_hash) VALUES (:u, :p)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)'
);
$stmt->execute(['u' => $username, 'p' => $hash]);

echo "Admin '{$username}' is ready.\n";
