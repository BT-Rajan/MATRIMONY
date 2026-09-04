<?php
declare(strict_types=1);
require_once __DIR__ . '/lib/db.php';
require_once __DIR__ . '/lib/helpers.php';
require_once __DIR__ . '/lib/mailer.php';

apply_cors();
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    fail('POST முறை தேவை', 405);
}

$in = input();
$email = strtolower(trim($in['email'] ?? ''));
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    fail('சரியான மின்னஞ்சல் தேவை', 422, ['email' => 'சரியான மின்னஞ்சல் தேவை']);
}

$pdo = db();
$stmt = $pdo->prepare('SELECT id, name FROM profiles WHERE email = :e');
$stmt->execute(['e' => $email]);
$profile = $stmt->fetch();

// Always respond the same way whether or not the email exists, so this
// endpoint can't be used to discover who is registered.
if ($profile) {
    $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    $pdo->prepare('INSERT INTO otp_codes (email, otp_hash, expires_at) VALUES (:e, :h, :exp)')
        ->execute([
            'e' => $email,
            'h' => hash('sha256', $otp),
            'exp' => date('Y-m-d H:i:s', time() + 10 * 60),
        ]);

    send_mail(
        $email,
        $profile['name'],
        'உங்கள் OTP - கார்காத்தார் மங்கள சந்திப்பு',
        "வணக்கம் {$profile['name']},\n\nஉங்கள் சுயவிவரத்தை திருத்த OTP: {$otp}\n\n" .
        "இந்த OTP 10 நிமிடங்களுக்கு செல்லுபடியாகும். இதை யாருடனும் பகிர வேண்டாம்."
    );
}

json_out(['ok' => true, 'message' => 'மின்னஞ்சலுக்கு OTP அனுப்பப்பட்டுள்ளது (பதிவு செய்யப்பட்டிருந்தால்)']);
