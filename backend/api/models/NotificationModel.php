<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';

final class NotificationModel
{
    public static function log(
        int $memberId,
        string $eventType,
        string $channel,
        string $recipient,
        ?string $subject,
        string $message,
        string $status,
        ?string $errorMessage = null
    ): void {
        $stmt = Database::connection()->prepare(
            'INSERT INTO notifications (member_id, event_type, channel, recipient, subject, message, status, error_message)
             VALUES (:member_id, :event_type, :channel, :recipient, :subject, :message, :status, :error_message)'
        );
        $stmt->execute([
            'member_id' => $memberId,
            'event_type' => $eventType,
            'channel' => $channel,
            'recipient' => $recipient,
            'subject' => $subject,
            'message' => $message,
            'status' => $status,
            'error_message' => $errorMessage,
        ]);
    }

    public static function paginate(array $filters, int $page, int $perPage): array
    {
        $db = Database::connection();
        $where = [];
        $params = [];

        if (!empty($filters['member_id'])) {
            $where[] = 'n.member_id = :member_id';
            $params['member_id'] = (int) $filters['member_id'];
        }
        if (!empty($filters['channel'])) {
            $where[] = 'n.channel = :channel';
            $params['channel'] = $filters['channel'];
        }
        if (!empty($filters['status'])) {
            $where[] = 'n.status = :status';
            $params['status'] = $filters['status'];
        }
        if (!empty($filters['event_type'])) {
            $where[] = 'n.event_type = :event_type';
            $params['event_type'] = $filters['event_type'];
        }

        $whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

        $countStmt = $db->prepare("SELECT COUNT(*) AS total FROM notifications n {$whereSql}");
        $countStmt->execute($params);
        $total = (int) $countStmt->fetch()['total'];

        $offset = max(0, ($page - 1) * $perPage);
        $sql = "SELECT n.*, m.registration_number, m.name_tamil, m.name_english
                FROM notifications n
                JOIN members m ON m.id = n.member_id
                {$whereSql}
                ORDER BY n.created_at DESC
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

    public static function find(int $id): ?array
    {
        $stmt = Database::connection()->prepare('SELECT * FROM notifications WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public static function counts(): array
    {
        $rows = Database::connection()
            ->query('SELECT status, COUNT(*) AS count FROM notifications GROUP BY status')
            ->fetchAll(PDO::FETCH_KEY_PAIR);

        return [
            'sent' => (int) ($rows['sent'] ?? 0),
            'failed' => (int) ($rows['failed'] ?? 0),
            'skipped' => (int) ($rows['skipped'] ?? 0),
        ];
    }
}
