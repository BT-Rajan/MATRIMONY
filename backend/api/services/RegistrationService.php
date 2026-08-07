<?php
declare(strict_types=1);

require_once __DIR__ . '/../models/MemberModel.php';
require_once __DIR__ . '/../models/HoroscopeModel.php';
require_once __DIR__ . '/../models/FamilyModel.php';
require_once __DIR__ . '/../models/ReferenceModel.php';
require_once __DIR__ . '/../models/MemberEventModel.php';
require_once __DIR__ . '/../helpers/FileUpload.php';
require_once __DIR__ . '/../helpers/Jwt.php';
require_once __DIR__ . '/../helpers/Audit.php';

final class RegistrationService
{
    private const MAX_ADDITIONAL_PHOTOS = 10;
    private const IMAGE_EXT = ['jpg', 'jpeg', 'png'];
    private const IMAGE_MAX = 5 * 1024 * 1024;
    private const ID_PROOF_EXT = ['jpg', 'jpeg', 'png', 'pdf'];
    private const ID_PROOF_MAX = 5 * 1024 * 1024;
    private const HOROSCOPE_EXT = ['jpg', 'jpeg', 'png', 'pdf'];
    private const HOROSCOPE_MAX = 10 * 1024 * 1024;
    private const RECEIPT_EXT = ['jpg', 'jpeg', 'png', 'pdf'];
    private const RECEIPT_MAX = 5 * 1024 * 1024;

    /** @throws RegistrationException */
    public static function step1(array $input, array $files): array
    {
        $errors = self::validateStep1($input);
        if (!isset($files['photo']) || ($files['photo']['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
            $errors['photo'] = 'புகைப்படம் தேவை';
        }
        if (!isset($files['id_proof']) || ($files['id_proof']['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
            $errors['id_proof'] = 'அடையாள சான்று தேவை';
        }
        if ($errors) {
            throw new RegistrationException('சரிபார்ப்பு தோல்வியடைந்தது', 422, $errors);
        }

        try {
            $photo = FileUpload::store($files['photo'], 'photos', self::IMAGE_EXT, self::IMAGE_MAX);
            $idProof = FileUpload::store($files['id_proof'], 'id_proofs', self::ID_PROOF_EXT, self::ID_PROOF_MAX);
        } catch (UploadException $e) {
            throw new RegistrationException($e->getMessage(), 422);
        }

        $regNumber = MemberModel::nextRegistrationNumber();

        $fields = [
            'registration_number' => $regNumber,
            'name_english' => trim($input['name_english']),
            'name_tamil' => trim($input['name_tamil']),
            'gender' => $input['registration_type'],
            'email' => strtolower(trim($input['email'])),
            'mobile' => trim($input['mobile']),
            'whatsapp' => ($input['whatsapp'] ?? '') !== '' ? trim($input['whatsapp']) : null,
            'password_hash' => password_hash($input['password'], PASSWORD_DEFAULT),
            'status' => 'draft',
            'registration_step' => 2,
            'marital_status' => $input['marital_status'],
            'dob' => $input['dob'],
            'height_cm' => (int) $input['height_cm'],
            'weight_kg' => ($input['weight_kg'] ?? '') !== '' ? (int) $input['weight_kg'] : null,
            'education_id' => (int) $input['education_id'],
            'occupation_id' => (int) $input['occupation_id'],
            'income_id' => ($input['income_id'] ?? '') !== '' ? (int) $input['income_id'] : null,
            'religion_id' => (int) $input['religion_id'],
            'caste_id' => (int) $input['caste_id'],
            'sub_caste_id' => ($input['sub_caste_id'] ?? '') !== '' ? (int) $input['sub_caste_id'] : null,
            'star_id' => (int) $input['star_id'],
            'rasi_id' => (int) $input['rasi_id'],
            'dosham_id' => (int) $input['dosham_id'],
            'native_place' => trim($input['native_place']),
            'district_id' => (int) $input['district_id'],
            'current_address' => trim($input['current_address']),
            'state' => trim($input['state']),
            'country' => trim($input['country']),
            'photo_path' => $photo['path'],
            'id_proof_path' => $idProof['path'],
            'about_myself' => ($input['about_myself'] ?? '') !== '' ? trim($input['about_myself']) : null,
            'diet' => $input['diet'],
            'smoking' => $input['smoking'],
            'drinking' => $input['drinking'],
            'physically_challenged' => $input['physically_challenged'],
        ];

        $memberId = MemberModel::createDraft($fields);

        // Additional photos (optional, up to 10)
        if (isset($files['additional_photos']) && is_array($files['additional_photos']['name'])) {
            $count = count(array_filter($files['additional_photos']['name']));
            if ($count > self::MAX_ADDITIONAL_PHOTOS) {
                $count = self::MAX_ADDITIONAL_PHOTOS;
            }
            for ($i = 0; $i < $count; $i++) {
                if (($files['additional_photos']['error'][$i] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
                    continue;
                }
                $single = [
                    'name' => $files['additional_photos']['name'][$i],
                    'type' => $files['additional_photos']['type'][$i],
                    'tmp_name' => $files['additional_photos']['tmp_name'][$i],
                    'error' => $files['additional_photos']['error'][$i],
                    'size' => $files['additional_photos']['size'][$i],
                ];
                try {
                    $saved = FileUpload::store($single, 'photos', self::IMAGE_EXT, self::IMAGE_MAX);
                    MemberModel::addPhoto($memberId, $saved['path'], $saved['original_filename']);
                } catch (UploadException $e) {
                    // Skip a single bad extra photo rather than failing the whole registration.
                    Logger::error("Additional photo skipped for member {$memberId}: " . $e->getMessage());
                }
            }
        }

        Audit::log($memberId, 'member', 'registration_step1_completed', 'member', $memberId, null, ['registration_number' => $regNumber]);

        $token = Jwt::encode(['sub' => $memberId, 'role' => 'member', 'registration_number' => $regNumber]);

        return [
            'token' => $token,
            'user' => [
                'id' => $memberId,
                'name' => $fields['name_english'],
                'registration_number' => $regNumber,
                'status' => 'draft',
                'registration_step' => 2,
                'role' => 'member',
            ],
        ];
    }

    /** @throws RegistrationException */
    public static function step2(int $memberId, array $input, array $files): array
    {
        $errors = self::validateStep2($input);

        $existing = HoroscopeModel::find($memberId);
        $needsFile = !$existing || (isset($files['horoscope_document']) && ($files['horoscope_document']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE);
        $fileProvided = isset($files['horoscope_document']) && ($files['horoscope_document']['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_OK;

        if (!$existing && !$fileProvided) {
            $errors['horoscope_document'] = 'ஜாதக ஆவணம் தேவை';
        }

        $member = MemberModel::findById($memberId);
        if ($member && $input['birth_date'] !== $member['dob']) {
            $errors['birth_date'] = 'பிறந்த தேதி படிவம் 1 இல் உள்ள பிறந்த தேதியுடன் பொருந்த வேண்டும்';
        }

        if ($errors) {
            throw new RegistrationException('சரிபார்ப்பு தோல்வியடைந்தது', 422, $errors);
        }

        $fields = [
            'birth_date' => $input['birth_date'],
            'birth_time' => $input['birth_time'],
            'birth_place' => trim($input['birth_place']),
            'star_id' => (int) $input['star_id'],
            'rasi_id' => (int) $input['rasi_id'],
            'lagnam' => trim($input['lagnam']),
            'gothram' => ($input['gothram'] ?? '') !== '' ? trim($input['gothram']) : null,
            'chevvai_dosham' => $input['chevvai_dosham'],
            'rahu_dosham' => $input['rahu_dosham'],
            'kethu_dosham' => $input['kethu_dosham'],
            'kalasarpa_dosham' => $input['kalasarpa_dosham'],
        ];

        if ($fileProvided) {
            try {
                $doc = FileUpload::store($files['horoscope_document'], 'horoscopes', self::HOROSCOPE_EXT, self::HOROSCOPE_MAX);
                $fields['horoscope_file_path'] = $doc['path'];
            } catch (UploadException $e) {
                throw new RegistrationException($e->getMessage(), 422, ['horoscope_document' => $e->getMessage()]);
            }
        } elseif ($existing) {
            $fields['horoscope_file_path'] = $existing['horoscope_file_path'];
        }

        HoroscopeModel::upsert($memberId, $fields);
        MemberModel::advanceStep($memberId, 3);
        Audit::log($memberId, 'member', 'registration_step2_saved', 'member_horoscopes', $memberId);

        return ['registration_step' => 3];
    }

    /** @throws RegistrationException */
    public static function step3(int $memberId, array $input, array $files): array
    {
        $errors = self::validateStep3($input);
        if ($errors) {
            throw new RegistrationException('சரிபார்ப்பு தோல்வியடைந்தது', 422, $errors);
        }

        $fields = [
            'father_name' => trim($input['father_name']),
            'mother_name' => trim($input['mother_name']),
            'father_occupation' => ($input['father_occupation'] ?? '') !== '' ? trim($input['father_occupation']) : null,
            'parents_alive' => $input['parents_alive'],
            'brothers' => (int) $input['brothers'],
            'married_brothers' => (int) $input['married_brothers'],
            'sisters' => (int) $input['sisters'],
            'married_sisters' => (int) $input['married_sisters'],
            'family_type' => $input['family_type'],
            'own_house' => $input['own_house'],
            'family_income_id' => ($input['family_income_id'] ?? '') !== '' ? (int) $input['family_income_id'] : null,
        ];

        if (isset($files['family_photo']) && ($files['family_photo']['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_OK) {
            try {
                $photo = FileUpload::store($files['family_photo'], 'family_photos', self::IMAGE_EXT, self::IMAGE_MAX);
                $fields['family_photo_path'] = $photo['path'];
            } catch (UploadException $e) {
                throw new RegistrationException($e->getMessage(), 422, ['family_photo' => $e->getMessage()]);
            }
        }

        FamilyModel::upsert($memberId, $fields);
        MemberModel::advanceStep($memberId, 4);
        Audit::log($memberId, 'member', 'registration_step3_saved', 'member_family', $memberId);

        return ['registration_step' => 4];
    }

    /** @throws RegistrationException */
    public static function step4(int $memberId, array $input): array
    {
        $errors = self::validateStep4($memberId, $input);
        if ($errors) {
            throw new RegistrationException('சரிபார்ப்பு தோல்வியடைந்தது', 422, $errors);
        }

        ReferenceModel::upsert($memberId, [
            'reference_name' => trim($input['reference_name']),
            'relationship_id' => (int) $input['relationship_id'],
            'phone' => trim($input['phone']),
            'address' => ($input['address'] ?? '') !== '' ? trim($input['address']) : null,
            'known_since' => ($input['known_since'] ?? '') !== '' ? trim($input['known_since']) : null,
            'remarks' => ($input['remarks'] ?? '') !== '' ? trim($input['remarks']) : null,
        ]);
        MemberModel::advanceStep($memberId, 5);
        Audit::log($memberId, 'member', 'registration_step4_saved', 'member_references', $memberId);

        return ['registration_step' => 5];
    }

    /** @throws RegistrationException */
    public static function step5(int $memberId, array $input, array $files): array
    {
        $participating = $input['participating'] ?? 'no';
        $errors = [];

        $fields = ['participating' => $participating];

        if ($participating === 'yes') {
            if (empty($input['event_id'])) $errors['event_id'] = 'நிகழ்வு தேவை';
            if (empty($input['batch'])) $errors['batch'] = 'தொகுதி தேவை';
            if (empty($input['food_preference'])) $errors['food_preference'] = 'உணவு விருப்பம் தேவை';
            if (empty($input['payment_type_id'])) $errors['payment_type_id'] = 'கட்டண வகை தேவை';
            if (empty($input['amount']) || (float) $input['amount'] <= 0) $errors['amount'] = 'தொகை பூஜ்ஜியத்தை விட அதிகமாக இருக்க வேண்டும்';
            if (empty($input['transaction_number'])) {
                $errors['transaction_number'] = 'பரிவர்த்தனை எண் தேவை';
            } elseif (MemberEventModel::transactionNumberExists(trim($input['transaction_number']), $memberId)) {
                $errors['transaction_number'] = 'இந்த பரிவர்த்தனை எண் ஏற்கனவே பயன்படுத்தப்பட்டுள்ளது';
            }

            $existing = MemberEventModel::find($memberId);
            $fileProvided = isset($files['receipt']) && ($files['receipt']['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_OK;
            if (!$existing && !$fileProvided) {
                $errors['receipt'] = 'ரசீது பதிவேற்றம் தேவை';
            }

            if ($errors) {
                throw new RegistrationException('சரிபார்ப்பு தோல்வியடைந்தது', 422, $errors);
            }

            $fields['event_id'] = (int) $input['event_id'];
            $fields['batch'] = trim($input['batch']);
            $fields['food_preference'] = $input['food_preference'];
            $fields['payment_type_id'] = (int) $input['payment_type_id'];
            $fields['amount'] = (float) $input['amount'];
            $fields['transaction_number'] = trim($input['transaction_number']);

            if ($fileProvided) {
                try {
                    $receipt = FileUpload::store($files['receipt'], 'receipts', self::RECEIPT_EXT, self::RECEIPT_MAX);
                    $fields['receipt_path'] = $receipt['path'];
                } catch (UploadException $e) {
                    throw new RegistrationException($e->getMessage(), 422, ['receipt' => $e->getMessage()]);
                }
            } elseif ($existing) {
                $fields['receipt_path'] = $existing['receipt_path'];
            }
        } else {
            $fields += [
                'event_id' => null, 'batch' => null, 'food_preference' => null,
                'payment_type_id' => null, 'amount' => null, 'transaction_number' => null, 'receipt_path' => null,
            ];
        }

        MemberEventModel::upsert($memberId, $fields);
        MemberModel::markPendingApproval($memberId);
        Audit::log($memberId, 'member', 'registration_completed', 'members', $memberId, null, ['status' => 'pending_approval']);

        return ['status' => 'pending_approval', 'registration_step' => 6];
    }

    public static function currentState(int $memberId): array
    {
        $profile = MemberModel::findFullProfile($memberId);
        if (!$profile) {
            throw new RegistrationException('கிடைக்கவில்லை', 404);
        }
        unset($profile['member']['password_hash']);
        return $profile;
    }

    // ---------------------------------------------------------------
    // Validation
    // ---------------------------------------------------------------

    private static function validateStep1(array $in): array
    {
        $e = [];

        if (!in_array($in['registration_type'] ?? '', ['bride', 'groom'], true)) {
            $e['registration_type'] = 'பதிவு வகை தேவை';
        }

        self::req($e, $in, 'name_tamil', 'தமிழ் பெயர்');
        self::lenBetween($e, $in, 'name_tamil', 3, 100, 'தமிழ் பெயர்');
        self::req($e, $in, 'name_english', 'ஆங்கில பெயர்');
        self::lenBetween($e, $in, 'name_english', 3, 100, 'ஆங்கில பெயர்');

        if (empty($in['dob'])) {
            $e['dob'] = 'பிறந்த தேதி தேவை';
        } else {
            $dob = DateTime::createFromFormat('Y-m-d', $in['dob']);
            if (!$dob) {
                $e['dob'] = 'சரியான தேதி இல்லை';
            } elseif ($dob > new DateTime()) {
                $e['dob'] = 'எதிர்கால தேதி அனுமதிக்கப்படாது';
            } else {
                $age = (new DateTime())->diff($dob)->y;
                if ($age < 18 || $age > 60) {
                    $e['dob'] = 'வயது 18 முதல் 60 வரை இருக்க வேண்டும்';
                }
            }
        }

        self::numBetween($e, $in, 'height_cm', 90, 250, 'உயரம்', true);
        if (($in['weight_kg'] ?? '') !== '') {
            self::numBetween($e, $in, 'weight_kg', 20, 250, 'எடை', true);
        }

        if (!in_array($in['marital_status'] ?? '', ['single', 'divorced', 'widowed', 'separated'], true)) {
            $e['marital_status'] = 'திருமண நிலை தேவை';
        }

        self::reqInt($e, $in, 'education_id', 'கல்வி');
        self::reqInt($e, $in, 'occupation_id', 'தொழில்');
        self::reqInt($e, $in, 'religion_id', 'மதம்');
        self::reqInt($e, $in, 'caste_id', 'சாதி');
        self::reqInt($e, $in, 'star_id', 'நட்சத்திரம்');
        self::reqInt($e, $in, 'rasi_id', 'ராசி');
        self::reqInt($e, $in, 'dosham_id', 'தோஷம்');
        self::reqInt($e, $in, 'district_id', 'மாவட்டம்');

        self::req($e, $in, 'native_place', 'சொந்த ஊர்');
        self::req($e, $in, 'current_address', 'தற்போதைய முகவரி');
        self::lenBetween($e, $in, 'current_address', 15, 500, 'தற்போதைய முகவரி');
        self::req($e, $in, 'state', 'மாநிலம்');
        self::req($e, $in, 'country', 'நாடு');

        if (empty($in['mobile']) || !preg_match('/^[6-9]\d{9}$/', $in['mobile'])) {
            $e['mobile'] = 'சரியான மொபைல் எண் (10 இலக்கம்) தேவை';
        } elseif (MemberModel::existsByMobile($in['mobile'])) {
            $e['mobile'] = 'இந்த மொபைல் எண் ஏற்கனவே பதிவு செய்யப்பட்டுள்ளது';
        }
        if (!empty($in['whatsapp']) && !preg_match('/^[6-9]\d{9}$/', $in['whatsapp'])) {
            $e['whatsapp'] = 'சரியான வாட்ஸ்அப் எண் தேவை';
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

        if (isset($in['about_myself']) && mb_strlen($in['about_myself']) > 2000) {
            $e['about_myself'] = 'அதிகபட்சம் 2000 எழுத்துகள்';
        }

        if (!in_array($in['diet'] ?? '', ['veg', 'nonveg'], true)) {
            $e['diet'] = 'உணவுப் பழக்கம் தேவை';
        }
        if (!in_array($in['smoking'] ?? '', ['yes', 'no', 'occasionally'], true)) {
            $e['smoking'] = 'புகைபிடித்தல் விவரம் தேவை';
        }
        if (!in_array($in['drinking'] ?? '', ['yes', 'no', 'occasionally'], true)) {
            $e['drinking'] = 'மது அருந்துதல் விவரம் தேவை';
        }
        if (!in_array($in['physically_challenged'] ?? '', ['yes', 'no'], true)) {
            $e['physically_challenged'] = 'இந்த புலம் தேவை';
        }

        return $e;
    }

    private static function validateStep2(array $in): array
    {
        $e = [];
        self::req($e, $in, 'birth_date', 'பிறந்த தேதி');
        self::req($e, $in, 'birth_time', 'பிறந்த நேரம்');
        self::req($e, $in, 'birth_place', 'பிறந்த இடம்');
        self::reqInt($e, $in, 'star_id', 'நட்சத்திரம்');
        self::reqInt($e, $in, 'rasi_id', 'ராசி');
        self::req($e, $in, 'lagnam', 'லக்னம்');
        foreach (['chevvai_dosham', 'rahu_dosham', 'kethu_dosham', 'kalasarpa_dosham'] as $f) {
            if (!in_array($in[$f] ?? '', ['yes', 'no'], true)) {
                $e[$f] = 'இந்த புலம் தேவை';
            }
        }
        return $e;
    }

    private static function validateStep3(array $in): array
    {
        $e = [];
        self::req($e, $in, 'father_name', 'தந்தை பெயர்');
        self::req($e, $in, 'mother_name', 'தாய் பெயர்');
        if (!in_array($in['parents_alive'] ?? '', ['yes', 'no'], true)) {
            $e['parents_alive'] = 'இந்த புலம் தேவை';
        }
        if (!in_array($in['family_type'] ?? '', ['nuclear', 'joint'], true)) {
            $e['family_type'] = 'குடும்ப வகை தேவை';
        }
        if (!in_array($in['own_house'] ?? '', ['yes', 'no'], true)) {
            $e['own_house'] = 'இந்த புலம் தேவை';
        }

        $brothers = self::intOrNull($in['brothers'] ?? null);
        $marriedBrothers = self::intOrNull($in['married_brothers'] ?? null);
        $sisters = self::intOrNull($in['sisters'] ?? null);
        $marriedSisters = self::intOrNull($in['married_sisters'] ?? null);

        foreach (['brothers' => $brothers, 'married_brothers' => $marriedBrothers, 'sisters' => $sisters, 'married_sisters' => $marriedSisters] as $field => $val) {
            if ($val === null || $val < 0 || $val > 20) {
                $e[$field] = '0 முதல் 20 வரை இருக்க வேண்டும்';
            }
        }
        if (!isset($e['brothers']) && !isset($e['married_brothers']) && $marriedBrothers > $brothers) {
            $e['married_brothers'] = 'மொத்த சகோதரர்களை விட அதிகமாக இருக்க முடியாது';
        }
        if (!isset($e['sisters']) && !isset($e['married_sisters']) && $marriedSisters > $sisters) {
            $e['married_sisters'] = 'மொத்த சகோதரிகளை விட அதிகமாக இருக்க முடியாது';
        }

        return $e;
    }

    private static function validateStep4(int $memberId, array $in): array
    {
        $e = [];
        self::req($e, $in, 'reference_name', 'பரிந்துரையாளர் பெயர்');
        self::reqInt($e, $in, 'relationship_id', 'உறவுமுறை');

        if (empty($in['phone']) || !preg_match('/^[6-9]\d{9}$/', $in['phone'])) {
            $e['phone'] = 'சரியான மொபைல் எண் (10 இலக்கம்) தேவை';
        } else {
            $member = MemberModel::findById($memberId);
            if ($member && $member['mobile'] === $in['phone']) {
                $e['phone'] = 'பரிந்துரையாளர் எண் விண்ணப்பதாரர் எண்ணுடன் ஒரே மாதிரி இருக்க முடியாது';
            }
        }

        if (isset($in['remarks']) && mb_strlen($in['remarks']) > 500) {
            $e['remarks'] = 'அதிகபட்சம் 500 எழுத்துகள்';
        }

        return $e;
    }

    // ---------------------------------------------------------------
    // Small validation helpers
    // ---------------------------------------------------------------

    private static function req(array &$e, array $in, string $field, string $label): void
    {
        if (empty(trim((string) ($in[$field] ?? '')))) {
            $e[$field] = "{$label} தேவை";
        }
    }

    private static function reqInt(array &$e, array $in, string $field, string $label): void
    {
        if (empty($in[$field]) || !ctype_digit((string) $in[$field])) {
            $e[$field] = "{$label} தேவை";
        }
    }

    private static function lenBetween(array &$e, array $in, string $field, int $min, int $max, string $label): void
    {
        if (isset($e[$field])) return;
        $len = mb_strlen(trim((string) ($in[$field] ?? '')));
        if ($len < $min || $len > $max) {
            $e[$field] = "{$label} {$min}-{$max} எழுத்துகளுக்குள் இருக்க வேண்டும்";
        }
    }

    private static function numBetween(array &$e, array $in, string $field, int $min, int $max, string $label, bool $required): void
    {
        $val = $in[$field] ?? '';
        if ($val === '' || !is_numeric($val)) {
            if ($required) $e[$field] = "{$label} தேவை";
            return;
        }
        if ((float) $val < $min || (float) $val > $max) {
            $e[$field] = "{$label} {$min}-{$max} க்குள் இருக்க வேண்டும்";
        }
    }

    private static function intOrNull($val): ?int
    {
        return ($val !== null && $val !== '' && ctype_digit((string) $val)) ? (int) $val : null;
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
