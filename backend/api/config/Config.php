<?php
declare(strict_types=1);

/**
 * Minimal .env loader (no composer dependency).
 * Reads backend/.env and exposes values via env().
 */
final class Config
{
    private static array $values = [];
    private static bool $loaded = false;

    public static function load(): void
    {
        if (self::$loaded) {
            return;
        }
        self::$loaded = true;

        $envFile = dirname(__DIR__, 2) . '/.env';
        if (!is_file($envFile)) {
            $envFile = dirname(__DIR__, 2) . '/.env.example';
        }
        if (is_file($envFile)) {
            foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
                $line = trim($line);
                if ($line === '' || str_starts_with($line, '#')) {
                    continue;
                }
                [$key, $value] = array_pad(explode('=', $line, 2), 2, '');
                self::$values[trim($key)] = trim($value);
            }
        }
    }

    public static function get(string $key, mixed $default = null): mixed
    {
        self::load();
        return self::$values[$key] ?? $default;
    }
}

function env(string $key, mixed $default = null): mixed
{
    return Config::get($key, $default);
}
