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

    /**
     * Full profile for the admin view. Registration is now a single flat
     * row on `members` (no more wizard sub-tables), so this is just
     * findById kept under its existing name for callers in Pass 4/5/6.
     */
    public static function findFullProfile(int $id): ?array
    {
        $member = self::findById($id);
        return $member ? ['member' => $member] : null;
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
                       status, is_verified, created_at,
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
                       gothram, address, quarter, height_cm, father_name, mother_name,
                       native_place, residence, registrar_name, brothers, sisters, participating,
                       payment_amount, payment_date, payment_reference, created_at
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

    /**
     * Same filters, joined against the remaining master tables so the
     * booklet can print human-readable names (education/occupation/
     * star/sign) rather than raw IDs. Capped like export. Shows the
     * payment screenshot in place of a profile photo — there's no
     * photo upload in this form.
     */
    public static function searchForBooklet(array $filters, int $maxRows = 200): array
    {
        [$whereSql, $params] = self::buildFilterClauses($filters);
        $db = Database::connection();

        $sql = "SELECT
                    m.id, m.registration_number, m.name_tamil, m.name_english, m.gender,
                    TIMESTAMPDIFF(YEAR, m.dob, CURDATE()) AS age,
                    m.height_cm, m.gothram, m.address, m.quarter, m.native_place, m.residence,
                    m.father_name, m.mother_name, m.registrar_name, m.brothers, m.sisters,
                    m.participating, m.payment_screenshot_path,
                    edu.name_tamil AS education_tamil, edu.name_english AS education_english,
                    occ.name_tamil AS occupation_tamil, occ.name_english AS occupation_english,
                    star.name_tamil AS star_tamil, star.name_english AS star_english,
                    rasi.name_tamil AS rasi_tamil, rasi.name_english AS rasi_english
                FROM members m
                LEFT JOIN educations edu ON edu.id = m.education_id
                LEFT JOIN occupations occ ON occ.id = m.occupation_id
                LEFT JOIN stars star ON star.id = m.star_id
                LEFT JOIN rasis rasi ON rasi.id = m.rasi_id
                {$whereSql}
                ORDER BY m.registration_number ASC
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
        if (!empty($filters['education_id'])) {
            $where[] = 'education_id = :education_id';
            $params['education_id'] = (int) $filters['education_id'];
        }
        if (!empty($filters['occupation_id'])) {
            $where[] = 'occupation_id = :occupation_id';
            $params['occupation_id'] = (int) $filters['occupation_id'];
        }
        if (!empty($filters['star_id'])) {
            $where[] = 'star_id = :star_id';
            $params['star_id'] = (int) $filters['star_id'];
        }
        if (!empty($filters['rasi_id'])) {
            $where[] = 'rasi_id = :rasi_id';
            $params['rasi_id'] = (int) $filters['rasi_id'];
        }
        if (!empty($filters['native_place'])) {
            $where[] = 'native_place LIKE :native_place';
            $params['native_place'] = "%{$filters['native_place']}%";
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
        if (isset($filters['participating']) && $filters['participating'] !== '') {
            $where[] = 'participating = :participating';
            $params['participating'] = $filters['participating'];
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
