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

        $page = max(1, (int) ($_GET['page'] ?? 1));
        $perPage = min(100, max(1, (int) ($_GET['per_page'] ?? 20)));

        $result = MemberAdminService::list(self::parseFilters(), $page, $perPage);

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

    /** GET /admin/members/export — same filters as index, streams a CSV instead of JSON. */
    public static function export(): void
    {
        AuthMiddleware::requireAuth(['admin']);

        $rows = MemberAdminService::exportRows(self::parseFilters());

        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="members-' . date('Y-m-d-His') . '.csv"');

        $out = fopen('php://output', 'w');
        fwrite($out, "\xEF\xBB\xBF"); // UTF-8 BOM so Tamil text opens correctly in Excel

        $headers = ['registration_number', 'name_tamil', 'name_english', 'gender', 'mobile', 'whatsapp', 'email',
            'status', 'is_verified', 'age', 'height_cm', 'weight_kg', 'marital_status', 'native_place',
            'state', 'country', 'created_at'];
        fputcsv($out, $headers);
        foreach ($rows as $row) {
            fputcsv($out, array_map(fn($h) => $row[$h] ?? '', $headers));
        }
        fclose($out);
        exit;
    }

    /** GET /admin/members/booklet — same filters as index, joined against master tables for display names. */
    public static function booklet(): void
    {
        AuthMiddleware::requireAuth(['admin']);
        $rows = MemberAdminService::bookletRows(self::parseFilters());
        Response::success($rows);
    }

    private static function parseFilters(): array
    {
        return [
            'search' => trim((string) ($_GET['search'] ?? '')),
            'registration_number' => trim((string) ($_GET['registration_number'] ?? '')),
            'status' => $_GET['status'] ?? '',
            'gender' => $_GET['gender'] ?? '',
            'is_verified' => $_GET['is_verified'] ?? '',
            'religion_id' => $_GET['religion_id'] ?? '',
            'caste_id' => $_GET['caste_id'] ?? '',
            'district_id' => $_GET['district_id'] ?? '',
            'education_id' => $_GET['education_id'] ?? '',
            'occupation_id' => $_GET['occupation_id'] ?? '',
            'income_id' => $_GET['income_id'] ?? '',
            'star_id' => $_GET['star_id'] ?? '',
            'rasi_id' => $_GET['rasi_id'] ?? '',
            'dosham_id' => $_GET['dosham_id'] ?? '',
            'state' => trim((string) ($_GET['state'] ?? '')),
            'country' => trim((string) ($_GET['country'] ?? '')),
            'phone' => trim((string) ($_GET['phone'] ?? '')),
            'email' => trim((string) ($_GET['email'] ?? '')),
            'age_min' => $_GET['age_min'] ?? '',
            'age_max' => $_GET['age_max'] ?? '',
            'height_min' => $_GET['height_min'] ?? '',
            'height_max' => $_GET['height_max'] ?? '',
            'weight_min' => $_GET['weight_min'] ?? '',
            'weight_max' => $_GET['weight_max'] ?? '',
            'photo_available' => $_GET['photo_available'] ?? '',
            'horoscope_available' => $_GET['horoscope_available'] ?? '',
            'payment' => $_GET['payment'] ?? '',
            'event_id' => $_GET['event_id'] ?? '',
            'reference' => trim((string) ($_GET['reference'] ?? '')),
        ];
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
