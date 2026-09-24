<?php
declare(strict_types=1);

function h_session(): void
{
    out(['user' => current_user(), 'csrf' => csrf_token()]);
}

function h_login(): void
{
    $in = body();
    $username = strtolower(clean_str($in['username'] ?? ''));
    $password = is_string($in['password'] ?? null) ? $in['password'] : '';
    $ip = client_ip();

    throttle_check('login_ip', $ip, 20, 900);
    throttle_check('login_user', $username, 6, 900);

    $st = db()->prepare('SELECT id, name, username, role, is_active, password_hash FROM users WHERE username = ?');
    $st->execute([$username]);
    $row = $st->fetch();

    $hash = $row['password_hash'] ?? password_hash('dummy-password', PASSWORD_DEFAULT);
    $ok = password_verify($password, $hash) && $row && (int)$row['is_active'] === 1;
    if (!$ok) {
        throttle_hit('login_ip', $ip);
        throttle_hit('login_user', $username);
        fail(401, 'invalid_credentials');
    }

    start_session();
    session_regenerate_id(true);
    $_SESSION['uid'] = (int)$row['id'];
    $_SESSION['csrf'] = bin2hex(random_bytes(32));

    if (password_needs_rehash($row['password_hash'], PASSWORD_DEFAULT)) {
        db()->prepare('UPDATE users SET password_hash = ? WHERE id = ?')->execute([password_hash($password, PASSWORD_DEFAULT), $row['id']]);
    }
    db()->prepare('UPDATE users SET last_login_at = ? WHERE id = ?')->execute([now(), $row['id']]);

    out([
        'user' => ['id' => (int)$row['id'], 'name' => $row['name'], 'username' => $row['username'], 'role' => $row['role']],
        'csrf' => $_SESSION['csrf'],
    ]);
}

function h_logout(): void
{
    start_session();
    reset_session();
    out(['ok' => true, 'csrf' => csrf_token()]);
}
