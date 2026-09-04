<?php
declare(strict_types=1);
require_once __DIR__ . '/lib/db.php';
require_once __DIR__ . '/lib/helpers.php';
require_once __DIR__ . '/lib/session.php';
require_once __DIR__ . '/lib/upload.php';

apply_cors();
$pdo = db();
$profileId = require_edit_session($pdo);
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $stmt = $pdo->prepare('SELECT * FROM profiles WHERE id = :id');
    $stmt->execute(['id' => $profileId]);
    $profile = $stmt->fetch();
    if (!$profile) {
        fail('சுயவிவரம் கிடைக்கவில்லை', 404);
    }
    json_out(['ok' => true, 'profile' => $profile]);
}

if ($method === 'POST') {
    $in = $_POST;

    $editable = [
        'phone1', 'phone2', 'gothram', 'address', 'quarter', 'height_cm',
        'education', 'occupation', 'father_name', 'mother_name', 'star', 'rasi',
        'native_place', 'residence', 'registrar_name', 'brothers', 'sisters',
        'participating', 'payment_amount', 'payment_date', 'payment_reference',
    ];
    // name/dob/gender/email/registration_number are intentionally not editable
    // here — identity fields changing should go through admin, not self-service.

    $errors = [];
    if (isset($in['phone1']) && !preg_match('/^[6-9]\d{9}$/', $in['phone1'])) {
        $errors['phone1'] = 'சரியான மொபைல் எண் தேவை';
    }
    if (!empty($in['phone2']) && !preg_match('/^[6-9]\d{9}$/', $in['phone2'])) {
        $errors['phone2'] = 'சரியான மொபைல் எண் தேவை';
    }
    if (isset($in['height_cm']) && (!ctype_digit((string) $in['height_cm']) || (int) $in['height_cm'] < 100 || (int) $in['height_cm'] > 250)) {
        $errors['height_cm'] = 'சரியான உயரம் தேவை';
    }
    if (isset($in['participating']) && !in_array($in['participating'], ['yes', 'no'], true)) {
        $errors['participating'] = 'இந்த புலம் தேவை';
    }
    if ($errors) {
        fail('சரிபார்ப்பு தோல்வியடைந்தது', 422, $errors);
    }

    $set = [];
    $params = ['id' => $profileId];
    foreach ($editable as $field) {
        if (array_key_exists($field, $in)) {
            $value = trim((string) $in[$field]);
            $set[] = "{$field} = :{$field}";
            $params[$field] = $value === '' ? null : $value;
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
