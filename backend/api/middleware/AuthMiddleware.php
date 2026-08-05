<?php
declare(strict_types=1);

require_once __DIR__ . '/../helpers/Jwt.php';
require_once __DIR__ . '/../helpers/Response.php';

final class AuthMiddleware
{
    /**
     * Returns the verified token payload, e.g. ['sub' => 12, 'role' => 'admin', ...].
     * Halts the request with 401 if the token is missing/invalid/expired.
     */
    public static function requireAuth(?array $allowedRoles = null): array
    {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? ($_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '');

        if (!$header || !preg_match('/^Bearer\s+(.+)$/i', $header, $matches)) {
            Response::error('அங்கீகாரம் தேவை', 401);
        }

        $payload = Jwt::decode($matches[1]);
        if (!$payload) {
            Response::error('அமர்வு காலாவதியானது. மீண்டும் உள்நுழையவும்.', 401);
        }

        if ($allowedRoles !== null && !in_array($payload['role'] ?? null, $allowedRoles, true)) {
            Response::error('இந்த செயலுக்கு அனுமதி இல்லை', 403);
        }

        return $payload;
    }
}
