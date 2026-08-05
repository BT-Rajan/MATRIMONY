<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';

/**
 * Writes to audit_log for every action that matters: logins, approvals,
 * edits, deletions, payments. Pass 1 wires the mechanism + auth events;
 * later passes call Audit::log(...) from every controller that mutates data.
 */
final class Audit
{
    public static function log(
        ?int $actorId,
        string $actorType,
        string $action,
        ?string $entityType = null,
        ?int $entityId = null,
        ?array $oldValues = null,
        ?array $newValues = null
    ): void {
        try {
            $db = Database::connection();
            $stmt = $db->prepare(
                'INSERT INTO audit_log
                    (actor_id, actor_type, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent, created_at)
                 VALUES
                    (:actor_id, :actor_type, :action, :entity_type, :entity_id, :old_values, :new_values, :ip, :ua, NOW())'
            );
            $stmt->execute([
                'actor_id' => $actorId,
                'actor_type' => $actorType,
                'action' => $action,
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'old_values' => $oldValues ? json_encode($oldValues, JSON_UNESCAPED_UNICODE) : null,
                'new_values' => $newValues ? json_encode($newValues, JSON_UNESCAPED_UNICODE) : null,
                'ip' => $_SERVER['REMOTE_ADDR'] ?? null,
                'ua' => $_SERVER['HTTP_USER_AGENT'] ?? null,
            ]);
        } catch (Throwable $e) {
            // Audit logging must never break the primary request; fall back to file log.
            Logger::error('Audit write failed: ' . $e->getMessage());
        }
    }
}
