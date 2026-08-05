<?php
declare(strict_types=1);

final class Logger
{
    private static function logDir(): string
    {
        $dir = __DIR__ . '/../logs';
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        return $dir;
    }

    public static function error(string $message): void
    {
        self::write('error.log', $message);
    }

    public static function info(string $message): void
    {
        self::write('info.log', $message);
    }

    private static function write(string $file, string $message): void
    {
        $line = sprintf('[%s] %s%s', date('Y-m-d H:i:s'), $message, PHP_EOL);
        file_put_contents(self::logDir() . '/' . $file, $line, FILE_APPEND | LOCK_EX);
    }
}
