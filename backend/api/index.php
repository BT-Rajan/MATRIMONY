<?php
declare(strict_types=1);

require_once __DIR__ . '/config/Config.php';
require_once __DIR__ . '/middleware/Cors.php';
require_once __DIR__ . '/helpers/Response.php';
require_once __DIR__ . '/helpers/Logger.php';

Cors::handle();

set_exception_handler(function (Throwable $e): void {
    Logger::error($e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    Response::error('எதிர்பாராத பிழை ஏற்பட்டது', 500);
});

// Strip the base path so this works whether the app sits at the domain
// root or in a subfolder (e.g. /matrimony/backend/api).
$scriptDir = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME']));
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = '/' . ltrim(substr($uri, strlen($scriptDir)), '/');
$path = rtrim($path, '/');
if ($path === '') {
    $path = '/';
}
$method = $_SERVER['REQUEST_METHOD'];

require_once __DIR__ . '/controllers/AuthController.php';

$routes = [
    'POST /auth/admin/login' => [AuthController::class, 'loginAdmin'],
    'POST /auth/member/login' => [AuthController::class, 'loginMember'],
    'GET /auth/me' => [AuthController::class, 'me'],
    'POST /auth/logout' => [AuthController::class, 'logout'],
];

$key = "{$method} {$path}";

if (!isset($routes[$key])) {
    Response::error('பாதை கிடைக்கவில்லை', 404);
}

[$controller, $action] = $routes[$key];
$controller::$action();
