<?php
declare(strict_types=1);

/* ---------- public: submit ---------- */

function h_apply(): void
{
    $in = body();
    if (!empty($in['website'])) fail(400, 'bad_request'); // honeypot

    $ip = client_ip();
    throttle_check('apply', $ip, 15, 3600);
    throttle_hit('apply', $ip);

    [$d, $e] = validate_application($in, true);
    if ($e) fail(422, 'validation', $e);

    $cols = APP_COLS;
    $sql = 'INSERT INTO applications (' . implode(', ', $cols) . ', payment_amount, terms_version, terms_accepted_at) VALUES ('
        . implode(', ', array_map(fn($c) => ':' . $c, $cols)) . ', :amount, :tv, :ta)';
    $args = [':amount' => FEE, ':tv' => TERMS_VERSION, ':ta' => now()];
    foreach ($cols as $c) $args[':' . $c] = $d[$c];

    $pdo = db();
    $pdo->beginTransaction();
    try {
        $pdo->prepare($sql)->execute($args);
        $id = (int)$pdo->lastInsertId();
        $reg = sprintf('%02d%04d', (int)date('y'), $id); // e.g. 260001 = year '26' + 4-digit sequence
        $pdo->prepare('UPDATE applications SET reg_no = ? WHERE id = ?')->execute([$reg, $id]);
        audit($id, null, 'created', null, 'pending');
        $pdo->commit();
    } catch (PDOException $x) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        if ($x->getCode() === '23000') fail(409, 'validation', ['payment_ref' => 'duplicate']);
        throw $x;
    }
    out(['reg_no' => $reg], 201);
}

/* ---------- staff ---------- */

function h_stats(): void
{
    require_user();
    $r = db()->query("SELECT COUNT(*) total,
        COALESCE(SUM(status = 'accepted'), 0) accepted,
        COALESCE(SUM(status = 'rejected'), 0) rejected,
        COALESCE(SUM(status = 'pending'), 0) pending,
        COALESCE(SUM(gender = 'male'), 0) male,
        COALESCE(SUM(gender = 'female'), 0) female
        FROM applications")->fetch();
    out(array_map('intval', $r));
}

function like_escape(string $s): string
{
    return str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $s);
}

function h_app_list(): void
{
    require_user();
    $where = [];
    $args = [];

    $status = $_GET['status'] ?? '';
    if (in_array($status, ['pending', 'accepted', 'rejected'], true)) {
        $where[] = 'status = ?';
        $args[] = $status;
    }
    $q = clean_str($_GET['q'] ?? '');
    if ($q !== '') {
        $like = '%' . like_escape(mb_substr($q, 0, 60)) . '%';
        $where[] = '(reg_no LIKE ? OR full_name LIKE ? OR phone LIKE ? OR payment_ref LIKE ?)';
        array_push($args, $like, $like, $like, $like);
    }
    $w = $where ? ' WHERE ' . implode(' AND ', $where) : '';

    $per = 20;
    $page = max(1, (int)($_GET['page'] ?? 1));
    $off = ($page - 1) * $per;

    $c = db()->prepare("SELECT COUNT(*) FROM applications$w");
    $c->execute($args);
    $total = (int)$c->fetchColumn();

    $st = db()->prepare("SELECT id, reg_no, status, gender, full_name, dob, phone, created_at FROM applications$w
        ORDER BY created_at DESC, id DESC LIMIT $per OFFSET $off");
    $st->execute($args);
    out(['items' => $st->fetchAll(), 'total' => $total, 'page' => $page, 'per' => $per]);
}

function find_app(int $id): array
{
    $st = db()->prepare('SELECT a.*, du.name AS decided_by_name FROM applications a
        LEFT JOIN users du ON du.id = a.decided_by WHERE a.id = ?');
    $st->execute([$id]);
    return $st->fetch() ?: fail(404, 'not_found');
}

function h_app_get(int $id): void
{
    $u = require_user();
    $a = find_app($id);
    $h = db()->prepare('SELECT h.action, h.from_status, h.to_status, h.note, h.created_at, u.name AS user_name
        FROM application_history h LEFT JOIN users u ON u.id = h.user_id
        WHERE h.application_id = ? ORDER BY h.id DESC');
    $h->execute([$id]);
    $a['history'] = $h->fetchAll();
    $a['can_edit'] = $a['status'] === 'pending' || $u['role'] === 'admin';
    $a['can_reset'] = $u['role'] === 'admin';
    out($a);
}

function h_app_update(int $id): void
{
    $u = require_user();
    $a = find_app($id);
    $admin = $u['role'] === 'admin';
    if ($a['status'] !== 'pending' && !$admin) fail(403, 'locked');

    [$d, $e] = validate_application(body(), false);
    if ($e) fail(422, 'validation', $e);

    $changed = [];
    foreach (APP_COLS as $c) {
        if (($a[$c] ?? null) !== $d[$c]) $changed[] = $c;
    }
    if (!$changed) out(['ok' => true]);

    $set = implode(', ', array_map(fn($c) => "$c = :$c", APP_COLS));
    $args = [':uid' => $u['id'], ':id' => $id, ':adm' => $admin ? 1 : 0];
    foreach (APP_COLS as $c) $args[':' . $c] = $d[$c];

    try {
        $st = db()->prepare("UPDATE applications SET $set, updated_by = :uid WHERE id = :id AND (status = 'pending' OR :adm = 1)");
        $st->execute($args);
    } catch (PDOException $x) {
        if ($x->getCode() === '23000') fail(409, 'validation', ['payment_ref' => 'duplicate']);
        throw $x;
    }
    if ($st->rowCount() === 0) fail(403, 'locked');
    audit($id, $u['id'], 'edited', null, null, implode(',', $changed));
    out(['ok' => true]);
}

function h_app_decide(int $id): void
{
    $u = require_user();
    $a = find_app($id);
    $in = body();

    $to = $in['status'] ?? '';
    if (!in_array($to, ['accepted', 'rejected', 'pending'], true)) fail(422, 'validation', ['status' => 'invalid']);
    $note = clean_str($in['note'] ?? '');
    if (mb_strlen($note) > 500) fail(422, 'validation', ['note' => 'too_long']);

    if ($to === $a['status']) fail(409, 'no_change');
    $admin = $u['role'] === 'admin';
    if (!$admin && ($a['status'] !== 'pending' || $to === 'pending')) fail(403, 'locked');
    if ($to === 'rejected' && mb_strlen($note) < 3) fail(422, 'validation', ['note' => 'required']);

    $pending = $to === 'pending';
    $st = db()->prepare('UPDATE applications SET status = ?, decided_by = ?, decided_at = ?, decision_note = ?, updated_by = ?
        WHERE id = ? AND status = ?');
    $st->execute([$to, $pending ? null : $u['id'], $pending ? null : now(), ($pending || $note === '') ? null : $note, $u['id'], $id, $a['status']]);
    if ($st->rowCount() === 0) fail(409, 'conflict');

    audit($id, $u['id'], 'decision', $a['status'], $to, $note === '' ? null : $note);
    out(['ok' => true]);
}
