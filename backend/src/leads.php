<?php
declare(strict_types=1);

const LEAD_SOURCES = ['porur', 'trichy', 'mayiladuthurai', 'others'];
const LEAD_SALUTATIONS = ['Mr', 'Ms.'];
const LEAD_SORT = [
    'lead_no' => 'l.lead_no',
    'name' => 'l.name',
    'source' => 'l.source',
    'phone1' => 'l.phone1',
    'created_at' => 'l.created_at',
    'updated_at' => 'l.updated_at',
];
const LEAD_COLS = 'l.id, l.lead_no, l.source, l.source_id, l.salutation, l.name, l.phone1, l.phone2, l.comment,
    l.created_at, l.updated_at, cu.name AS created_by_name, uu.name AS updated_by_name';
const LEAD_JOINS = ' FROM leads l
    LEFT JOIN users cu ON cu.id = l.created_by
    LEFT JOIN users uu ON uu.id = l.updated_by';

function lead_phone(string $v): string
{
    return preg_replace('/\s+/', ' ', $v) ?? '';
}

function lead_input(array $in): array
{
    $e = [];

    $salutation = (string)($in['salutation'] ?? '');
    if (!in_array($salutation, LEAD_SALUTATIONS, true)) $e['salutation'] = $salutation === '' ? 'required' : 'invalid';

    $source = (string)($in['source'] ?? '');
    if (!in_array($source, LEAD_SOURCES, true)) $e['source'] = $source === '' ? 'required' : 'invalid';

    $name = clean_str($in['name'] ?? '');
    if ($name === '') $e['name'] = 'required';
    elseif (mb_strlen($name) > 120) $e['name'] = 'too_long';

    $sourceId = clean_str($in['source_id'] ?? '');
    if (mb_strlen($sourceId) > 60) $e['source_id'] = 'too_long';

    $phone1 = lead_phone(clean_str($in['phone1'] ?? ''));
    if ($phone1 === '') $e['phone1'] = 'required';
    elseif (!preg_match('/^\+?[0-9 -]{7,20}$/', $phone1)) $e['phone1'] = 'invalid';

    $phone2 = lead_phone(clean_str($in['phone2'] ?? ''));
    if ($phone2 !== '' && !preg_match('/^\+?[0-9 -]{7,20}$/', $phone2)) $e['phone2'] = 'invalid';

    $comment = trim((string)($in['comment'] ?? ''));
    $comment = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $comment) ?? '';
    if (mb_strlen($comment) > 2000) $e['comment'] = 'too_long';

    return [[
        'salutation' => $salutation,
        'source' => $source,
        'source_id' => $sourceId !== '' ? $sourceId : null,
        'name' => $name,
        'phone1' => $phone1,
        'phone2' => $phone2 !== '' ? $phone2 : null,
        'comment' => $comment !== '' ? $comment : null,
    ], $e];
}

function lead_find(int $id): array
{
    $st = db()->prepare('SELECT ' . LEAD_COLS . LEAD_JOINS . ' WHERE l.id = ? AND l.deleted_at IS NULL');
    $st->execute([$id]);
    $row = $st->fetch();
    if (!$row) fail(404, 'not_found');
    return $row;
}

function h_lead_list(): void
{
    require_user();
    $where = ['l.deleted_at IS NULL'];
    $args = [];

    $source = (string)($_GET['source'] ?? '');
    if (in_array($source, LEAD_SOURCES, true)) {
        $where[] = 'l.source = ?';
        $args[] = $source;
    }

    $q = clean_str($_GET['q'] ?? '');
    if ($q !== '') {
        $like = '%' . like_escape(mb_substr($q, 0, 60)) . '%';
        $where[] = '(l.lead_no LIKE ? OR l.name LIKE ? OR l.phone1 LIKE ? OR l.phone2 LIKE ? OR l.source_id LIKE ?)';
        array_push($args, $like, $like, $like, $like, $like);
    }
    $w = ' WHERE ' . implode(' AND ', $where);

    $sortKey = (string)($_GET['sort'] ?? 'created_at');
    $sort = LEAD_SORT[$sortKey] ?? LEAD_SORT['created_at'];
    $dir = strtolower((string)($_GET['dir'] ?? 'desc')) === 'asc' ? 'ASC' : 'DESC';

    $per = 20;
    $page = max(1, (int)($_GET['page'] ?? 1));
    $off = ($page - 1) * $per;

    $c = db()->prepare('SELECT COUNT(*)' . LEAD_JOINS . $w);
    $c->execute($args);
    $total = (int)$c->fetchColumn();

    $st = db()->prepare('SELECT ' . LEAD_COLS . LEAD_JOINS . $w
        . " ORDER BY $sort $dir, l.id $dir LIMIT $per OFFSET $off");
    $st->execute($args);

    out(['items' => $st->fetchAll(), 'total' => $total, 'page' => $page, 'per' => $per]);
}

function h_lead_get(int $id): void
{
    require_user();
    out(lead_find($id));
}

function h_lead_create(): void
{
    $me = require_user();
    [$d, $e] = lead_input(body());
    if ($e) fail(422, 'validation', $e);

    $pdo = db();
    $pdo->beginTransaction();
    try {
        $pdo->prepare('INSERT INTO leads (salutation, source, source_id, name, phone1, phone2, comment, created_by, updated_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
            ->execute([$d['salutation'], $d['source'], $d['source_id'], $d['name'], $d['phone1'], $d['phone2'], $d['comment'], $me['id'], $me['id']]);
        $id = (int)$pdo->lastInsertId();
        $leadNo = sprintf('LD%06d', $id);
        $pdo->prepare('UPDATE leads SET lead_no = ? WHERE id = ?')->execute([$leadNo, $id]);
        $pdo->commit();
    } catch (Throwable $x) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $x;
    }
    out(['id' => $id, 'lead_no' => $leadNo], 201);
}

function h_lead_update(int $id): void
{
    $me = require_user();
    lead_find($id);
    [$d, $e] = lead_input(body());
    if ($e) fail(422, 'validation', $e);

    db()->prepare('UPDATE leads SET salutation = ?, source = ?, source_id = ?, name = ?, phone1 = ?, phone2 = ?, comment = ?, updated_by = ?
        WHERE id = ? AND deleted_at IS NULL')
        ->execute([$d['salutation'], $d['source'], $d['source_id'], $d['name'], $d['phone1'], $d['phone2'], $d['comment'], $me['id'], $id]);
    out(['ok' => true]);
}

/** Soft delete: the row is kept with deleted_at/deleted_by set and is hidden from every read. */
function h_lead_delete(int $id): void
{
    $me = require_user();
    $st = db()->prepare('UPDATE leads SET deleted_at = ?, deleted_by = ? WHERE id = ? AND deleted_at IS NULL');
    $st->execute([now(), $me['id'], $id]);
    if ($st->rowCount() === 0) fail(404, 'not_found');
    out(['ok' => true]);
}

/* ---------- CSV import ---------- */

const LEAD_IMPORT_MAX_ROWS = 1000;
const LEAD_IMPORT_REQUIRED = ['salutation', 'source', 'name', 'phone1'];

// Accept "Mr", "mr", "Ms", "Ms." etc. and return the stored form.
function lead_norm_salutation(string $v): string
{
    $k = strtolower(rtrim(trim($v), '.'));
    return $k === 'mr' ? 'Mr' : ($k === 'ms' ? 'Ms.' : trim($v));
}

/**
 * Import leads from CSV text (sent as JSON {csv}). All rows are validated first;
 * if any row fails, nothing is written and every error is returned keyed by row.
 */
function h_lead_import(): void
{
    $me = require_user();
    $csv = (string)(body()['csv'] ?? '');
    $csv = preg_replace('/^\xEF\xBB\xBF/', '', $csv) ?? $csv; // strip UTF-8 BOM from Excel exports
    if (trim($csv) === '') fail(422, 'import_empty');

    $fh = fopen('php://memory', 'r+');
    fwrite($fh, $csv);
    rewind($fh);

    $header = fgetcsv($fh);
    if ($header === false || $header === [null]) fail(422, 'bad_header');
    $cols = array_map(fn($h) => strtolower(trim((string)$h)), $header);
    $missing = array_values(array_diff(LEAD_IMPORT_REQUIRED, $cols));
    if ($missing) fail(422, 'bad_header', ['columns' => 'missing: ' . implode(', ', $missing)]);

    $rows = [];
    $errors = [];
    $line = 1;
    while (($r = fgetcsv($fh)) !== false) {
        $line++;
        if ($r === [null] || trim(implode('', array_map('strval', $r))) === '') continue; // blank line
        if (count($rows) >= LEAD_IMPORT_MAX_ROWS) fail(422, 'too_many_rows');

        $in = [];
        foreach ($cols as $i => $c) {
            if ($c !== '') $in[$c] = (string)($r[$i] ?? '');
        }
        $in['salutation'] = lead_norm_salutation($in['salutation'] ?? '');
        $in['source'] = strtolower(trim($in['source'] ?? ''));

        [$d, $e] = lead_input($in);
        foreach ($e as $field => $code) $errors["Row $line · $field"] = $code;
        if (!$e) $rows[] = $d;
    }
    fclose($fh);

    if ($errors) fail(422, 'validation', $errors);
    if (!$rows) fail(422, 'import_empty');

    $pdo = db();
    $pdo->beginTransaction();
    try {
        $ins = $pdo->prepare('INSERT INTO leads (salutation, source, source_id, name, phone1, phone2, comment, created_by, updated_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $num = $pdo->prepare('UPDATE leads SET lead_no = ? WHERE id = ?');
        foreach ($rows as $d) {
            $ins->execute([$d['salutation'], $d['source'], $d['source_id'], $d['name'], $d['phone1'], $d['phone2'], $d['comment'], $me['id'], $me['id']]);
            $id = (int)$pdo->lastInsertId();
            $num->execute([sprintf('LD%06d', $id), $id]);
        }
        $pdo->commit();
    } catch (Throwable $x) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $x;
    }
    out(['inserted' => count($rows)], 201);
}
