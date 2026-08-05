<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/Config.php';

/**
 * Minimal, dependency-free HS256 JWT implementation.
 * Written by hand (no firebase/php-jwt) because this project intentionally
 * has zero Composer/third-party runtime dependencies for easy shared hosting
 * deployment. Only HS256 is supported — that's all this app needs.
 */
final class Jwt
{
    private static function secret(): string
    {
        $secret = env('JWT_SECRET');
        if (!$secret) {
            throw new RuntimeException('JWT_SECRET is not configured');
        }
        return $secret;
    }

    public static function encode(array $payload, ?int $ttlSeconds = null): string
    {
        $ttl = $ttlSeconds ?? (int) env('JWT_TTL_SECONDS', 28800); // 8 hours default
        $now = time();

        $header = ['typ' => 'JWT', 'alg' => 'HS256'];
        $payload = array_merge($payload, [
            'iat' => $now,
            'exp' => $now + $ttl,
        ]);

        $segments = [
            self::base64UrlEncode(json_encode($header, JSON_UNESCAPED_UNICODE)),
            self::base64UrlEncode(json_encode($payload, JSON_UNESCAPED_UNICODE)),
        ];

        $signature = hash_hmac('sha256', implode('.', $segments), self::secret(), true);
        $segments[] = self::base64UrlEncode($signature);

        return implode('.', $segments);
    }

    /**
     * Returns the decoded payload array, or null if the token is invalid,
     * malformed, or expired.
     */
    public static function decode(string $token): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }
        [$headerB64, $payloadB64, $sigB64] = $parts;

        $expectedSig = hash_hmac('sha256', "{$headerB64}.{$payloadB64}", self::secret(), true);
        $actualSig = self::base64UrlDecode($sigB64);

        if (!hash_equals($expectedSig, $actualSig)) {
            return null;
        }

        $payload = json_decode(self::base64UrlDecode($payloadB64), true);
        if (!is_array($payload)) {
            return null;
        }

        if (isset($payload['exp']) && time() >= (int) $payload['exp']) {
            return null; // expired
        }

        return $payload;
    }

    private static function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $data): string
    {
        $padded = str_pad($data, strlen($data) % 4 === 0 ? strlen($data) : strlen($data) + (4 - strlen($data) % 4), '=');
        return base64_decode(strtr($padded, '-_', '+/')) ?: '';
    }
}
