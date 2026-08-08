<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../config/StatsDimensionRegistry.php';

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

    /** Breakdown by a whitelisted master-linked dimension (religion/caste/education/occupation/income/district). */
    public static function breakdown(string $dimensionKey, int $limit = 15): array
    {
        $dim = StatsDimensionRegistry::find($dimensionKey);
        $db = Database::connection();

        $sql = "SELECT t.name_tamil, t.name_english, COUNT(m.id) AS count
                FROM members m
                JOIN {$dim['table']} t ON t.id = m.{$dim['column']}
                GROUP BY t.id, t.name_tamil, t.name_english
                ORDER BY count DESC
                LIMIT :limit";
        $stmt = $db->prepare($sql);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    public static function ageBreakdown(): array
    {
        $db = Database::connection();

        $sql = "SELECT
                    CASE
                        WHEN TIMESTAMPDIFF(YEAR, dob, CURDATE()) BETWEEN 18 AND 25 THEN '18-25'
                        WHEN TIMESTAMPDIFF(YEAR, dob, CURDATE()) BETWEEN 26 AND 30 THEN '26-30'
                        WHEN TIMESTAMPDIFF(YEAR, dob, CURDATE()) BETWEEN 31 AND 35 THEN '31-35'
                        WHEN TIMESTAMPDIFF(YEAR, dob, CURDATE()) BETWEEN 36 AND 40 THEN '36-40'
                        WHEN TIMESTAMPDIFF(YEAR, dob, CURDATE()) BETWEEN 41 AND 50 THEN '41-50'
                        WHEN TIMESTAMPDIFF(YEAR, dob, CURDATE()) > 50 THEN '50+'
                        ELSE 'தெரியாத'
                    END AS age_band,
                    COUNT(*) AS count
                FROM members
                WHERE dob IS NOT NULL
                GROUP BY age_band
                ORDER BY FIELD(age_band, '18-25','26-30','31-35','36-40','41-50','50+','தெரியாத')";

        return $db->query($sql)->fetchAll();
    }

    public static function payments(): array
    {
        $db = Database::connection();

        $summary = $db->query(
            "SELECT COUNT(*) AS paid_count, COALESCE(SUM(amount), 0) AS total_amount
             FROM member_event_participation WHERE amount IS NOT NULL"
        )->fetch();

        $byType = $db->query(
            "SELECT pt.name_tamil, pt.name_english, COUNT(*) AS count, COALESCE(SUM(ep.amount), 0) AS total_amount
             FROM member_event_participation ep
             JOIN payment_types pt ON pt.id = ep.payment_type_id
             WHERE ep.amount IS NOT NULL
             GROUP BY pt.id, pt.name_tamil, pt.name_english
             ORDER BY total_amount DESC"
        )->fetchAll();

        return [
            'paid_count' => (int) $summary['paid_count'],
            'total_amount' => (float) $summary['total_amount'],
            'by_payment_type' => $byType,
        ];
    }

    public static function events(): array
    {
        $db = Database::connection();

        return $db->query(
            "SELECT e.id, e.name_tamil, e.name_english, e.event_date,
                    COUNT(ep.member_id) AS participant_count,
                    COALESCE(SUM(ep.amount), 0) AS total_amount
             FROM events e
             LEFT JOIN member_event_participation ep ON ep.event_id = e.id AND ep.participating = 'yes'
             GROUP BY e.id, e.name_tamil, e.name_english, e.event_date
             ORDER BY e.event_date DESC"
        )->fetchAll();
    }
}
