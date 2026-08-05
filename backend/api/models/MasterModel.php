<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';

final class MasterModel
{
    public static function paginate(array $config, ?string $search, ?int $parentId, int $page, int $perPage): array
    {
        $table = $config['table'];
        $db = Database::connection();

        $where = [];
        $params = [];

        if ($search !== null && $search !== '') {
            $where[] = '(name_tamil LIKE :search1 OR name_english LIKE :search2)';
            $params['search1'] = "%{$search}%";
            $params['search2'] = "%{$search}%";
        }

        if ($config['type'] === 'hierarchical' && $parentId !== null) {
            $col = $config['parent_column'];
            $where[] = "{$col} = :parent_id";
            $params['parent_id'] = $parentId;
        }

        $whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

        $countStmt = $db->prepare("SELECT COUNT(*) AS total FROM {$table} {$whereSql}");
        $countStmt->execute($params);
        $total = (int) $countStmt->fetch()['total'];

        $offset = max(0, ($page - 1) * $perPage);
        $sql = "SELECT * FROM {$table} {$whereSql} ORDER BY sort_order ASC, name_english ASC LIMIT :limit OFFSET :offset";
        $stmt = $db->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue(":{$k}", $v);
        }
        $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return ['items' => $stmt->fetchAll(), 'total' => $total];
    }

    public static function find(array $config, int $id): ?array
    {
        $table = $config['table'];
        $stmt = Database::connection()->prepare("SELECT * FROM {$table} WHERE id = :id LIMIT 1");
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public static function nameExists(array $config, string $nameEnglish, ?int $parentId, ?int $excludeId): bool
    {
        $table = $config['table'];
        $where = ['name_english = :name'];
        $params = ['name' => $nameEnglish];

        if ($config['type'] === 'hierarchical') {
            $col = $config['parent_column'];
            $where[] = "{$col} = :parent_id";
            $params['parent_id'] = $parentId;
        }
        if ($excludeId !== null) {
            $where[] = 'id != :exclude_id';
            $params['exclude_id'] = $excludeId;
        }

        $sql = "SELECT id FROM {$table} WHERE " . implode(' AND ', $where) . ' LIMIT 1';
        $stmt = Database::connection()->prepare($sql);
        $stmt->execute($params);
        return (bool) $stmt->fetch();
    }

    public static function parentExists(array $config, int $parentId): bool
    {
        $parentConfig = MasterRegistry::find($config['parent_slug']);
        $table = $parentConfig['table'];
        $stmt = Database::connection()->prepare("SELECT id FROM {$table} WHERE id = :id LIMIT 1");
        $stmt->execute(['id' => $parentId]);
        return (bool) $stmt->fetch();
    }

    public static function create(array $config, array $fields, int $actorId): int
    {
        $table = $config['table'];
        $fields['created_by'] = $actorId;
        $fields['updated_by'] = $actorId;

        $columns = array_keys($fields);
        $placeholders = array_map(fn($c) => ":{$c}", $columns);

        $sql = "INSERT INTO {$table} (" . implode(', ', $columns) . ') VALUES (' . implode(', ', $placeholders) . ')';
        $stmt = Database::connection()->prepare($sql);
        $stmt->execute($fields);

        return (int) Database::connection()->lastInsertId();
    }

    public static function update(array $config, int $id, array $fields, int $actorId): void
    {
        $table = $config['table'];
        $fields['updated_by'] = $actorId;

        $set = implode(', ', array_map(fn($c) => "{$c} = :{$c}", array_keys($fields)));
        $sql = "UPDATE {$table} SET {$set} WHERE id = :id";
        $fields['id'] = $id;

        $stmt = Database::connection()->prepare($sql);
        $stmt->execute($fields);
    }

    /** @throws PDOException on FK RESTRICT violation (row still referenced by children) */
    public static function delete(array $config, int $id): void
    {
        $table = $config['table'];
        $stmt = Database::connection()->prepare("DELETE FROM {$table} WHERE id = :id");
        $stmt->execute(['id' => $id]);
    }
}
