<?php
declare(strict_types=1);
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/helpers.php';

apply_cors();
session_start();
$_SESSION = [];
session_destroy();
json_out(['ok' => true]);
