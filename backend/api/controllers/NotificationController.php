<?php
declare(strict_types=1);

require_once __DIR__ . '/../services/NotificationAdminService.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../helpers/Response.php';

final class NotificationController
{
    public static function index(): void
    {
        AuthMiddleware::requireAuth(['admin']);

        $filters = [
            'member_id' => $_GET['member_id'] ?? '',
            'channel' => $_GET['channel'] ?? '',
            'status' => $_GET['status'] ?? '',
            'event_type' => $_GET['event_type'] ?? '',
        ];
        $page = max(1, (int) ($_GET['page'] ?? 1));
        $perPage = min(100, max(1, (int) ($_GET['per_page'] ?? 20)));

        $result = NotificationAdminService::list($filters, $page, $perPage);

        Response::success([
            'items' => $result['items'],
            'meta' => [
                'total' => $result['total'],
                'page' => $page,
                'per_page' => $perPage,
                'total_pages' => (int) ceil($result['total'] / $perPage),
            ],
        ]);
    }

    public static function counts(): void
    {
        AuthMiddleware::requireAuth(['admin']);
        Response::success(NotificationAdminService::counts());
    }

    public static function channelStatus(): void
    {
        AuthMiddleware::requireAuth(['admin']);
        Response::success(NotificationAdminService::channelStatus());
    }
}
