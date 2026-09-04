<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

function json_out(array $data, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function fail(string $message, int $status = 400, array $errors = []): never
{
    $body = ['ok' => false, 'message' => $message];
    if ($errors) {
        $body['errors'] = $errors;
    }
    json_out($body, $status);
}

/** Reads JSON body if present, else falls back to $_POST (for multipart/form-data uploads). */
function input(): array
{
    $raw = file_get_contents('php://input');
    if ($raw !== '' && str_starts_with($_SERVER['CONTENT_TYPE'] ?? '', 'application/json')) {
        $data = json_decode($raw, true);
        return is_array($data) ? $data : [];
    }
    return $_POST;
}

function require_fields(array $in, array $fields): array
{
    $errors = [];
    foreach ($fields as $field => $label) {
        if (trim((string) ($in[$field] ?? '')) === '') {
            $errors[$field] = "{$label} தேவை";
        }
    }
    return $errors;
}

function random_token(int $bytes = 32): string
{
    return bin2hex(random_bytes($bytes));
}

function next_registration_number(PDO $pdo): string
{
    $year = date('Y');
    $stmt = $pdo->prepare(
        "SELECT COUNT(*) FROM profiles WHERE registration_number LIKE :prefix"
    );
    $prefix = "KMS-{$year}-";
    $stmt->execute(['prefix' => "{$prefix}%"]);
    $count = (int) $stmt->fetchColumn() + 1;
    return $prefix . str_pad((string) $count, 4, '0', STR_PAD_LEFT);
}

/** CORS for local/dev use when frontend is served separately. Harmless if same-origin. */
function apply_cors(): void
{
    $origin = env('CORS_ORIGIN', '*');
    header("Access-Control-Allow-Origin: {$origin}");
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-Edit-Token, X-Admin-Token');
    if ($origin !== '*') {
        header('Access-Control-Allow-Credentials: true');
    }
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}
