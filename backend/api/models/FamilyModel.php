<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';

final class FamilyModel
{
    public static function find(int $memberId): ?array
    {
        $stmt = Database::connection()->prepare('SELECT * FROM member_family WHERE member_id = :id');
        $stmt->execute(['id' => $memberId]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public static function upsert(int $memberId, array $fields): void
    {
        $fields['member_id'] = $memberId;
        $columns = array_keys($fields);
        $placeholders = array_map(fn($c) => ":{$c}", $columns);
        $updates = implode(', ', array_map(fn($c) => "{$c} = VALUES({$c})", array_filter($columns, fn($c) => $c !== 'member_id')));

        $sql = 'INSERT INTO member_family (' . implode(', ', $columns) . ') VALUES (' . implode(', ', $placeholders) . ')'
             . " ON DUPLICATE KEY UPDATE {$updates}";

        $stmt = Database::connection()->prepare($sql);
        $stmt->execute($fields);
    }
}
