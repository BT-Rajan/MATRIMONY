<?php
declare(strict_types=1);
require_once __DIR__ . '/lib/db.php';
require_once __DIR__ . '/lib/helpers.php';

apply_cors();
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    fail('POST முறை தேவை', 405);
}

$in = input();
$email = strtolower(trim($in['email'] ?? ''));
$otp = trim($in['otp'] ?? '');
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || !preg_match('/^\d{6}$/', $otp)) {
    fail('சரியான OTP தேவை', 422);
}

$pdo = db();
$stmt = $pdo->prepare(
    'SELECT id FROM otp_codes
     WHERE email = :e AND otp_hash = :h AND used = 0 AND expires_at > NOW()
     ORDER BY id DESC LIMIT 1'
);
$stmt->execute(['e' => $email, 'h' => hash('sha256', $otp)]);
$otpRow = $stmt->fetch();
if (!$otpRow) {
    fail('தவறான அல்லது காலாவதியான OTP', 422);
}

$profileStmt = $pdo->prepare('SELECT id FROM profiles WHERE email = :e');
$profileStmt->execute(['e' => $email]);
$profile = $profileStmt->fetch();
if (!$profile) {
    fail('சுயவிவரம் கிடைக்கவில்லை', 404);
}

$pdo->prepare('UPDATE otp_codes SET used = 1 WHERE id = :id')->execute(['id' => $otpRow['id']]);

$token = random_token();
$pdo->prepare('INSERT INTO edit_sessions (token, profile_id, expires_at) VALUES (:t, :p, :exp)')
    ->execute([
        't' => $token,
        'p' => $profile['id'],
        'exp' => date('Y-m-d H:i:s', time() + 30 * 60), // 30-minute edit session
    ]);

json_out(['ok' => true, 'edit_token' => $token]);
