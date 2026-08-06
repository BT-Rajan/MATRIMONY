<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';

final class MemberModel
{
    public static function findByEmailOrMobile(string $identifier): ?array
    {
        $stmt = Database::connection()->prepare(
            'SELECT * FROM members WHERE (email = :identifier OR mobile = :identifier) LIMIT 1'
        );
        $stmt->execute(['identifier' => $identifier]);
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
}
