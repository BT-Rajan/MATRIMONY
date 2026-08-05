<?php
declare(strict_types=1);

require_once __DIR__ . '/Config.php';

/**
 * Single shared PDO connection. PDO + prepared statements only — no mysqli,
 * no raw string-concatenated SQL anywhere in this codebase.
 */
final class Database
{
    private static ?PDO $connection = null;

    public static function connection(): PDO
    {
        if (self::$connection === null) {
            $host = env('DB_HOST', '127.0.0.1');
            $port = env('DB_PORT', '3306');
            $name = env('DB_NAME', 'karkathar_matrimony');
            $user = env('DB_USER', 'root');
            $pass = env('DB_PASS', '');
            $charset = env('DB_CHARSET', 'utf8mb4');

            $dsn = "mysql:host={$host};port={$port};dbname={$name};charset={$charset}";

            try {
                self::$connection = new PDO($dsn, $user, $pass, [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES {$charset}",
                ]);
            } catch (PDOException $e) {
                Logger::error('DB connection failed: ' . $e->getMessage());
                Response::error('சேவையக இணைப்பு பிழை. பின்னர் முயற்சிக்கவும்.', 500);
                exit;
            }
        }

        return self::$connection;
    }
}
