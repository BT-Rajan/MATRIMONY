<?php
declare(strict_types=1);

/**
 * Daily maintenance: purge rows that only ever needed to exist for a
 * short window. Run via cron — see docs/DEPLOYMENT.md "Cron jobs".
 *
 *   php /path/to/backend/api/cli/cleanup.php
 *
 * Never touches members, audit_log, or any registration data — only
 * the two tables that are expected to grow unboundedly if nothing
 * ever prunes them.
 */

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../helpers/Logger.php';

// Retention windows — generous by design; these are operational logs,
// not records anyone needs to keep indefinitely.
const LOGIN_ATTEMPTS_RETENTION_DAYS = 30;
const NOTIFICATIONS_RETENTION_DAYS = 180;

function main(): void
{
    $db = Database::connection();

    $stmt = $db->prepare('DELETE FROM login_attempts WHERE created_at < (NOW() - INTERVAL :days DAY)');
    $stmt->execute(['days' => LOGIN_ATTEMPTS_RETENTION_DAYS]);
    $loginAttemptsDeleted = $stmt->rowCount();

    $stmt = $db->prepare('DELETE FROM notifications WHERE created_at < (NOW() - INTERVAL :days DAY)');
    $stmt->execute(['days' => NOTIFICATIONS_RETENTION_DAYS]);
    $notificationsDeleted = $stmt->rowCount();

    $summary = "cleanup.php: removed {$loginAttemptsDeleted} login_attempts row(s) older than "
        . LOGIN_ATTEMPTS_RETENTION_DAYS . "d, {$notificationsDeleted} notifications row(s) older than "
        . NOTIFICATIONS_RETENTION_DAYS . "d";

    Logger::info($summary);
    echo $summary . PHP_EOL;
}

main();
