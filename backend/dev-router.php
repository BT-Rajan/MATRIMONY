<?php
// Dev only: php -S 127.0.0.1:8000 -t public backend/dev-router.php
$p = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if (str_starts_with($p, '/api/')) {
    require __DIR__ . '/../public/api/index.php';
    return true;
}
return false;
