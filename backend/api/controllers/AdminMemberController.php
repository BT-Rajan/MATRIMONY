<?php
declare(strict_types=1);

require_once __DIR__ . '/../services/MemberAdminService.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../helpers/Response.php';

final class AdminMemberController
{
    public static function index(): void
    {
        AuthMiddleware::requireAuth(['admin']);

        $filters = [
            'search' => trim((string) ($_GET['search'] ?? '')),
            'status' => $_GET['status'] ?? '',
            'gender' => $_GET['gender'] ?? '',
            'is_verified' => $_GET['is_verified'] ?? '',
            'religion_id' => $_GET['religion_id'] ?? '',
            'district_id' => $_GET['district_id'] ?? '',
        ];
        $page = max(1, (int) ($_GET['page'] ?? 1));
        $perPage = min(100, max(1, (int) ($_GET['per_page'] ?? 20)));

        $result = MemberAdminService::list($filters, $page, $perPage);

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

    public static function show(int $id): void
    {
        AuthMiddleware::requireAuth(['admin']);
        self::respond(fn() => MemberAdminService::show($id));
    }

    public static function approve(int $id): void
    {
        $payload = AuthMiddleware::requireAuth(['admin']);
        self::respond(fn() => MemberAdminService::approve($id, (int) $payload['sub']), 'அனுமதிக்கப்பட்டது');
    }

    public static function reject(int $id): void
    {
        $payload = AuthMiddleware::requireAuth(['admin']);
        $body = self::body();
        self::respond(fn() => MemberAdminService::reject($id, (int) $payload['sub'], $body['reason'] ?? ''), 'நிராகரிக்கப்பட்டது');
    }

    public static function verify(int $id): void
    {
        $payload = AuthMiddleware::requireAuth(['admin']);
        self::respond(fn() => MemberAdminService::setVerified($id, true, (int) $payload['sub']), 'சரிபார்க்கப்பட்டது');
    }

    public static function unverify(int $id): void
    {
        $payload = AuthMiddleware::requireAuth(['admin']);
        self::respond(fn() => MemberAdminService::setVerified($id, false, (int) $payload['sub']), 'சரிபார்ப்பு நீக்கப்பட்டது');
    }

    public static function deactivate(int $id): void
    {
        $payload = AuthMiddleware::requireAuth(['admin']);
        self::respond(fn() => MemberAdminService::deactivate($id, (int) $payload['sub']), 'முடக்கப்பட்டது');
    }

    public static function reactivate(int $id): void
    {
        $payload = AuthMiddleware::requireAuth(['admin']);
        self::respond(fn() => MemberAdminService::reactivate($id, (int) $payload['sub']), 'மீண்டும் செயல்படுத்தப்பட்டது');
    }

    public static function archive(int $id): void
    {
        $payload = AuthMiddleware::requireAuth(['admin']);
        self::respond(fn() => MemberAdminService::archive($id, (int) $payload['sub']), 'காப்பகப்படுத்தப்பட்டது');
    }

    public static function destroy(int $id): void
    {
        $payload = AuthMiddleware::requireAuth(['admin']);
        try {
            MemberAdminService::delete($id, (int) $payload['sub']);
            Response::success(null, 200, 'நீக்கப்பட்டது');
        } catch (MemberAdminException $e) {
            Response::error($e->getMessage(), $e->httpCode(), $e->errors());
        }
    }

    public static function update(int $id): void
    {
        $payload = AuthMiddleware::requireAuth(['admin']);
        $body = self::body();
        self::respond(fn() => MemberAdminService::updateCore($id, (int) $payload['sub'], $body), 'புதுப்பிக்கப்பட்டது');
    }

    public static function updateEvent(int $id): void
    {
        $payload = AuthMiddleware::requireAuth(['admin']);
        $body = self::body();
        self::respond(fn() => MemberAdminService::updateEventParticipation($id, (int) $payload['sub'], $body), 'புதுப்பிக்கப்பட்டது');
    }

    private static function respond(callable $action, ?string $message = null): void
    {
        try {
            $data = $action();
            Response::success($data, 200, $message);
        } catch (MemberAdminException $e) {
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
