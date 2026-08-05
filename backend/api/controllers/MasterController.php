<?php
declare(strict_types=1);

require_once __DIR__ . '/../services/MasterService.php';
require_once __DIR__ . '/../config/MasterRegistry.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../helpers/Response.php';

final class MasterController
{
    /** GET /masters — the registry itself, for building an admin nav/menu */
    public static function registry(): void
    {
        AuthMiddleware::requireAuth(['admin']);

        $out = [];
        foreach (MasterRegistry::all() as $slug => $config) {
            $out[] = [
                'slug' => $slug,
                'label_ta' => $config['label_ta'],
                'label_en' => $config['label_en'],
                'type' => $config['type'],
                'parent_slug' => $config['parent_slug'] ?? null,
            ];
        }
        Response::success($out);
    }

    public static function index(string $slug): void
    {
        AuthMiddleware::requireAuth(['admin']);
        self::assertSlug($slug);

        $search = isset($_GET['search']) ? trim((string) $_GET['search']) : null;
        $parentId = isset($_GET['parent_id']) && $_GET['parent_id'] !== '' ? (int) $_GET['parent_id'] : null;
        $page = max(1, (int) ($_GET['page'] ?? 1));
        $perPage = min(100, max(1, (int) ($_GET['per_page'] ?? 20)));

        $result = MasterService::list($slug, $search, $parentId, $page, $perPage);

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

    public static function store(string $slug): void
    {
        $payload = AuthMiddleware::requireAuth(['admin']);
        self::assertSlug($slug);

        try {
            $row = MasterService::create($slug, self::body(), (int) $payload['sub']);
            Response::success($row, 201, 'சேமிக்கப்பட்டது');
        } catch (MasterException $e) {
            Response::error($e->getMessage(), $e->httpCode(), $e->errors());
        }
    }

    public static function update(string $slug, int $id): void
    {
        $payload = AuthMiddleware::requireAuth(['admin']);
        self::assertSlug($slug);

        try {
            $row = MasterService::update($slug, $id, self::body(), (int) $payload['sub']);
            Response::success($row, 200, 'புதுப்பிக்கப்பட்டது');
        } catch (MasterException $e) {
            Response::error($e->getMessage(), $e->httpCode(), $e->errors());
        }
    }

    public static function destroy(string $slug, int $id): void
    {
        $payload = AuthMiddleware::requireAuth(['admin']);
        self::assertSlug($slug);

        try {
            MasterService::delete($slug, $id, (int) $payload['sub']);
            Response::success(null, 200, 'நீக்கப்பட்டது');
        } catch (MasterException $e) {
            Response::error($e->getMessage(), $e->httpCode(), $e->errors());
        }
    }

    private static function assertSlug(string $slug): void
    {
        if (!MasterRegistry::exists($slug)) {
            Response::error('இந்த மாஸ்டர் வகை கிடைக்கவில்லை', 404);
        }
    }

    private static function body(): array
    {
        $raw = file_get_contents('php://input');
        $decoded = json_decode($raw ?: '[]', true);
        return is_array($decoded) ? $decoded : [];
    }
}
