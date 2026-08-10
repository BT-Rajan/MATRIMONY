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

    /**
     * Generic version for non-login endpoints (e.g. public registration
     * Step 1): counts ALL attempts in the window regardless of outcome,
     * with a caller-chosen threshold — registration spam isn't a
     * "wrong password" scenario, so success/failure isn't the relevant
     * signal, volume is. Reuses the same login_attempts table; the
     * identifier prefix (e.g. "register_ip:") keeps it namespaced from
     * real login attempts.
     */
    public static function tooManyRecentAttempts(string $identifier, int $maxAttempts, int $windowMinutes): bool
    {
        $db = Database::connection();
        $stmt = $db->prepare(
            'SELECT COUNT(*) AS attempts FROM login_attempts
             WHERE identifier = :identifier
               AND created_at >= (NOW() - INTERVAL :minutes MINUTE)'
        );
        $stmt->bindValue(':identifier', $identifier);
        $stmt->bindValue(':minutes', $windowMinutes, PDO::PARAM_INT);
        $stmt->execute();
        $row = $stmt->fetch();

        return (int) ($row['attempts'] ?? 0) >= $maxAttempts;
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
