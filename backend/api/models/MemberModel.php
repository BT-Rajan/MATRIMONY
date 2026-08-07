<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';

final class MemberModel
{
    public static function findByEmailOrMobile(string $identifier): ?array
    {
        $stmt = Database::connection()->prepare(
            'SELECT * FROM members WHERE (email = :identifier1 OR mobile = :identifier2) LIMIT 1'
        );
        $stmt->execute(['identifier1' => $identifier, 'identifier2' => $identifier]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public static function findById(int $id): ?array
    {
        $stmt = Database::connection()->prepare('SELECT * FROM members WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public static function existsByEmail(string $email): bool
    {
        $stmt = Database::connection()->prepare('SELECT id FROM members WHERE email = :email LIMIT 1');
        $stmt->execute(['email' => $email]);
        return (bool) $stmt->fetch();
    }

    public static function existsByMobile(string $mobile): bool
    {
        $stmt = Database::connection()->prepare('SELECT id FROM members WHERE mobile = :mobile LIMIT 1');
        $stmt->execute(['mobile' => $mobile]);
        return (bool) $stmt->fetch();
    }

    public static function touchLastLogin(int $id): void
    {
        $stmt = Database::connection()->prepare('UPDATE members SET last_login_at = NOW() WHERE id = :id');
        $stmt->execute(['id' => $id]);
    }

    /** Atomically reserves the next zero-padded 5-digit registration number. Never reused, even after deletes. */
    public static function nextRegistrationNumber(): string
    {
        $db = Database::connection();
        $db->beginTransaction();
        try {
            $db->query('SELECT last_number FROM registration_number_sequence WHERE id = 1 FOR UPDATE')->fetch();
            $db->exec('UPDATE registration_number_sequence SET last_number = last_number + 1 WHERE id = 1');
            $next = (int) $db->query('SELECT last_number FROM registration_number_sequence WHERE id = 1')->fetchColumn();
            $db->commit();
            return str_pad((string) $next, 5, '0', STR_PAD_LEFT);
        } catch (Throwable $e) {
            $db->rollBack();
            throw $e;
        }
    }

    /** Step 1: create the draft member row. Returns the new member id. */
    public static function createDraft(array $fields): int
    {
        $columns = array_keys($fields);
        $placeholders = array_map(fn($c) => ":{$c}", $columns);
        $sql = 'INSERT INTO members (' . implode(', ', $columns) . ') VALUES (' . implode(', ', $placeholders) . ')';
        $stmt = Database::connection()->prepare($sql);
        $stmt->execute($fields);
        return (int) Database::connection()->lastInsertId();
    }

    public static function updateFields(int $id, array $fields): void
    {
        $set = implode(', ', array_map(fn($c) => "{$c} = :{$c}", array_keys($fields)));
        $fields['id'] = $id;
        $stmt = Database::connection()->prepare("UPDATE members SET {$set} WHERE id = :id");
        $stmt->execute($fields);
    }

    public static function advanceStep(int $id, int $step): void
    {
        // Never move a member "backwards" — resuming re-visits earlier
        // steps without losing the furthest point already reached.
        $stmt = Database::connection()->prepare(
            'UPDATE members SET registration_step = GREATEST(registration_step, :step) WHERE id = :id'
        );
        $stmt->execute(['step' => $step, 'id' => $id]);
    }

    public static function markPendingApproval(int $id): void
    {
        $stmt = Database::connection()->prepare(
            "UPDATE members SET status = 'pending_approval', registration_step = GREATEST(registration_step, 6) WHERE id = :id"
        );
        $stmt->execute(['id' => $id]);
    }

    /** Full profile with all wizard sub-tables + additional photos, for the resume screen and admin view (Pass 4). */
    public static function findFullProfile(int $id): ?array
    {
        $db = Database::connection();

        $member = self::findById($id);
        if (!$member) {
            return null;
        }

        $horoscope = self::fetchOne($db, 'SELECT * FROM member_horoscopes WHERE member_id = :id', $id);
        $family = self::fetchOne($db, 'SELECT * FROM member_family WHERE member_id = :id', $id);
        $reference = self::fetchOne($db, 'SELECT * FROM member_references WHERE member_id = :id', $id);
        $event = self::fetchOne($db, 'SELECT * FROM member_event_participation WHERE member_id = :id', $id);

        $photosStmt = $db->prepare('SELECT id, file_path, original_filename FROM member_photos WHERE member_id = :id ORDER BY id ASC');
        $photosStmt->execute(['id' => $id]);

        return [
            'member' => $member,
            'photos' => $photosStmt->fetchAll(),
            'horoscope' => $horoscope,
            'family' => $family,
            'reference' => $reference,
            'event' => $event,
        ];
    }

    public static function countPhotos(int $id): int
    {
        $stmt = Database::connection()->prepare('SELECT COUNT(*) FROM member_photos WHERE member_id = :id');
        $stmt->execute(['id' => $id]);
        return (int) $stmt->fetchColumn();
    }

    public static function addPhoto(int $memberId, string $path, string $originalName): void
    {
        $stmt = Database::connection()->prepare(
            'INSERT INTO member_photos (member_id, file_path, original_filename) VALUES (:member_id, :path, :name)'
        );
        $stmt->execute(['member_id' => $memberId, 'path' => $path, 'name' => $originalName]);
    }

    private static function fetchOne(PDO $db, string $sql, int $id): ?array
    {
        $stmt = $db->prepare($sql);
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    // ---------------------------------------------------------------
    // Admin: listing, filtering, status transitions (Pass 4)
    // Advanced search (Pass 5) extends the same filter builder with
    // range/master/related-table filters — one query builder for the
    // list screen, the advanced search screen, and CSV export.
    // ---------------------------------------------------------------

    public static function adminPaginate(array $filters, int $page, int $perPage): array
    {
        [$whereSql, $params] = self::buildFilterClauses($filters);
        $db = Database::connection();

        $countStmt = $db->prepare("SELECT COUNT(*) AS total FROM members {$whereSql}");
        $countStmt->execute($params);
        $total = (int) $countStmt->fetch()['total'];

        $offset = max(0, ($page - 1) * $perPage);
        $sql = "SELECT id, registration_number, name_tamil, name_english, gender, mobile, email,
                       status, registration_step, is_verified, photo_path, created_at,
                       TIMESTAMPDIFF(YEAR, dob, CURDATE()) AS age
                FROM members {$whereSql}
                ORDER BY created_at DESC
                LIMIT :limit OFFSET :offset";
        $stmt = $db->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue(":{$k}", $v);
        }
        $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return ['items' => $stmt->fetchAll(), 'total' => $total];
    }

    /** Same filters, no pagination (capped), full column set — used by CSV export. */
    public static function searchForExport(array $filters, int $maxRows = 5000): array
    {
        [$whereSql, $params] = self::buildFilterClauses($filters);
        $db = Database::connection();

        $sql = "SELECT registration_number, name_tamil, name_english, gender, mobile, whatsapp, email,
                       status, is_verified, TIMESTAMPDIFF(YEAR, dob, CURDATE()) AS age,
                       height_cm, weight_kg, marital_status, native_place, state, country, created_at
                FROM members {$whereSql}
                ORDER BY created_at DESC
                LIMIT :limit";
        $stmt = $db->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue(":{$k}", $v);
        }
        $stmt->bindValue(':limit', $maxRows, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    private static function buildFilterClauses(array $filters): array
    {
        $where = [];
        $params = [];

        if (!empty($filters['search'])) {
            $where[] = '(registration_number LIKE :s1 OR name_english LIKE :s2 OR name_tamil LIKE :s3 OR mobile LIKE :s4 OR email LIKE :s5)';
            $needle = "%{$filters['search']}%";
            $params['s1'] = $needle; $params['s2'] = $needle; $params['s3'] = $needle;
            $params['s4'] = $needle; $params['s5'] = $needle;
        }
        if (!empty($filters['registration_number'])) {
            $where[] = 'registration_number LIKE :reg_no';
            $params['reg_no'] = "%{$filters['registration_number']}%";
        }
        if (!empty($filters['status'])) {
            $where[] = 'status = :status';
            $params['status'] = $filters['status'];
        }
        if (!empty($filters['gender'])) {
            $where[] = 'gender = :gender';
            $params['gender'] = $filters['gender'];
        }
        if (isset($filters['is_verified']) && $filters['is_verified'] !== '') {
            $where[] = 'is_verified = :is_verified';
            $params['is_verified'] = (int) $filters['is_verified'];
        }
        if (!empty($filters['religion_id'])) {
            $where[] = 'religion_id = :religion_id';
            $params['religion_id'] = (int) $filters['religion_id'];
        }
        if (!empty($filters['caste_id'])) {
            $where[] = 'caste_id = :caste_id';
            $params['caste_id'] = (int) $filters['caste_id'];
        }
        if (!empty($filters['district_id'])) {
            $where[] = 'district_id = :district_id';
            $params['district_id'] = (int) $filters['district_id'];
        }
        if (!empty($filters['education_id'])) {
            $where[] = 'education_id = :education_id';
            $params['education_id'] = (int) $filters['education_id'];
        }
        if (!empty($filters['occupation_id'])) {
            $where[] = 'occupation_id = :occupation_id';
            $params['occupation_id'] = (int) $filters['occupation_id'];
        }
        if (!empty($filters['income_id'])) {
            $where[] = 'income_id = :income_id';
            $params['income_id'] = (int) $filters['income_id'];
        }
        if (!empty($filters['star_id'])) {
            $where[] = 'star_id = :star_id';
            $params['star_id'] = (int) $filters['star_id'];
        }
        if (!empty($filters['rasi_id'])) {
            $where[] = 'rasi_id = :rasi_id';
            $params['rasi_id'] = (int) $filters['rasi_id'];
        }
        if (!empty($filters['dosham_id'])) {
            $where[] = 'dosham_id = :dosham_id';
            $params['dosham_id'] = (int) $filters['dosham_id'];
        }
        if (!empty($filters['state'])) {
            $where[] = 'state LIKE :state';
            $params['state'] = "%{$filters['state']}%";
        }
        if (!empty($filters['country'])) {
            $where[] = 'country LIKE :country';
            $params['country'] = "%{$filters['country']}%";
        }
        if (!empty($filters['phone'])) {
            $where[] = 'mobile LIKE :phone';
            $params['phone'] = "%{$filters['phone']}%";
        }
        if (!empty($filters['email'])) {
            $where[] = 'email LIKE :email';
            $params['email'] = "%{$filters['email']}%";
        }
        if (!empty($filters['age_min'])) {
            $where[] = 'TIMESTAMPDIFF(YEAR, dob, CURDATE()) >= :age_min';
            $params['age_min'] = (int) $filters['age_min'];
        }
        if (!empty($filters['age_max'])) {
            $where[] = 'TIMESTAMPDIFF(YEAR, dob, CURDATE()) <= :age_max';
            $params['age_max'] = (int) $filters['age_max'];
        }
        if (!empty($filters['height_min'])) {
            $where[] = 'height_cm >= :height_min';
            $params['height_min'] = (int) $filters['height_min'];
        }
        if (!empty($filters['height_max'])) {
            $where[] = 'height_cm <= :height_max';
            $params['height_max'] = (int) $filters['height_max'];
        }
        if (!empty($filters['weight_min'])) {
            $where[] = 'weight_kg >= :weight_min';
            $params['weight_min'] = (int) $filters['weight_min'];
        }
        if (!empty($filters['weight_max'])) {
            $where[] = 'weight_kg <= :weight_max';
            $params['weight_max'] = (int) $filters['weight_max'];
        }
        if (isset($filters['photo_available']) && $filters['photo_available'] !== '') {
            $where[] = $filters['photo_available'] ? 'photo_path IS NOT NULL' : 'photo_path IS NULL';
        }
        if (isset($filters['horoscope_available']) && $filters['horoscope_available'] !== '') {
            $where[] = $filters['horoscope_available']
                ? 'EXISTS (SELECT 1 FROM member_horoscopes h WHERE h.member_id = members.id)'
                : 'NOT EXISTS (SELECT 1 FROM member_horoscopes h WHERE h.member_id = members.id)';
        }
        if (isset($filters['payment']) && $filters['payment'] !== '') {
            $where[] = $filters['payment']
                ? 'EXISTS (SELECT 1 FROM member_event_participation ep WHERE ep.member_id = members.id AND ep.amount IS NOT NULL)'
                : 'NOT EXISTS (SELECT 1 FROM member_event_participation ep WHERE ep.member_id = members.id AND ep.amount IS NOT NULL)';
        }
        if (!empty($filters['event_id'])) {
            $where[] = 'EXISTS (SELECT 1 FROM member_event_participation ep2 WHERE ep2.member_id = members.id AND ep2.participating = \'yes\' AND ep2.event_id = :event_id)';
            $params['event_id'] = (int) $filters['event_id'];
        }
        if (!empty($filters['reference'])) {
            $where[] = 'EXISTS (SELECT 1 FROM member_references r WHERE r.member_id = members.id AND (r.reference_name LIKE :ref_name OR r.phone = :ref_phone))';
            $params['ref_name'] = "%{$filters['reference']}%";
            $params['ref_phone'] = $filters['reference'];
        }

        $whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';
        return [$whereSql, $params];
    }

    public static function setStatus(int $id, string $status, int $adminId, ?string $reason = null, ?string $previousStatus = null): void
    {
        $sql = 'UPDATE members SET status = :status, reviewed_by = :admin_id, reviewed_at = NOW()';
        $params = ['status' => $status, 'admin_id' => $adminId, 'id' => $id];

        if ($previousStatus !== null) {
            $sql .= ', previous_status = :previous_status';
            $params['previous_status'] = $previousStatus;
        }
        if ($reason !== null) {
            $sql .= ', rejection_reason = :reason';
            $params['reason'] = $reason;
        } elseif ($status !== 'rejected') {
            $sql .= ', rejection_reason = NULL';
        }

        $sql .= ' WHERE id = :id';
        $stmt = Database::connection()->prepare($sql);
        $stmt->execute($params);
    }

    public static function restorePreviousStatus(int $id, int $adminId): void
    {
        $stmt = Database::connection()->prepare(
            "UPDATE members
             SET status = COALESCE(previous_status, 'approved'), reviewed_by = :admin_id, reviewed_at = NOW(), previous_status = NULL
             WHERE id = :id"
        );
        $stmt->execute(['admin_id' => $adminId, 'id' => $id]);
    }

    public static function setVerified(int $id, bool $verified, int $adminId): void
    {
        $stmt = Database::connection()->prepare(
            'UPDATE members SET is_verified = :v, reviewed_by = :admin_id, reviewed_at = NOW() WHERE id = :id'
        );
        $stmt->execute(['v' => $verified ? 1 : 0, 'admin_id' => $adminId, 'id' => $id]);
    }

    public static function delete(int $id): void
    {
        $stmt = Database::connection()->prepare('DELETE FROM members WHERE id = :id');
        $stmt->execute(['id' => $id]);
    }
}
