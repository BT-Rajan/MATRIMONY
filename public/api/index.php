<?php
declare(strict_types=1);

$backend = getenv('BACKEND_PATH') ?: __DIR__ . '/../../backend';
require $backend . '/src/helpers.php';
foreach (['validation', 'auth', 'applications', 'users'] as $f) {
    if (is_file("$backend/src/$f.php")) require "$backend/src/$f.php";
}

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: no-referrer');
ini_set('display_errors', '0');

$routes = [
    ['GET',    '#^/session$#',                    'h_session'],
    ['POST',   '#^/auth/login$#',                 'h_login'],
    ['POST',   '#^/auth/logout$#',                'h_logout'],
    ['POST',   '#^/applications$#',               'h_apply'],
    ['GET',    '#^/stats$#',                      'h_stats'],
    ['GET',    '#^/applications$#',               'h_app_list'],
    ['GET',    '#^/applications/(\d+)$#',         'h_app_get'],
    ['PUT',    '#^/applications/(\d+)$#',         'h_app_update'],
    ['POST',   '#^/applications/(\d+)/decision$#', 'h_app_decide'],
    ['GET',    '#^/users$#',                      'h_users_list'],
    ['POST',   '#^/users$#',                      'h_user_create'],
    ['PUT',    '#^/users/(\d+)$#',                'h_user_update'],
    ['DELETE', '#^/users/(\d+)$#',                'h_user_delete'],
];

try {
    $path = (string)parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
    $i = strpos($path, '/api/');
    $route = $i === false ? '/' : '/' . trim(substr($path, $i + 5), '/');
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    foreach ($routes as [$m, $re, $fn]) {
        if ($m === $method && preg_match($re, $route, $mt) && function_exists($fn)) {
            if ($method !== 'GET') csrf_check();
            $fn(...array_map('intval', array_slice($mt, 1)));
            exit;
        }
    }
    fail(404, 'not_found');
} catch (ApiError $e) {
    out(['error' => $e->getMessage(), 'errors' => $e->errors], $e->status);
} catch (Throwable $e) {
    error_log((string)$e);
    out(['error' => 'server'], 500);
}
