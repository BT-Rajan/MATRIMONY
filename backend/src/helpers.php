<?php
declare(strict_types=1);

date_default_timezone_set('Asia/Kolkata');

const TERMS_VERSION = '2';
const FEE = 800;

final class ApiError extends Exception
{
    public function __construct(public int $status, string $code, public array $errors = [])
    {
        parent::__construct($code);
    }
}

function env(string $key, ?string $default = null): ?string
{
    static $vars = null;
    if ($vars === null) {
        $vars = [];
        $file = __DIR__ . '/../.env';
        if (is_file($file)) {
            foreach (file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
                $line = trim($line);
                if ($line === '' || $line[0] === '#' || !str_contains($line, '=')) continue;
                [$k, $v] = explode('=', $line, 2);
                $vars[trim($k)] = trim($v, " \t\"'");
            }
        }
    }
    if (isset($vars[$key])) return $vars[$key];
    $e = getenv($key);
    return $e !== false ? $e : $default;
}

function db(): PDO
{
    static $pdo = null;
    return $pdo ??= new PDO(
        'mysql:host=' . env('DB_HOST', '127.0.0.1') . ';port=' . env('DB_PORT', '3306')
        . ';dbname=' . env('DB_NAME', 'matrimony') . ';charset=utf8mb4',
        env('DB_USER', 'root'),
        env('DB_PASS', ''),
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::MYSQL_ATTR_FOUND_ROWS => true,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET time_zone = '+05:30'",
        ]
    );
}

function now(): string
{
    return date('Y-m-d H:i:s');
}

function out(mixed $data, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

function fail(int $status, string $code, array $errors = []): never
{
    throw new ApiError($status, $code, $errors);
}

function body(): array
{
    static $b = null;
    if ($b === null) {
        $raw = (string)file_get_contents('php://input');
        if (strlen($raw) > 65536) fail(413, 'too_large');
        $b = $raw === '' ? [] : json_decode($raw, true);
        if (!is_array($b)) fail(400, 'bad_request');
    }
    return $b;
}

function client_ip(): string
{
    $h = env('IP_HEADER');
    $ip = ($h && !empty($_SERVER[$h])) ? trim(explode(',', (string)$_SERVER[$h])[0]) : (string)($_SERVER['REMOTE_ADDR'] ?? '');
    return filter_var($ip, FILTER_VALIDATE_IP) ? $ip : '0.0.0.0';
}

/* ---------- rate limiting ---------- */

function throttle_key(string $bucket, string $id): string
{
    return hash('sha256', $bucket . '|' . $id);
}

function throttle_check(string $bucket, string $id, int $max, int $window): void
{
    $st = db()->prepare('SELECT COUNT(*) FROM throttle WHERE k = ? AND created_at > ?');
    $st->execute([throttle_key($bucket, $id), date('Y-m-d H:i:s', time() - $window)]);
    if ((int)$st->fetchColumn() >= $max) fail(429, 'throttled');
}

function throttle_hit(string $bucket, string $id): void
{
    db()->prepare('INSERT INTO throttle (k, created_at) VALUES (?, ?)')->execute([throttle_key($bucket, $id), now()]);
    if (random_int(1, 50) === 1) {
        db()->prepare('DELETE FROM throttle WHERE created_at < ?')->execute([date('Y-m-d H:i:s', time() - 86400)]);
    }
}

/* ---------- session / csrf / auth ---------- */

function start_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) return;
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
    session_name('KKSID');
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'secure' => $https, 'httponly' => true, 'samesite' => 'Lax']);
    session_start();
    if (isset($_SESSION['last']) && time() - (int)$_SESSION['last'] > 3600) {
        reset_session();
    }
    $_SESSION['last'] = time();
}

function reset_session(): void
{
    $_SESSION = [];
    session_regenerate_id(true);
}

function csrf_token(): string
{
    start_session();
    return $_SESSION['csrf'] ??= bin2hex(random_bytes(32));
}

function csrf_check(): void
{
    $t = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!is_string($t) || !hash_equals(csrf_token(), $t)) fail(419, 'csrf');
}

function current_user(): ?array
{
    start_session();
    $id = $_SESSION['uid'] ?? null;
    if (!$id) return null;
    $st = db()->prepare('SELECT id, name, username, role, is_active FROM users WHERE id = ?');
    $st->execute([$id]);
    $u = $st->fetch();
    if (!$u || !$u['is_active']) {
        reset_session();
        return null;
    }
    $u['id'] = (int)$u['id'];
    unset($u['is_active']);
    return $u;
}

function require_user(?string $role = null): array
{
    $u = current_user();
    if (!$u) fail(401, 'unauthorized');
    if ($role !== null && $u['role'] !== $role) fail(403, 'forbidden');
    return $u;
}

function audit(int $appId, ?int $userId, string $action, ?string $from = null, ?string $to = null, ?string $note = null): void
{
    db()->prepare('INSERT INTO application_history (application_id, user_id, action, from_status, to_status, note) VALUES (?, ?, ?, ?, ?, ?)')
        ->execute([$appId, $userId, $action, $from, $to, $note]);
}

function clean_str(mixed $v): string
{
    if (!is_string($v)) return '';
    $v = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $v) ?? '';
    return trim(preg_replace('/[ \t]+/u', ' ', $v) ?? '');
}
