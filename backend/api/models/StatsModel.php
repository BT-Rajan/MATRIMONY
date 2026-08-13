<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';

final class StatsModel
{
    public static function overview(): array
    {
        $db = Database::connection();

        $byStatus = $db->query(
            "SELECT status, COUNT(*) AS count FROM members GROUP BY status"
        )->fetchAll(PDO::FETCH_KEY_PAIR);

        $byGender = $db->query(
            "SELECT gender, COUNT(*) AS count FROM members GROUP BY gender"
        )->fetchAll(PDO::FETCH_KEY_PAIR);

        $verified = (int) $db->query("SELECT COUNT(*) FROM members WHERE is_verified = 1")->fetchColumn();
        $total = (int) $db->query("SELECT COUNT(*) FROM members")->fetchColumn();

        $thisMonth = (int) $db->query(
            "SELECT COUNT(*) FROM members WHERE YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())"
        )->fetchColumn();

        $today = (int) $db->query("SELECT COUNT(*) FROM members WHERE DATE(created_at) = CURDATE()")->fetchColumn();

        return [
            'total' => $total,
            'verified' => $verified,
            'today' => $today,
            'this_month' => $thisMonth,
            'by_status' => [
                'draft' => (int) ($byStatus['draft'] ?? 0),
                'pending_approval' => (int) ($byStatus['pending_approval'] ?? 0),
                'approved' => (int) ($byStatus['approved'] ?? 0),
                'rejected' => (int) ($byStatus['rejected'] ?? 0),
                'blocked' => (int) ($byStatus['blocked'] ?? 0),
                'archived' => (int) ($byStatus['archived'] ?? 0),
            ],
            'by_gender' => [
                'groom' => (int) ($byGender['groom'] ?? 0),
                'bride' => (int) ($byGender['bride'] ?? 0),
            ],
        ];
    }

    /** @param 'daily'|'monthly' $period */
    public static function registrationTrend(string $period, int $points): array
    {
        $db = Database::connection();

        if ($period === 'monthly') {
            $sql = "SELECT DATE_FORMAT(created_at, '%Y-%m') AS bucket, COUNT(*) AS count
                    FROM members
                    WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL :points MONTH)
                    GROUP BY bucket ORDER BY bucket ASC";
        } else {
            $sql = "SELECT DATE(created_at) AS bucket, COUNT(*) AS count
                    FROM members
                    WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL :points DAY)
                    GROUP BY bucket ORDER BY bucket ASC";
        }

        $stmt = $db->prepare($sql);
        $stmt->bindValue(':points', $points, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    public static function payments(): array
    {
        $db = Database::connection();

        $summary = $db->query(
            "SELECT COUNT(*) AS paid_count, COALESCE(SUM(payment_amount), 0) AS total_amount
             FROM members WHERE payment_amount IS NOT NULL"
        )->fetch();

        return [
            'paid_count' => (int) $summary['paid_count'],
            'total_amount' => (float) $summary['total_amount'],
        ];
    }
}
