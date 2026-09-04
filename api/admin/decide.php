<?php
declare(strict_types=1);
// One endpoint for both actions: POST { id, decision: "approved"|"rejected" }
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/helpers.php';
require_once __DIR__ . '/../lib/session.php';
require_once __DIR__ . '/../lib/mailer.php';

apply_cors();
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    fail('POST முறை தேவை', 405);
}
$pdo = db();
require_admin();

$in = input();
$id = (int) ($in['id'] ?? 0);
$decision = $in['decision'] ?? '';
if (!$id || !in_array($decision, ['approved', 'rejected'], true)) {
    fail('id மற்றும் சரியான முடிவு தேவை', 422);
}

$stmt = $pdo->prepare('SELECT name, email, registration_number FROM profiles WHERE id = :id');
$stmt->execute(['id' => $id]);
$profile = $stmt->fetch();
if (!$profile) {
    fail('சுயவிவரம் கிடைக்கவில்லை', 404);
}

$pdo->prepare('UPDATE profiles SET status = :s WHERE id = :id')->execute(['s' => $decision, 'id' => $id]);

$statusTamil = $decision === 'approved' ? 'ஏற்றுக்கொள்ளப்பட்டது' : 'நிராகரிக்கப்பட்டது';
send_mail(
    $profile['email'],
    $profile['name'],
    "உங்கள் பதிவு {$statusTamil} - {$profile['registration_number']}",
    "வணக்கம் {$profile['name']},\n\nஉங்கள் பதிவு ({$profile['registration_number']}) {$statusTamil}.\n\nநன்றி."
);

json_out(['ok' => true]);
