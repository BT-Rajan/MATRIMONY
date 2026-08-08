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
require_once __DIR__ . '/controllers/MasterController.php';
require_once __DIR__ . '/controllers/RegistrationController.php';
require_once __DIR__ . '/controllers/AdminMemberController.php';
require_once __DIR__ . '/controllers/SavedSearchController.php';
require_once __DIR__ . '/controllers/StatsController.php';
require_once __DIR__ . '/controllers/NotificationController.php';

// Static, exact-match routes.
$routes = [
    'POST /auth/admin/login' => [AuthController::class, 'loginAdmin'],
    'POST /auth/member/login' => [AuthController::class, 'loginMember'],
    'GET /auth/me' => [AuthController::class, 'me'],
    'POST /auth/logout' => [AuthController::class, 'logout'],
    'GET /masters' => [MasterController::class, 'registry'],

    // Registration wizard. Steps 1/2/3/5 accept file uploads, so they are
    // POST (multipart/form-data) rather than PUT — PHP does not populate
    // $_FILES for PUT requests. Step 4 has no file, so it accepts JSON via PUT.
    'POST /registration/step1' => [RegistrationController::class, 'step1'],
    'POST /registration/step2' => [RegistrationController::class, 'step2'],
    'POST /registration/step3' => [RegistrationController::class, 'step3'],
    'PUT /registration/step4' => [RegistrationController::class, 'step4'],
    'POST /registration/step5' => [RegistrationController::class, 'step5'],
    'GET /registration/me' => [RegistrationController::class, 'me'],
    'GET /admin/members' => [AdminMemberController::class, 'index'],
    'GET /admin/members/export' => [AdminMemberController::class, 'export'],
    'GET /admin/members/booklet' => [AdminMemberController::class, 'booklet'],
    'GET /admin/saved-searches' => [SavedSearchController::class, 'index'],
    'POST /admin/saved-searches' => [SavedSearchController::class, 'store'],
    'GET /admin/stats/overview' => [StatsController::class, 'overview'],
    'GET /admin/stats/trend' => [StatsController::class, 'trend'],
    'GET /admin/stats/payments' => [StatsController::class, 'payments'],
    'GET /admin/stats/events' => [StatsController::class, 'events'],
    'GET /admin/notifications' => [NotificationController::class, 'index'],
    'GET /admin/notifications/counts' => [NotificationController::class, 'counts'],
    'GET /admin/notifications/channel-status' => [NotificationController::class, 'channelStatus'],
];

$key = "{$method} {$path}";

if (isset($routes[$key])) {
    [$controller, $action] = $routes[$key];
    $controller::$action();
    exit;
}

// Pattern routes: /masters/{slug} and /masters/{slug}/{id}
// {slug} is restricted to lowercase letters/hyphens (matches MasterRegistry keys).
$patternRoutes = [
    ['GET', '#^/masters/([a-z-]+)$#', [MasterController::class, 'index']],
    ['POST', '#^/masters/([a-z-]+)$#', [MasterController::class, 'store']],
    ['PUT', '#^/masters/([a-z-]+)/(\d+)$#', [MasterController::class, 'update']],
    ['DELETE', '#^/masters/([a-z-]+)/(\d+)$#', [MasterController::class, 'destroy']],

    ['GET', '#^/admin/members/(\d+)$#', [AdminMemberController::class, 'show']],
    ['PUT', '#^/admin/members/(\d+)$#', [AdminMemberController::class, 'update']],
    ['DELETE', '#^/admin/members/(\d+)$#', [AdminMemberController::class, 'destroy']],
    ['POST', '#^/admin/members/(\d+)/approve$#', [AdminMemberController::class, 'approve']],
    ['POST', '#^/admin/members/(\d+)/reject$#', [AdminMemberController::class, 'reject']],
    ['POST', '#^/admin/members/(\d+)/verify$#', [AdminMemberController::class, 'verify']],
    ['POST', '#^/admin/members/(\d+)/unverify$#', [AdminMemberController::class, 'unverify']],
    ['POST', '#^/admin/members/(\d+)/deactivate$#', [AdminMemberController::class, 'deactivate']],
    ['POST', '#^/admin/members/(\d+)/reactivate$#', [AdminMemberController::class, 'reactivate']],
    ['POST', '#^/admin/members/(\d+)/archive$#', [AdminMemberController::class, 'archive']],
    ['PUT', '#^/admin/members/(\d+)/event$#', [AdminMemberController::class, 'updateEvent']],
    ['DELETE', '#^/admin/saved-searches/(\d+)$#', [SavedSearchController::class, 'destroy']],
    ['GET', '#^/admin/stats/breakdown/([a-z]+)$#', [StatsController::class, 'breakdown']],
];

foreach ($patternRoutes as [$routeMethod, $pattern, $handler]) {
    if ($method !== $routeMethod) {
        continue;
    }
    if (preg_match($pattern, $path, $matches)) {
        [$controller, $action] = $handler;
        $args = array_slice($matches, 1);
        // Cast numeric id segments to int for the controller signature.
        $args = array_map(fn($v) => ctype_digit($v) ? (int) $v : $v, $args);
        $controller::$action(...$args);
        exit;
    }
}

Response::error('பாதை கிடைக்கவில்லை', 404);
