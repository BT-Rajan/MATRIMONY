<?php
declare(strict_types=1);

const USER_COLS = 'id, name, username, role, is_active, last_login_at, created_at';

function user_input(array $in, bool $create): array
{
    $e = [];
    $name = clean_str($in['name'] ?? '');
    if ($name === '') $e['name'] = 'required';
    elseif (mb_strlen($name) > 120) $e['name'] = 'too_long';

    $username = strtolower(clean_str($in['username'] ?? ''));
    if ($create && !preg_match('/^[a-z0-9._-]{3,30}$/', $username)) $e['username'] = $username === '' ? 'required' : 'invalid';

    $role = $in['role'] ?? '';
    if (!in_array($role, ['admin', 'manager'], true)) $e['role'] = 'invalid';

    $active = isset($in['is_active']) ? (int)(bool)$in['is_active'] : 1;

    $pass = is_string($in['password'] ?? null) ? $in['password'] : '';
    if ($create || $pass !== '') {
        if ($pass === '') $e['password'] = 'required';
        elseif (mb_strlen($pass) < 10 || mb_strlen($pass) > 200 || strtolower($pass) === $username) $e['password'] = 'weak';
    }
    return [compact('name', 'username', 'role', 'active', 'pass'), $e];
}

function h_users_list(): void
{
    require_user('admin');
    out(['items' => db()->query('SELECT ' . USER_COLS . ' FROM users ORDER BY name')->fetchAll()]);
}

function h_user_create(): void
{
    require_user('admin');
    [$d, $e] = user_input(body(), true);
    if ($e) fail(422, 'validation', $e);
    try {
        db()->prepare('INSERT INTO users (name, username, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?)')
            ->execute([$d['name'], $d['username'], password_hash($d['pass'], PASSWORD_DEFAULT), $d['role'], $d['active']]);
    } catch (PDOException $x) {
        if ($x->getCode() === '23000') fail(409, 'validation', ['username' => 'duplicate']);
        throw $x;
    }
    out(['id' => (int)db()->lastInsertId()], 201);
}

function h_user_update(int $id): void
{
    $me = require_user('admin');
    [$d, $e] = user_input(body(), false);
    if ($e) fail(422, 'validation', $e);
    if ($id === $me['id'] && ($d['role'] !== 'admin' || !$d['active'])) fail(403, 'self_protect');

    $sql = 'UPDATE users SET name = ?, role = ?, is_active = ?';
    $args = [$d['name'], $d['role'], $d['active']];
    if ($d['pass'] !== '') {
        $sql .= ', password_hash = ?';
        $args[] = password_hash($d['pass'], PASSWORD_DEFAULT);
    }
    $args[] = $id;
    $st = db()->prepare($sql . ' WHERE id = ?');
    $st->execute($args);
    if ($st->rowCount() === 0) fail(404, 'not_found');
    out(['ok' => true]);
}

function h_user_delete(int $id): void
{
    $me = require_user('admin');
    if ($id === $me['id']) fail(403, 'self_protect');
    $st = db()->prepare('DELETE FROM users WHERE id = ?');
    $st->execute([$id]);
    if ($st->rowCount() === 0) fail(404, 'not_found');
    out(['ok' => true]);
}
