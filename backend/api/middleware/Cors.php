<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/Config.php';

final class Cors
{
    public static function handle(): void
    {
        $allowedOrigin = env('CORS_ALLOWED_ORIGIN', 'http://localhost:5173');

        header("Access-Control-Allow-Origin: {$allowedOrigin}");
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        header('Access-Control-Allow-Credentials: true');
        header('Content-Type: application/json; charset=utf-8');

        // API responses are JSON only — never let a browser guess otherwise
        // and try to render an uploaded file's URL or an error body as HTML.
        header('X-Content-Type-Options: nosniff');
        header('X-Frame-Options: DENY');
        header('Referrer-Policy: strict-origin-when-cross-origin');

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
    }
}
