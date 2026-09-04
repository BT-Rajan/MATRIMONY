<?php
declare(strict_types=1);
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/helpers.php';
require_once __DIR__ . '/../lib/session.php';

apply_cors();
$pdo = db();
require_admin();

$q = trim($_GET['q'] ?? '');
$gender = $_GET['gender'] ?? '';
$status = $_GET['status'] ?? '';
$page = max(1, (int) ($_GET['page'] ?? 1));
$perPage = 20;

$where = [];
$params = [];
if ($q !== '') {
    $where[] = '(name LIKE :q1 OR registration_number LIKE :q2 OR email LIKE :q3 OR phone1 LIKE :q4)';
    $like = "%{$q}%";
    $params['q1'] = $like;
    $params['q2'] = $like;
    $params['q3'] = $like;
    $params['q4'] = $like;
}
if (in_array($gender, ['bride', 'groom'], true)) {
    $where[] = 'gender = :gender';
    $params['gender'] = $gender;
}
if (in_array($status, ['pending', 'approved', 'rejected'], true)) {
    $where[] = 'status = :status';
    $params['status'] = $status;
}
$whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

$countStmt = $pdo->prepare("SELECT COUNT(*) FROM profiles {$whereSql}");
$countStmt->execute($params);
$total = (int) $countStmt->fetchColumn();

$sql = "SELECT id, registration_number, name, gender, email, phone1, status, created_at
        FROM profiles {$whereSql} ORDER BY created_at DESC LIMIT :limit OFFSET :offset";
$stmt = $pdo->prepare($sql);
foreach ($params as $k => $v) {
    $stmt->bindValue($k, $v);
}
$stmt->bindValue('limit', $perPage, PDO::PARAM_INT);
$stmt->bindValue('offset', ($page - 1) * $perPage, PDO::PARAM_INT);
$stmt->execute();

json_out([
    'ok' => true,
    'profiles' => $stmt->fetchAll(),
    'total' => $total,
    'page' => $page,
    'per_page' => $perPage,
]);
