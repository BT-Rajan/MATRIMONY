<?php
declare(strict_types=1);
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/helpers.php';
require_once __DIR__ . '/../lib/session.php';

$pdo = db();
require_admin();

$gender = $_GET['gender'] ?? '';
$status = $_GET['status'] ?? '';
$where = [];
$params = [];
if (in_array($gender, ['bride', 'groom'], true)) {
    $where[] = 'gender = :gender';
    $params['gender'] = $gender;
}
if (in_array($status, ['pending', 'approved', 'rejected'], true)) {
    $where[] = 'status = :status';
    $params['status'] = $status;
}
$whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

if (($_GET['format'] ?? '') === 'csv') {
    $stmt = $pdo->prepare("SELECT registration_number, name, gender, dob, email, phone1, status,
        education, occupation, native_place, payment_amount, created_at
        FROM profiles {$whereSql} ORDER BY created_at DESC");
    $stmt->execute($params);

    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="matrimony-report.csv"');
    echo "\xEF\xBB\xBF"; // UTF-8 BOM so Tamil text opens correctly in Excel
    $out = fopen('php://output', 'w');
    fputcsv($out, ['Reg No', 'Name', 'Gender', 'DOB', 'Email', 'Phone', 'Status', 'Education', 'Occupation', 'Native Place', 'Payment', 'Registered On']);
    foreach ($stmt as $row) {
        fputcsv($out, $row);
    }
    fclose($out);
    exit;
}

apply_cors();

$summaryStmt = $pdo->query('SELECT gender, status, COUNT(*) AS c FROM profiles GROUP BY gender, status');
$summary = ['bride' => ['pending' => 0, 'approved' => 0, 'rejected' => 0, 'total' => 0],
            'groom' => ['pending' => 0, 'approved' => 0, 'rejected' => 0, 'total' => 0]];
foreach ($summaryStmt as $row) {
    $summary[$row['gender']][$row['status']] = (int) $row['c'];
    $summary[$row['gender']]['total'] += (int) $row['c'];
}

$stmt = $pdo->prepare("SELECT id, registration_number, name, gender, email, phone1, status, created_at
    FROM profiles {$whereSql} ORDER BY created_at DESC");
$stmt->execute($params);

json_out(['ok' => true, 'summary' => $summary, 'profiles' => $stmt->fetchAll()]);
