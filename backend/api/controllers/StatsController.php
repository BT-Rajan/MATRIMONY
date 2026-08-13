<?php
declare(strict_types=1);

require_once __DIR__ . '/../services/StatsService.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../helpers/Response.php';

final class StatsController
{
    public static function overview(): void
    {
        AuthMiddleware::requireAuth(['admin']);
        Response::success(StatsService::overview());
    }

    public static function trend(): void
    {
        AuthMiddleware::requireAuth(['admin']);
        $period = $_GET['period'] ?? 'daily';
        try {
            Response::success(StatsService::registrationTrend($period));
        } catch (StatsException $e) {
            Response::error($e->getMessage(), $e->httpCode());
        }
    }

    public static function payments(): void
    {
        AuthMiddleware::requireAuth(['admin']);
        Response::success(StatsService::payments());
    }
}
