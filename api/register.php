<?php
declare(strict_types=1);
require_once __DIR__ . '/lib/db.php';
require_once __DIR__ . '/lib/helpers.php';
require_once __DIR__ . '/lib/upload.php';
require_once __DIR__ . '/lib/mailer.php';

apply_cors();
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    fail('POST முறை தேவை', 405);
}

$in = $_POST; // multipart/form-data (file attached), so always $_POST here

$errors = require_fields($in, [
    'name' => 'பெயர்',
    'dob' => 'பிறந்த தேதி',
    'email' => 'மின்னஞ்சல்',
    'phone1' => 'மொபைல் எண்',
    'address' => 'முகவரி',
    'height_cm' => 'உயரம்',
    'education' => 'கல்வி',
    'occupation' => 'தொழில்',
    'father_name' => 'தந்தை பெயர்',
    'mother_name' => 'தாய் பெயர்',
    'star' => 'நட்சத்திரம்',
    'rasi' => 'ராசி',
    'native_place' => 'சொந்த ஊர்',
    'residence' => 'தற்போதைய இருப்பிடம்',
    'registrar_name' => 'பதிவாளர் பெயர்',
    'payment_amount' => 'கட்டண தொகை',
    'payment_date' => 'கட்டண தேதி',
    'payment_reference' => 'குறிப்பு எண்',
]);

if (!in_array($in['gender'] ?? '', ['bride', 'groom'], true)) {
    $errors['gender'] = 'பாலினம் தேவை';
}
if (empty($in['phone1']) || !preg_match('/^[6-9]\d{9}$/', $in['phone1'])) {
    $errors['phone1'] = 'சரியான மொபைல் எண் (10 இலக்கம்) தேவை';
}
if (!empty($in['phone2']) && !preg_match('/^[6-9]\d{9}$/', $in['phone2'])) {
    $errors['phone2'] = 'சரியான மொபைல் எண் தேவை';
}
if (empty($in['email']) || !filter_var($in['email'], FILTER_VALIDATE_EMAIL)) {
    $errors['email'] = 'சரியான மின்னஞ்சல் தேவை';
}
if (empty($in['height_cm']) || !ctype_digit((string) $in['height_cm']) || (int) $in['height_cm'] < 100 || (int) $in['height_cm'] > 250) {
    $errors['height_cm'] = 'சரியான உயரம் (செ.மீ.) தேவை';
}
foreach (['brothers', 'sisters'] as $f) {
    $v = $in[$f] ?? '0';
    if ($v !== '' && (!ctype_digit((string) $v) || (int) $v > 20)) {
        $errors[$f] = '0 முதல் 20 வரை இருக்க வேண்டும்';
    }
}
if (!in_array($in['participating'] ?? '', ['yes', 'no'], true)) {
    $errors['participating'] = 'இந்த புலம் தேவை';
}
if (empty($in['payment_amount']) || !is_numeric($in['payment_amount']) || (float) $in['payment_amount'] <= 0) {
    $errors['payment_amount'] = 'சரியான தொகை தேவை';
}

$pdo = db();
if (empty($errors['email'])) {
    $stmt = $pdo->prepare('SELECT 1 FROM profiles WHERE email = :e');
    $stmt->execute(['e' => strtolower(trim($in['email']))]);
    if ($stmt->fetchColumn()) {
        $errors['email'] = 'இந்த மின்னஞ்சலுக்கு ஏற்கனவே ஒரு சுயவிவரம் உள்ளது';
    }
}

if ($errors) {
    fail('சரிபார்ப்பு தோல்வியடைந்தது', 422, $errors);
}

try {
    $proofPath = store_payment_proof($_FILES['payment_proof'] ?? []);
} catch (UploadException $e) {
    fail($e->getMessage(), 422, ['payment_proof' => $e->getMessage()]);
}

$regNumber = next_registration_number($pdo);

$stmt = $pdo->prepare('INSERT INTO profiles
    (registration_number, name, gender, dob, email, phone1, phone2, gothram, address, quarter,
     height_cm, education, occupation, father_name, mother_name, star, rasi, native_place,
     residence, registrar_name, brothers, sisters, participating,
     payment_amount, payment_date, payment_reference, payment_proof_path, status)
    VALUES
    (:reg, :name, :gender, :dob, :email, :phone1, :phone2, :gothram, :address, :quarter,
     :height_cm, :education, :occupation, :father_name, :mother_name, :star, :rasi, :native_place,
     :residence, :registrar_name, :brothers, :sisters, :participating,
     :payment_amount, :payment_date, :payment_reference, :proof, "pending")');

$stmt->execute([
    'reg' => $regNumber,
    'name' => trim($in['name']),
    'gender' => $in['gender'],
    'dob' => $in['dob'],
    'email' => strtolower(trim($in['email'])),
    'phone1' => trim($in['phone1']),
    'phone2' => trim($in['phone2'] ?? '') !== '' ? trim($in['phone2']) : null,
    'gothram' => trim($in['gothram'] ?? '') !== '' ? trim($in['gothram']) : null,
    'address' => trim($in['address']),
    'quarter' => trim($in['quarter'] ?? '') !== '' ? trim($in['quarter']) : null,
    'height_cm' => (int) $in['height_cm'],
    'education' => trim($in['education']),
    'occupation' => trim($in['occupation']),
    'father_name' => trim($in['father_name']),
    'mother_name' => trim($in['mother_name']),
    'star' => trim($in['star']),
    'rasi' => trim($in['rasi']),
    'native_place' => trim($in['native_place']),
    'residence' => trim($in['residence']),
    'registrar_name' => trim($in['registrar_name']),
    'brothers' => (int) ($in['brothers'] ?? 0),
    'sisters' => (int) ($in['sisters'] ?? 0),
    'participating' => $in['participating'],
    'payment_amount' => (float) $in['payment_amount'],
    'payment_date' => $in['payment_date'],
    'payment_reference' => trim($in['payment_reference']),
    'proof' => $proofPath,
]);

send_mail(
    strtolower(trim($in['email'])),
    trim($in['name']),
    "பதிவு உறுதிப்படுத்தல் - {$regNumber}",
    "வணக்கம் " . trim($in['name']) . ",\n\n" .
    "கார்காத்தார் மங்கள சந்திப்பு குரோம்பேட்டையில் உங்கள் பதிவு வெற்றிகரமாக பெறப்பட்டது.\n\n" .
    "பதிவு எண்: {$regNumber}\n" .
    "நிலை: பரிசீலனையில் உள்ளது\n\n" .
    "உங்கள் சுயவிவரத்தை திருத்த, பதிவு செய்யப்பட்ட மின்னஞ்சலுடன் OTP மூலம் உள்நுழையவும்.\n\n" .
    "நன்றி."
);

json_out(['ok' => true, 'registration_number' => $regNumber], 201);
