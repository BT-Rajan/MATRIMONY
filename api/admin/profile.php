<?php
declare(strict_types=1);
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/helpers.php';
require_once __DIR__ . '/../lib/session.php';
require_once __DIR__ . '/../lib/upload.php';

apply_cors();
$pdo = db();
require_admin();

$id = (int) ($_GET['id'] ?? $_POST['id'] ?? 0);
if (!$id) {
    fail('id தேவை', 422);
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $stmt = $pdo->prepare('SELECT * FROM profiles WHERE id = :id');
    $stmt->execute(['id' => $id]);
    $profile = $stmt->fetch();
    if (!$profile) {
        fail('சுயவிவரம் கிடைக்கவில்லை', 404);
    }
    json_out(['ok' => true, 'profile' => $profile]);
}

if ($method === 'POST') {
    $in = $_POST;

    // Admin can edit every field, including identity fields and status.
    $editable = [
        'name', 'gender', 'dob', 'email', 'phone1', 'phone2', 'gothram', 'address', 'quarter',
        'height_cm', 'education', 'occupation', 'father_name', 'mother_name', 'star', 'rasi',
        'native_place', 'residence', 'registrar_name', 'brothers', 'sisters', 'participating',
        'payment_amount', 'payment_date', 'payment_reference', 'status',
    ];

    if (isset($in['status']) && !in_array($in['status'], ['pending', 'approved', 'rejected'], true)) {
        fail('தவறான நிலை', 422);
    }
    if (isset($in['gender']) && !in_array($in['gender'], ['bride', 'groom'], true)) {
        fail('தவறான பாலினம்', 422);
    }
    if (isset($in['email']) && !filter_var($in['email'], FILTER_VALIDATE_EMAIL)) {
        fail('சரியான மின்னஞ்சல் தேவை', 422);
    }

    $set = [];
    $params = ['id' => $id];
    foreach ($editable as $field) {
        if (array_key_exists($field, $in)) {
            $value = trim((string) $in[$field]);
            $set[] = "{$field} = :{$field}";
            $params[$field] = $value === '' ? null : ($field === 'email' ? strtolower($value) : $value);
        }
    }

    if (!empty($_FILES['payment_proof']) && ($_FILES['payment_proof']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
        try {
            $params['payment_proof_path'] = store_payment_proof($_FILES['payment_proof']);
            $set[] = 'payment_proof_path = :payment_proof_path';
        } catch (UploadException $e) {
            fail($e->getMessage(), 422, ['payment_proof' => $e->getMessage()]);
        }
    }

    if (!$set) {
        fail('புதுப்பிக்க எதுவும் இல்லை', 422);
    }

    $sql = 'UPDATE profiles SET ' . implode(', ', $set) . ' WHERE id = :id';
    $pdo->prepare($sql)->execute($params);

    json_out(['ok' => true, 'message' => 'சுயவிவரம் புதுப்பிக்கப்பட்டது']);
}

fail('அனுமதிக்கப்படாத முறை', 405);
