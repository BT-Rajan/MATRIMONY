<?php
declare(strict_types=1);

require_once __DIR__ . '/../models/MemberModel.php';
require_once __DIR__ . '/../helpers/FileUpload.php';
require_once __DIR__ . '/../helpers/Jwt.php';
require_once __DIR__ . '/../helpers/Audit.php';
require_once __DIR__ . '/../helpers/Logger.php';

/**
 * Single-step registration: bio-data + payment, matching only the
 * fields the app now collects (see docs/SETUP.md "Registration fields").
 */
final class RegistrationService
{
    private const SCREENSHOT_EXT = ['jpg', 'jpeg', 'png', 'pdf'];
    private const SCREENSHOT_MAX = 5 * 1024 * 1024;

    /** @throws RegistrationException */
    public static function register(array $input, array $files): array
    {
        $errors = self::validate($input);

        $hasScreenshot = isset($files['payment_screenshot'])
            && ($files['payment_screenshot']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE;
        if (!$hasScreenshot) {
            $errors['payment_screenshot'] = 'கட்டண ஸ்கிரீன்ஷாட் தேவை';
        }

        if ($errors) {
            throw new RegistrationException('சரிபார்ப்பு தோல்வியடைந்தது', 422, $errors);
        }

        try {
            $screenshot = FileUpload::store(
                $files['payment_screenshot'],
                'payment_screenshots',
                self::SCREENSHOT_EXT,
                self::SCREENSHOT_MAX
            );
        } catch (UploadException $e) {
            throw new RegistrationException($e->getMessage(), 422, ['payment_screenshot' => $e->getMessage()]);
        }

        $regNumber = MemberModel::nextRegistrationNumber();

        $fields = [
            'registration_number' => $regNumber,
            'name_english' => trim($input['name']),
            'name_tamil' => trim($input['name']),
            'gender' => $input['gender'],
            'email' => strtolower(trim($input['email'])),
            'mobile' => trim($input['phone1']),
            'whatsapp' => trim($input['phone2'] ?? '') !== '' ? trim($input['phone2']) : null,
            'password_hash' => password_hash($input['password'], PASSWORD_DEFAULT),
            'status' => 'pending_approval',
            'registration_step' => 1,
            'dob' => $input['dob'],
            'gothram' => ($input['gothram'] ?? '') !== '' ? trim($input['gothram']) : null,
            'address' => trim($input['address']),
            'quarter' => ($input['quarter'] ?? '') !== '' ? trim($input['quarter']) : null,
            'height_cm' => (int) $input['height_cm'],
            'education_id' => (int) $input['education_id'],
            'occupation_id' => (int) $input['occupation_id'],
            'father_name' => trim($input['father_name']),
            'mother_name' => trim($input['mother_name']),
            'star_id' => (int) $input['star_id'],
            'rasi_id' => (int) $input['rasi_id'],
            'native_place' => trim($input['native_place']),
            'residence' => trim($input['residence']),
            'registrar_name' => trim($input['registrar_name']),
            'brothers' => (int) ($input['brothers'] ?? 0),
            'sisters' => (int) ($input['sisters'] ?? 0),
            'participating' => $input['participating'],
            'payment_amount' => (float) $input['payment_amount'],
            'payment_date' => $input['payment_date'],
            'payment_reference' => trim($input['payment_reference']),
            'payment_screenshot_path' => $screenshot['path'],
        ];

        $memberId = MemberModel::createDraft($fields);

        Audit::log($memberId, 'member', 'registration_completed', 'member', $memberId, null, ['registration_number' => $regNumber]);

        $token = Jwt::encode(['sub' => $memberId, 'role' => 'member', 'registration_number' => $regNumber]);

        return [
            'token' => $token,
            'user' => [
                'id' => $memberId,
                'name' => $fields['name_english'],
                'registration_number' => $regNumber,
                'status' => 'pending_approval',
                'registration_step' => 1,
                'role' => 'member',
            ],
        ];
    }

    public static function currentState(int $memberId): ?array
    {
        return MemberModel::findById($memberId);
    }

    private static function validate(array $in): array
    {
        $e = [];
        self::req($e, $in, 'name', 'பெயர்');
        self::req($e, $in, 'dob', 'பிறந்த தேதி');
        self::req($e, $in, 'address', 'முகவரி');
        self::reqInt($e, $in, 'star_id', 'நட்சத்திரம்');
        self::reqInt($e, $in, 'rasi_id', 'ராசி');
        self::reqInt($e, $in, 'education_id', 'கல்வி');
        self::reqInt($e, $in, 'occupation_id', 'தொழில்');
        self::req($e, $in, 'father_name', 'தந்தை பெயர்');
        self::req($e, $in, 'mother_name', 'தாய் பெயர்');
        self::req($e, $in, 'native_place', 'சொந்த ஊர்');
        self::req($e, $in, 'residence', 'தற்போதைய இருப்பிடம்');
        self::req($e, $in, 'registrar_name', 'பதிவாளர் பெயர்');

        if (!in_array($in['gender'] ?? '', ['bride', 'groom'], true)) {
            $e['gender'] = 'பாலினம் தேவை';
        }

        if (empty($in['phone1']) || !preg_match('/^[6-9]\d{9}$/', $in['phone1'])) {
            $e['phone1'] = 'சரியான மொபைல் எண் (10 இலக்கம்) தேவை';
        } elseif (MemberModel::existsByMobile(trim($in['phone1']))) {
            $e['phone1'] = 'இந்த மொபைல் எண் ஏற்கனவே பதிவு செய்யப்பட்டுள்ளது';
        }
        if (!empty($in['phone2']) && !preg_match('/^[6-9]\d{9}$/', $in['phone2'])) {
            $e['phone2'] = 'சரியான மொபைல் எண் (10 இலக்கம்) தேவை';
        }

        if (empty($in['email']) || !filter_var($in['email'], FILTER_VALIDATE_EMAIL)) {
            $e['email'] = 'சரியான மின்னஞ்சல் தேவை';
        } elseif (MemberModel::existsByEmail(strtolower(trim($in['email'])))) {
            $e['email'] = 'இந்த மின்னஞ்சல் ஏற்கனவே பதிவு செய்யப்பட்டுள்ளது';
        }

        if (empty($in['password']) || strlen($in['password']) < 8) {
            $e['password'] = 'கடவுச்சொல் குறைந்தது 8 எழுத்துகள் தேவை';
        } elseif (($in['password'] ?? null) !== ($in['password_confirmation'] ?? null)) {
            $e['password_confirmation'] = 'கடவுச்சொற்கள் பொருந்தவில்லை';
        }

        if (empty($in['height_cm']) || !ctype_digit((string) $in['height_cm']) || (int) $in['height_cm'] < 100 || (int) $in['height_cm'] > 250) {
            $e['height_cm'] = 'சரியான உயரம் (செ.மீ.) தேவை';
        }

        foreach (['brothers' => $in['brothers'] ?? '0', 'sisters' => $in['sisters'] ?? '0'] as $field => $val) {
            if ($val === '' || !ctype_digit((string) $val) || (int) $val < 0 || (int) $val > 20) {
                $e[$field] = '0 முதல் 20 வரை இருக்க வேண்டும்';
            }
        }

        if (!in_array($in['participating'] ?? '', ['yes', 'no'], true)) {
            $e['participating'] = 'இந்த புலம் தேவை';
        }

        if (empty($in['payment_amount']) || !is_numeric($in['payment_amount']) || (float) $in['payment_amount'] <= 0) {
            $e['payment_amount'] = 'சரியான தொகை தேவை';
        }
        self::req($e, $in, 'payment_date', 'கட்டண தேதி');
        self::req($e, $in, 'payment_reference', 'குறிப்பு எண்');

        return $e;
    }

    private static function req(array &$e, array $in, string $field, string $label): void
    {
        if (trim((string) ($in[$field] ?? '')) === '') {
            $e[$field] = "{$label} தேவை";
        }
    }

    private static function reqInt(array &$e, array $in, string $field, string $label): void
    {
        if (empty($in[$field]) || !ctype_digit((string) $in[$field])) {
            $e[$field] = "{$label} தேவை";
        }
    }
}

final class RegistrationException extends RuntimeException
{
    public function __construct(string $message, private int $httpCode = 400, private ?array $errors = null)
    {
        parent::__construct($message);
    }

    public function httpCode(): int
    {
        return $this->httpCode;
    }

    public function errors(): ?array
    {
        return $this->errors;
    }
}
