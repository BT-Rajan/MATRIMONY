<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';

final class RateLimiter
{
    private const MAX_ATTEMPTS = 6;
    private const WINDOW_MINUTES = 15;

    public static function tooManyAttempts(string $identifier): bool
    {
        $db = Database::connection();
        $stmt = $db->prepare(
            'SELECT COUNT(*) AS attempts FROM login_attempts
             WHERE identifier = :identifier
               AND success = 0
               AND created_at >= (NOW() - INTERVAL :minutes MINUTE)'
        );
        $stmt->bindValue(':identifier', $identifier);
        $stmt->bindValue(':minutes', self::WINDOW_MINUTES, PDO::PARAM_INT);
        $stmt->execute();
        $row = $stmt->fetch();

        return (int) ($row['attempts'] ?? 0) >= self::MAX_ATTEMPTS;
    }

    public static function recordAttempt(string $identifier, bool $success): void
    {
        $db = Database::connection();
        $stmt = $db->prepare(
            'INSERT INTO login_attempts (identifier, success, ip_address, created_at)
             VALUES (:identifier, :success, :ip, NOW())'
        );
        $stmt->execute([
            'identifier' => $identifier,
            'success' => $success ? 1 : 0,
            'ip' => $_SERVER['REMOTE_ADDR'] ?? null,
        ]);
    }
}
