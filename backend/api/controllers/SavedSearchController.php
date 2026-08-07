<?php
declare(strict_types=1);

require_once __DIR__ . '/../services/SavedSearchService.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../helpers/Response.php';

final class SavedSearchController
{
    public static function index(): void
    {
        $payload = AuthMiddleware::requireAuth(['admin']);
        Response::success(SavedSearchService::list((int) $payload['sub']));
    }

    public static function store(): void
    {
        $payload = AuthMiddleware::requireAuth(['admin']);
        $body = self::body();
        try {
            $row = SavedSearchService::create((int) $payload['sub'], $body);
            Response::success($row, 201, 'சேமிக்கப்பட்டது');
        } catch (SavedSearchException $e) {
            Response::error($e->getMessage(), $e->httpCode(), $e->errors());
        }
    }

    public static function destroy(int $id): void
    {
        $payload = AuthMiddleware::requireAuth(['admin']);
        try {
            SavedSearchService::delete($id, (int) $payload['sub']);
            Response::success(null, 200, 'நீக்கப்பட்டது');
        } catch (SavedSearchException $e) {
            Response::error($e->getMessage(), $e->httpCode(), $e->errors());
        }
    }

    private static function body(): array
    {
        $raw = file_get_contents('php://input');
        $decoded = json_decode($raw ?: '[]', true);
        return is_array($decoded) ? $decoded : [];
    }
}
