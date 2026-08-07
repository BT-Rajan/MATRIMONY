<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';

final class SavedSearchModel
{
    public static function listForAdmin(int $adminId): array
    {
        $stmt = Database::connection()->prepare(
            'SELECT id, name, filters, created_at FROM saved_searches WHERE admin_id = :admin_id ORDER BY created_at DESC'
        );
        $stmt->execute(['admin_id' => $adminId]);
        return array_map(static function ($row) {
            $row['filters'] = json_decode($row['filters'], true);
            return $row;
        }, $stmt->fetchAll());
    }

    public static function find(int $id, int $adminId): ?array
    {
        $stmt = Database::connection()->prepare(
            'SELECT id, name, filters, created_at FROM saved_searches WHERE id = :id AND admin_id = :admin_id'
        );
        $stmt->execute(['id' => $id, 'admin_id' => $adminId]);
        $row = $stmt->fetch();
        if (!$row) {
            return null;
        }
        $row['filters'] = json_decode($row['filters'], true);
        return $row;
    }

    public static function create(int $adminId, string $name, array $filters): int
    {
        $stmt = Database::connection()->prepare(
            'INSERT INTO saved_searches (admin_id, name, filters) VALUES (:admin_id, :name, :filters)'
        );
        $stmt->execute([
            'admin_id' => $adminId,
            'name' => $name,
            'filters' => json_encode($filters, JSON_UNESCAPED_UNICODE),
        ]);
        return (int) Database::connection()->lastInsertId();
    }

    public static function delete(int $id, int $adminId): bool
    {
        $stmt = Database::connection()->prepare('DELETE FROM saved_searches WHERE id = :id AND admin_id = :admin_id');
        $stmt->execute(['id' => $id, 'admin_id' => $adminId]);
        return $stmt->rowCount() > 0;
    }
}
