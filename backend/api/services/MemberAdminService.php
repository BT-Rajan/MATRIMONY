<?php
declare(strict_types=1);

require_once __DIR__ . '/../models/MemberModel.php';
require_once __DIR__ . '/../models/MemberEventModel.php';
require_once __DIR__ . '/../helpers/Audit.php';

final class MemberAdminService
{
    // Fields an admin may correct directly (typos, contact-detail fixes).
    // Photo/ID-proof/horoscope/family-photo re-upload and full bio-data
    // edit are intentionally out of scope for this pass — see PASSES.md.
    private const EDITABLE_FIELDS = [
        'name_tamil', 'name_english', 'mobile', 'whatsapp', 'email',
        'native_place', 'current_address', 'state', 'country',
        'district_id', 'education_id', 'occupation_id', 'income_id',
        'marital_status', 'diet', 'smoking', 'drinking', 'physically_challenged', 'about_myself',
    ];

    public static function list(array $filters, int $page, int $perPage): array
    {
        return MemberModel::adminPaginate($filters, $page, $perPage);
    }

    public static function exportRows(array $filters): array
    {
        return MemberModel::searchForExport($filters);
    }

    /** @throws MemberAdminException */
    public static function show(int $id): array
    {
        $profile = MemberModel::findFullProfile($id);
        if (!$profile) {
            throw new MemberAdminException('உறுப்பினர் கிடைக்கவில்லை', 404);
        }
        unset($profile['member']['password_hash']);
        return $profile;
    }

    /** @throws MemberAdminException */
    public static function approve(int $id, int $adminId): array
    {
        $member = self::requireMember($id);

        if (!in_array($member['status'], ['pending_approval', 'rejected'], true)) {
            throw new MemberAdminException('இந்த நிலையில் உள்ள சுயவிவரத்தை அனுமதிக்க முடியாது', 409);
        }
        if ((int) $member['registration_step'] < 6) {
            throw new MemberAdminException('முழுமையடையாத சுயவிவரத்தை அனுமதிக்க முடியாது', 422);
        }

        MemberModel::setStatus($id, 'approved', $adminId);
        Audit::log($adminId, 'admin', 'member_approved', 'members', $id, ['status' => $member['status']], ['status' => 'approved']);

        return self::show($id);
    }

    /** @throws MemberAdminException */
    public static function reject(int $id, int $adminId, string $reason): array
    {
        $member = self::requireMember($id);

        if ($member['status'] !== 'pending_approval') {
            throw new MemberAdminException('நிலுவையில் உள்ள சுயவிவரங்களை மட்டுமே நிராகரிக்க முடியும்', 409);
        }
        if (trim($reason) === '') {
            throw new MemberAdminException('சரிபார்ப்பு தோல்வியடைந்தது', 422, ['reason' => 'நிராகரிப்புக்கான காரணம் தேவை']);
        }

        MemberModel::setStatus($id, 'rejected', $adminId, trim($reason));
        Audit::log($adminId, 'admin', 'member_rejected', 'members', $id, ['status' => $member['status']], ['status' => 'rejected', 'reason' => $reason]);

        return self::show($id);
    }

    /** @throws MemberAdminException */
    public static function setVerified(int $id, bool $verified, int $adminId): array
    {
        $member = self::requireMember($id);
        MemberModel::setVerified($id, $verified, $adminId);
        Audit::log($adminId, 'admin', $verified ? 'member_verified' : 'member_unverified', 'members', $id, ['is_verified' => $member['is_verified']], ['is_verified' => $verified]);
        return self::show($id);
    }

    /** @throws MemberAdminException */
    public static function deactivate(int $id, int $adminId): array
    {
        $member = self::requireMember($id);

        if (in_array($member['status'], ['blocked', 'archived', 'draft'], true)) {
            throw new MemberAdminException('இந்த நிலையில் உள்ள சுயவிவரத்தை முடக்க முடியாது', 409);
        }

        MemberModel::setStatus($id, 'blocked', $adminId, null, $member['status']);
        Audit::log($adminId, 'admin', 'member_deactivated', 'members', $id, ['status' => $member['status']], ['status' => 'blocked']);

        return self::show($id);
    }

    /** @throws MemberAdminException */
    public static function reactivate(int $id, int $adminId): array
    {
        $member = self::requireMember($id);

        if ($member['status'] !== 'blocked') {
            throw new MemberAdminException('முடக்கப்பட்ட சுயவிவரங்களை மட்டுமே மீண்டும் செயல்படுத்த முடியும்', 409);
        }

        MemberModel::restorePreviousStatus($id, $adminId);
        Audit::log($adminId, 'admin', 'member_reactivated', 'members', $id, ['status' => 'blocked'], ['status' => $member['previous_status'] ?? 'approved']);

        return self::show($id);
    }

    /** @throws MemberAdminException */
    public static function archive(int $id, int $adminId): array
    {
        $member = self::requireMember($id);

        if ($member['status'] === 'archived') {
            throw new MemberAdminException('ஏற்கனவே காப்பகப்படுத்தப்பட்டது', 409);
        }

        MemberModel::setStatus($id, 'archived', $adminId, null, $member['status']);
        Audit::log($adminId, 'admin', 'member_archived', 'members', $id, ['status' => $member['status']], ['status' => 'archived']);

        return self::show($id);
    }

    /** @throws MemberAdminException */
    public static function delete(int $id, int $adminId): void
    {
        $member = self::requireMember($id);

        if ($member['status'] === 'approved') {
            throw new MemberAdminException('அனுமதிக்கப்பட்ட சுயவிவரத்தை நீக்க முடியாது. முதலில் காப்பகப்படுத்தவும்.', 409);
        }

        $profile = MemberModel::findFullProfile($id);
        MemberModel::delete($id); // cascades to child tables via FK ON DELETE CASCADE
        self::cleanupFiles($profile);

        Audit::log($adminId, 'admin', 'member_deleted', 'members', $id, ['registration_number' => $member['registration_number']], null);
    }

    /** @throws MemberAdminException */
    public static function updateCore(int $id, int $adminId, array $input): array
    {
        $member = self::requireMember($id);
        $fields = array_intersect_key($input, array_flip(self::EDITABLE_FIELDS));

        if (isset($fields['mobile']) && $fields['mobile'] !== $member['mobile']) {
            if (!preg_match('/^[6-9]\d{9}$/', $fields['mobile'])) {
                throw new MemberAdminException('சரிபார்ப்பு தோல்வியடைந்தது', 422, ['mobile' => 'சரியான மொபைல் எண் தேவை']);
            }
            if (MemberModel::existsByMobile($fields['mobile'])) {
                throw new MemberAdminException('சரிபார்ப்பு தோல்வியடைந்தது', 422, ['mobile' => 'இந்த மொபைல் எண் ஏற்கனவே பயன்பாட்டில் உள்ளது']);
            }
        }
        if (isset($fields['email']) && strtolower($fields['email']) !== strtolower($member['email'])) {
            $fields['email'] = strtolower(trim($fields['email']));
            if (!filter_var($fields['email'], FILTER_VALIDATE_EMAIL)) {
                throw new MemberAdminException('சரிபார்ப்பு தோல்வியடைந்தது', 422, ['email' => 'சரியான மின்னஞ்சல் தேவை']);
            }
            if (MemberModel::existsByEmail($fields['email'])) {
                throw new MemberAdminException('சரிபார்ப்பு தோல்வியடைந்தது', 422, ['email' => 'இந்த மின்னஞ்சல் ஏற்கனவே பயன்பாட்டில் உள்ளது']);
            }
        }

        if (empty($fields)) {
            return self::show($id);
        }

        MemberModel::updateFields($id, $fields);
        Audit::log($adminId, 'admin', 'member_profile_edited', 'members', $id, self::pick($member, array_keys($fields)), $fields);

        return self::show($id);
    }

    /** @throws MemberAdminException */
    public static function updateEventParticipation(int $id, int $adminId, array $fields): array
    {
        $member = self::requireMember($id);

        if ($member['status'] === 'approved') {
            throw new MemberAdminException('அனுமதிக்கப்பட்ட கட்டணத்தை திருத்த முடியாது', 409);
        }

        $existing = MemberEventModel::find($id);
        MemberEventModel::upsert($id, $fields);
        Audit::log($adminId, 'admin', 'member_event_edited', 'member_event_participation', $id, $existing, $fields);

        return self::show($id);
    }

    private static function requireMember(int $id): array
    {
        $member = MemberModel::findById($id);
        if (!$member) {
            throw new MemberAdminException('உறுப்பினர் கிடைக்கவில்லை', 404);
        }
        return $member;
    }

    private static function pick(array $arr, array $keys): array
    {
        return array_intersect_key($arr, array_flip($keys));
    }

    private static function cleanupFiles(?array $profile): void
    {
        if (!$profile) return;
        $paths = [];
        if (!empty($profile['member']['photo_path'])) $paths[] = $profile['member']['photo_path'];
        if (!empty($profile['member']['id_proof_path'])) $paths[] = $profile['member']['id_proof_path'];
        foreach ($profile['photos'] ?? [] as $p) $paths[] = $p['file_path'];
        if (!empty($profile['horoscope']['horoscope_file_path'])) $paths[] = $profile['horoscope']['horoscope_file_path'];
        if (!empty($profile['family']['family_photo_path'])) $paths[] = $profile['family']['family_photo_path'];
        if (!empty($profile['event']['receipt_path'])) $paths[] = $profile['event']['receipt_path'];

        foreach ($paths as $relative) {
            $full = __DIR__ . '/../uploads/' . $relative;
            if (is_file($full)) {
                @unlink($full);
            }
        }
    }
}

final class MemberAdminException extends RuntimeException
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
