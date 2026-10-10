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

    $dup = db()->prepare("SELECT id FROM applications WHERE phone = ? AND status <> 'rejected' LIMIT 1");
    $dup->execute([$d['phone']]);
    if ($dup->fetch()) fail(409, 'validation', ['phone' => 'duplicate']);

    $cols = APP_COLS;
    $sql = 'INSERT INTO applications (' . implode(', ', $cols) . ', terms_version, terms_accepted_at) VALUES ('
        . implode(', ', array_map(fn($c) => ':' . $c, $cols)) . ', :tv, :ta)';
    $args = [':tv' => TERMS_VERSION, ':ta' => now()];
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
    $u = require_user();
    $st = db()->prepare("SELECT COUNT(*) total,
        COALESCE(SUM(status = 'accepted'), 0) accepted,
        COALESCE(SUM(status = 'rejected'), 0) rejected,
        COALESCE(SUM(status = 'pending'), 0) pending,
        COALESCE(SUM(gender = 'male'), 0) male,
        COALESCE(SUM(gender = 'female'), 0) female,
        COALESCE(SUM(status = 'pending' AND assigned_to IS NULL), 0) unassigned,
        COALESCE(SUM(status = 'pending' AND assigned_to = ?), 0) mine
        FROM applications");
    $st->execute([$u['id']]);
    out(array_map('intval', $st->fetch()));
}

function like_escape(string $s): string
{
    return str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $s);
}

function h_app_list(): void
{
    $u = require_user();
    $where = [];
    $args = [];

    $status = $_GET['status'] ?? '';
    if (in_array($status, ['pending', 'accepted', 'rejected'], true)) {
        $where[] = 'a.status = ?';
        $args[] = $status;
    }
    $gender = $_GET['gender'] ?? '';
    if (in_array($gender, ['male', 'female'], true)) {
        $where[] = 'a.gender = ?';
        $args[] = $gender;
    }
    $asg = (string)($_GET['assigned'] ?? '');
    if ($asg === 'me') {
        $where[] = 'a.assigned_to = ?';
        $args[] = $u['id'];
    } elseif ($asg === 'unassigned') {
        $where[] = 'a.assigned_to IS NULL';
    } elseif ($asg !== '' && ctype_digit($asg)) {
        $where[] = 'a.assigned_to = ?';
        $args[] = (int)$asg;
    }
    $q = clean_str($_GET['q'] ?? '');
    if ($q !== '') {
        $like = '%' . like_escape(mb_substr($q, 0, 60)) . '%';
        $where[] = '(a.reg_no LIKE ? OR a.full_name LIKE ? OR a.phone LIKE ? OR a.payment_ref LIKE ?)';
        array_push($args, $like, $like, $like, $like);
    }
    $w = $where ? ' WHERE ' . implode(' AND ', $where) : '';

    $per = 20;
    $page = max(1, (int)($_GET['page'] ?? 1));
    $off = ($page - 1) * $per;

    $c = db()->prepare("SELECT COUNT(*) FROM applications a$w");
    $c->execute($args);
    $total = (int)$c->fetchColumn();

    $st = db()->prepare("SELECT a.id, a.reg_no, a.status, a.gender, a.full_name, a.dob, a.phone, a.created_at,
        a.assigned_to, au.name AS assigned_to_name
        FROM applications a LEFT JOIN users au ON au.id = a.assigned_to$w
        ORDER BY a.created_at DESC, a.id DESC LIMIT $per OFFSET $off");
    $st->execute($args);
    out(['items' => $st->fetchAll(), 'total' => $total, 'page' => $page, 'per' => $per]);
}

function find_app(int $id): array
{
    $st = db()->prepare('SELECT a.*, du.name AS decided_by_name, au.name AS assigned_to_name, bu.name AS assigned_by_name
        FROM applications a
        LEFT JOIN users du ON du.id = a.decided_by
        LEFT JOIN users au ON au.id = a.assigned_to
        LEFT JOIN users bu ON bu.id = a.assigned_by WHERE a.id = ?');
    $st->execute([$id]);
    return $st->fetch() ?: fail(404, 'not_found');
}

function h_app_get(int $id): void
{
    $u = require_user();
    $a = find_app($id);
    $h = db()->prepare('SELECT h.id, h.action, h.from_status, h.to_status, h.note, h.changes, h.created_at, u.name AS user_name
        FROM application_history h LEFT JOIN users u ON u.id = h.user_id
        WHERE h.application_id = ? ORDER BY h.id DESC');
    $h->execute([$id]);
    $a['history'] = array_map(function ($r) {
        $r['changes'] = $r['changes'] ? json_decode($r['changes'], true) : null;
        return $r;
    }, $h->fetchAll());
    $a['can_edit'] = $a['status'] === 'pending' || $u['role'] === 'admin';
    $a['can_reset'] = $u['role'] === 'admin';
    $a['can_assign'] = $u['role'] === 'admin' && $a['status'] === 'pending';
    $a['can_decide'] = $u['role'] === 'admin' || ($a['status'] === 'pending' && (int)$a['assigned_to'] === $u['id']);
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

    $dup = db()->prepare("SELECT id FROM applications WHERE phone = ? AND id <> ? AND status <> 'rejected' LIMIT 1");
    $dup->execute([$d['phone'], $id]);
    if ($dup->fetch()) fail(409, 'validation', ['phone' => 'duplicate']);

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
    $diff = [];
    foreach ($changed as $c) {
        $diff[$c] = [$a[$c] === null ? null : (string)$a[$c], $d[$c] === null ? null : (string)$d[$c]];
    }
    audit($id, $u['id'], 'edited', null, null, implode(',', $changed), $diff);
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
    if (!$admin && (int)$a['assigned_to'] !== $u['id']) fail(403, 'not_assigned');
    if ($to === 'rejected' && mb_strlen($note) < 3) fail(422, 'validation', ['note' => 'required']);

    $pending = $to === 'pending';
    $st = db()->prepare('UPDATE applications SET status = ?, decided_by = ?, decided_at = ?, decision_note = ?, updated_by = ?
        WHERE id = ? AND status = ? AND (? = 1 OR assigned_to = ?)');
    $st->execute([$to, $pending ? null : $u['id'], $pending ? null : now(), ($pending || $note === '') ? null : $note, $u['id'], $id, $a['status'], $admin ? 1 : 0, $u['id']]);
    if ($st->rowCount() === 0) fail(409, 'conflict');

    audit($id, $u['id'], 'decision', $a['status'], $to, $note === '' ? null : $note);
    out(['ok' => true]);
}

/* ---------- assignment (admin) ---------- */

function active_manager(int $id): array
{
    $st = db()->prepare("SELECT id, name FROM users WHERE id = ? AND role = 'manager' AND is_active = 1");
    $st->execute([$id]);
    return $st->fetch() ?: fail(422, 'validation', ['manager_id' => 'invalid']);
}

// Assign (or reassign / unassign with manager_id = null) one pending application.
function h_app_assign(int $id): void
{
    $me = require_user('admin');
    $mid = body()['manager_id'] ?? null;
    $mgr = ($mid === null || $mid === '') ? null : active_manager((int)$mid);
    $a = find_app($id);
    if ($a['status'] !== 'pending') fail(409, 'not_pending');

    $prev = $a['assigned_to'] !== null ? (int)$a['assigned_to'] : null;
    $new = $mgr ? (int)$mgr['id'] : null;
    if ($prev === $new) fail(409, 'no_change');

    $st = db()->prepare("UPDATE applications SET assigned_to = ?, assigned_by = ?, assigned_at = ?
        WHERE id = ? AND status = 'pending' AND assigned_to <=> ?");
    $st->execute([$new, $new === null ? null : $me['id'], $new === null ? null : now(), $id, $prev]);
    if ($st->rowCount() === 0) fail(409, 'conflict');

    audit($id, $me['id'], $new === null ? 'unassigned' : 'assigned', null, null, $new === null ? $a['assigned_to_name'] : $mgr['name']);
    out(['ok' => true]);
}

// Assign the N oldest unassigned pending applications to one manager.
function h_app_assign_bulk(): void
{
    $me = require_user('admin');
    $in = body();
    $mgr = active_manager((int)($in['manager_id'] ?? 0));
    $n = $in['count'] ?? null;
    if (!is_int($n) && !(is_string($n) && ctype_digit($n))) fail(422, 'validation', ['count' => 'invalid']);
    $n = (int)$n;
    if ($n < 1 || $n > 1000) fail(422, 'validation', ['count' => 'invalid']);

    $pdo = db();
    $pdo->beginTransaction();
    try {
        $ids = $pdo->query("SELECT id FROM applications WHERE status = 'pending' AND assigned_to IS NULL
            ORDER BY created_at, id LIMIT $n FOR UPDATE")->fetchAll(PDO::FETCH_COLUMN);
        if (!$ids) fail(409, 'none_available');
        $ph = implode(',', array_fill(0, count($ids), '?'));
        $pdo->prepare("UPDATE applications SET assigned_to = ?, assigned_by = ?, assigned_at = ? WHERE id IN ($ph)")
            ->execute(array_merge([$mgr['id'], $me['id'], now()], $ids));
        foreach ($ids as $aid) audit((int)$aid, $me['id'], 'assigned', null, null, $mgr['name']);
        $pdo->commit();
    } catch (Throwable $x) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $x;
    }
    out(['assigned' => count($ids), 'requested' => $n]);
}

function h_assign_summary(): void
{
    require_user('admin');
    $un = (int)db()->query("SELECT COUNT(*) FROM applications WHERE status = 'pending' AND assigned_to IS NULL")->fetchColumn();
    $rows = db()->query("SELECT u.id, u.name, COUNT(a.id) AS pending FROM users u
        LEFT JOIN applications a ON a.assigned_to = u.id AND a.status = 'pending'
        WHERE u.role = 'manager' AND u.is_active = 1 GROUP BY u.id, u.name ORDER BY u.name")->fetchAll();
    out(['unassigned' => $un, 'managers' => array_map(
        fn($r) => ['id' => (int)$r['id'], 'name' => $r['name'], 'pending' => (int)$r['pending']], $rows)]);
}

// A disabled / demoted manager can no longer act, so their still-pending applications go back to the pool.
function release_assignments(int $userId, int $byId): void
{
    $pdo = db();
    $pdo->beginTransaction();
    try {
        $ids = $pdo->prepare("SELECT id FROM applications WHERE assigned_to = ? AND status = 'pending' FOR UPDATE");
        $ids->execute([$userId]);
        $ids = $ids->fetchAll(PDO::FETCH_COLUMN);
        if ($ids) {
            $nm = $pdo->prepare('SELECT name FROM users WHERE id = ?');
            $nm->execute([$userId]);
            $name = (string)$nm->fetchColumn();
            $pdo->prepare("UPDATE applications SET assigned_to = NULL, assigned_by = NULL, assigned_at = NULL
                WHERE assigned_to = ? AND status = 'pending'")->execute([$userId]);
            foreach ($ids as $aid) audit((int)$aid, $byId, 'unassigned', null, null, $name);
        }
        $pdo->commit();
    } catch (Throwable $x) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $x;
    }
}
