<?php
declare(strict_types=1);

/** Returns the profile_id for a valid, unexpired edit token, or fails the request. */
function require_edit_session(PDO $pdo): int
{
    $token = $_SERVER['HTTP_X_EDIT_TOKEN'] ?? ($_POST['edit_token'] ?? '');
    if (!$token) {
        fail('திருத்த அமர்வு தேவை', 401);
    }
    $stmt = $pdo->prepare('SELECT profile_id FROM edit_sessions WHERE token = :t AND expires_at > NOW()');
    $stmt->execute(['t' => $token]);
    $row = $stmt->fetch();
    if (!$row) {
        fail('அமர்வு காலாவதியானது, மீண்டும் OTP பெறவும்', 401);
    }
    return (int) $row['profile_id'];
}

/** Starts (or resumes) a PHP session and returns the logged-in admin id, or fails. */
function require_admin(): int
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }
    if (empty($_SESSION['admin_id'])) {
        fail('நிர்வாக உள்நுழைவு தேவை', 401);
    }
    return (int) $_SESSION['admin_id'];
}
